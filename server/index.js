import express from 'express';
import dotenv from 'dotenv';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { AdviceRequestSchema, AdviceResponseSchema } from './schema.js';
import { groundAirContext } from './airContext.js';
import { generateRuleBasedAdvice, isUrgentQuestion } from '../shared/advice.mjs';
import { createGroundStationService } from './groundStations.js';
import { safeError, structuredLog } from './logging.js';

const entry = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(entry), '..');

const DEFAULT_ORIGINS = ['http://localhost:3000', 'http://127.0.0.1:3000'];
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const MAX_TRACKED_CLIENTS = 10000;

export function parseTrustProxyHops(value) {
  if (value === undefined || value.trim() === '') return false;
  const hops = Number(value);
  if (!Number.isSafeInteger(hops) || hops < 0) {
    throw new Error('AURA_TRUST_PROXY must be a non-negative integer.');
  }
  return hops;
}

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

export function createApp({
  production = false,
  origins = production ? [] : DEFAULT_ORIGINS,
  trustProxy = false,
  logger = console,
  groundStationFetch = fetch
} = {}) {
  const app = express();
  const allowedOrigins = new Set(origins);
  const json = express.json({ limit: '20kb', strict: true });
  const groundStations = createGroundStationService({ fetchImpl: groundStationFetch });

  app.disable('x-powered-by');
  app.set('trust proxy', trustProxy);
  app.use((req, res, next) => {
    req.requestId = randomUUID();
    res.set('X-Request-ID', req.requestId);
    next();
  });
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
    res.json({
      status: 'ok',
      assistantMode: 'local-guidance',
      liveAdvisorEnabled: false
    });
  });
  app.get('/api/monitor', rateLimiter(20), async (req, res) => {
    const latitude = Number(req.query.lat);
    const longitude = Number(req.query.lon);
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90
      || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      return res.status(400).json({ status: 'invalid_request', error: 'Provide valid latitude and longitude.' });
    }
    try {
      const stationRequest = new AbortController();
      res.once('close', () => {
        if (!res.writableEnded) stationRequest.abort();
      });
      return res.json(await groundStations.getNearestStation(latitude, longitude, stationRequest.signal));
    } catch (error) {
      structuredLog(logger, 'warn', {
        timestamp: new Date().toISOString(),
        event: 'ground_station_lookup_failed',
        requestId: req.requestId,
        method: req.method,
        path: req.path,
        status: Number.isInteger(error?.status) ? error.status : undefined,
        error: safeError(error)
      });
      return res.status(503).json({ status: 'unavailable', error: 'Ground-monitor data is temporarily unavailable.' });
    }
  });
  app.post('/api/advice', rateLimiter(30), json, (req, res, next) => {
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
    try {
      const advice = generateRuleBasedAdvice(input);
      const mode = urgent ? 'safety-guidance' : 'local-guidance';
      const validated = AdviceResponseSchema.parse(advice);
      res.set('X-Aura-Advice-Mode', mode);
      return res.json({ ...validated, mode });
    } catch (error) {
      if (!res.destroyed) return next(error);
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
    let status = Number.isInteger(error.status) ? error.status : 500;
    let publicError = 'The server could not complete this request.';
    if (error.type === 'entity.too.large') {
      status = 413;
      publicError = 'Request body exceeds the 20 kB limit.';
    } else if (error.type === 'entity.parse.failed') {
      status = 400;
      publicError = 'Request body must be valid JSON.';
    } else if (status === 415) {
      publicError = 'Use a supported JSON encoding.';
    } else if (status < 400 || status > 599) {
      status = 500;
    }
    structuredLog(logger, status >= 500 ? 'error' : 'warn', {
      timestamp: new Date().toISOString(),
      event: 'http_request_error',
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      status,
      error: status >= 500 ? safeError(error) : {
        name: typeof error?.name === 'string' ? error.name : 'ClientRequestError',
        type: typeof error?.type === 'string' ? error.type : undefined
      }
    });
    return res.status(status).json({ error: publicError, requestId: req.requestId });
  });

  return app;
}

const isMain = process.argv[1] && entry === path.resolve(process.argv[1]);
if (isMain) {
  dotenv.config({ path: path.join(projectRoot, '.env') });
  const { CORS_ORIGIN, AURA_TRUST_PROXY } = process.env;
  const port = Number(process.env.PORT || 3001);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be an integer between 1 and 65535.');
  const app = createApp({
    production: process.env.NODE_ENV === 'production' || process.argv.includes('--production'),
    origins: CORS_ORIGIN?.split(',').map((value) => value.trim()).filter(Boolean),
    trustProxy: parseTrustProxyHops(AURA_TRUST_PROXY)
  });
  app.listen(port, () => console.log(`Aura listening on port ${port}. Advice runs locally without provider credentials.`));
}

export default createApp();
