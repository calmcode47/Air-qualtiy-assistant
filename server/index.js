import express from 'express';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI } from '@google/genai';
import { AdviceRequestSchema, AdviceResponseSchema } from './schema.js';
import { createAdvisorAccess } from './advisorAccess.js';
import { createGeminiAdvisor } from './geminiAdvice.js';
import { groundAirContext } from './airContext.js';
import { generateRuleBasedAdvice, isUrgentQuestion } from '../shared/advice.mjs';

const entry = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(entry), '..');
dotenv.config({ path: path.join(projectRoot, '.env') });

const DEFAULT_ORIGINS = ['http://localhost:3000', 'http://127.0.0.1:3000'];
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const MAX_TRACKED_CLIENTS = 10000;

function rateLimiter(limit) {
  const requests = new Map();
  let nextSweep = 0;

  return (req, res, next) => {
    const now = Date.now();
    if (now >= nextSweep) {
      for (const [key, entry] of requests) {
        if (entry.expires <= now) requests.delete(key);
      }
      nextSweep = now + 60000;
    }

    const client = req.ip || req.socket.remoteAddress || 'unknown';
    let entry = requests.get(client);
    if (!entry || entry.expires <= now) {
      if (!entry && requests.size >= MAX_TRACKED_CLIENTS) {
        res.set('Retry-After', '60');
        return res.status(503).json({ error: 'Try again shortly.' });
      }
      entry = { count: 0, expires: now + RATE_LIMIT_WINDOW_MS };
      requests.set(client, entry);
    }

    if (entry.count >= limit) {
      res.set('Retry-After', String(Math.ceil((entry.expires - now) / 1000)));
      return res.status(429).json({ error: 'Rate limit exceeded. Try again after the retry period.' });
    }
    entry.count += 1;
    return next();
  };
}

function allowedOrigin(req, origin, allowedOrigins) {
  if (!origin || allowedOrigins.has(origin)) return true;
  try {
    const url = new URL(origin);
    return ['http:', 'https:'].includes(url.protocol) && url.host === req.get('host');
  } catch {
    return false;
  }
}

function sendAdvice(req, res, advice, mode, stream) {
  const validated = AdviceResponseSchema.parse(advice);
  res.set('X-Aura-Advice-Mode', mode);
  if (stream || req.headers.accept === 'text/event-stream') {
    res.set({ 'Content-Type': 'text/event-stream; charset=utf-8', 'X-Accel-Buffering': 'no' });
    return res.end(`data: ${JSON.stringify({ complete: true, advice: validated, mode })}\n\n`);
  }
  return res.json({ ...validated, mode });
}

export function createApp({
  advise,
  accessCode,
  production = false,
  origins = production ? [] : DEFAULT_ORIGINS,
  trustProxy = false
} = {}) {
  if (advise && (!accessCode || accessCode.length < 24 || accessCode.length > 256)) {
    throw new Error('GEMINI_API_KEY requires AURA_ADVISOR_ACCESS_CODE to be 24–256 characters. Generate a random access code.');
  }

  const app = express();
  const access = createAdvisorAccess(accessCode, production);
  const allowedOrigins = new Set(origins);
  const json = express.json({ limit: '20kb', strict: true });

  app.disable('x-powered-by');
  app.set('trust proxy', trustProxy);
  app.use((req, res, next) => {
    res.set({
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(self)'
    });
    next();
  });
  app.use('/api', (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    if (!allowedOrigin(req, req.get('origin'), allowedOrigins)) {
      return res.status(403).json({ error: 'Origin is not allowed.' });
    }
    return next();
  });

  app.get('/api/health', (req, res) => {
    const authenticated = access.isAuthenticated(req);
    res.json({
      status: 'ok',
      assistantMode: advise && authenticated ? 'gemini' : 'offline-demo',
      liveAdvisorEnabled: Boolean(advise),
      authenticated
    });
  });
  app.post('/api/session', rateLimiter(6), json, access.login);
  app.delete('/api/session', access.logout);
  app.post('/api/advice', rateLimiter(30), json, async (req, res, next) => {
    if (typeof req.body?.message === 'string' && req.body.message.length > 600) {
      return res.status(400).json({ error: 'User message cannot exceed 600 characters.' });
    }
    const result = AdviceRequestSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Invalid advice request. Check message, profile, language, history, and air data.' });
    }
    const request = result.data;
    const input = { ...request, airData: groundAirContext(request.airData) };
    const urgent = isUrgentQuestion(request.message);
    const useGemini = !urgent && !request.mock && advise && access.isAuthenticated(req);
    const connection = new AbortController();
    res.once('close', () => connection.abort());
    try {
      const { advice, mode } = useGemini
        ? await advise(input, connection.signal)
        : { advice: generateRuleBasedAdvice(input), mode: urgent ? 'safety-guidance' : 'offline-demo' };
      if (!res.destroyed) return sendAdvice(req, res, advice, mode, request.stream);
    } catch (error) {
      if (!res.destroyed) next(error);
    }
  });

  app.use('/api', (req, res) => res.status(404).json({ error: 'API route not found.' }));

  if (production) {
    const dist = path.join(projectRoot, 'frontend', 'dist');
    app.use((req, res, next) => {
      res.set('Content-Security-Policy', [
        "default-src 'self'",
        "base-uri 'self'",
        "frame-ancestors 'none'",
        "form-action 'self'",
        "script-src 'self'",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: blob:",
        "connect-src 'self' https://air-quality-api.open-meteo.com https://api.open-meteo.com https://geocoding-api.open-meteo.com"
      ].join('; '));
      next();
    });
    app.use(express.static(dist, { index: false }));
    app.get('*', (req, res, next) => {
      if (path.extname(req.path)) return next();
      res.set('Cache-Control', 'no-cache');
      return res.sendFile(path.join(dist, 'index.html'));
    });
  }

  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    if (error.type === 'entity.too.large') return res.status(413).json({ error: 'Request body exceeds the 20 kB limit.' });
    if (error.type === 'entity.parse.failed') return res.status(400).json({ error: 'Request body must be valid JSON.' });
    if (error.status === 415) return res.status(415).json({ error: 'Use a supported JSON encoding.' });
    console.error('Aura request could not be completed.');
    return res.status(500).json({ error: 'The server could not complete this request.' });
  });

  return app;
}

const isMain = process.argv[1] && entry === path.resolve(process.argv[1]);
if (isMain) {
  const { GEMINI_API_KEY, GEMINI_MODEL, AURA_ADVISOR_ACCESS_CODE, VITE_USE_MOCK, CORS_ORIGIN, AURA_TRUST_PROXY } = process.env;
  const port = Number(process.env.PORT || 3001);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be an integer between 1 and 65535.');
  const advise = GEMINI_API_KEY && VITE_USE_MOCK !== 'true'
    ? createGeminiAdvisor(new GoogleGenAI({ apiKey: GEMINI_API_KEY, apiVersion: 'v1beta' }), GEMINI_MODEL || 'gemini-3.8-flash')
    : undefined;
  const app = createApp({
    advise,
    accessCode: advise ? AURA_ADVISOR_ACCESS_CODE : undefined,
    production: process.env.NODE_ENV === 'production' || process.argv.includes('--production'),
    origins: CORS_ORIGIN?.split(',').map((value) => value.trim()).filter(Boolean),
    trustProxy: AURA_TRUST_PROXY === '1' ? 1 : false
  });
  app.listen(port, () => console.log(`Aura listening on port ${port}. Live advisor ${advise ? 'enabled with access code' : 'disabled'}.`));
}

export default createApp();
