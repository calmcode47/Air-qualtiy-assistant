const DEFAULT_RENDER_API_URL = 'https://aura-air-quality-api.onrender.com';
const MAX_REQUEST_BODY_BYTES = 20 * 1024;
const ALLOWED_API_PATHS = new Set(['health', 'advice', 'monitor']);

function resolveApiPath(request, incomingUrl) {
  const pathFromUrl = incomingUrl.pathname.split('/').filter(Boolean);
  const apiIndex = pathFromUrl.indexOf('api');
  if (apiIndex >= 0) {
    const route = pathFromUrl.slice(apiIndex + 1);
    if (route[0] === 'aura') route.shift();
    const path = route.join('/');
    if (ALLOWED_API_PATHS.has(path)) return path;
  }

  const querySegments = request.query?.path;
  const route = (Array.isArray(querySegments) ? querySegments : [querySegments])
    .filter((segment) => typeof segment === 'string' && segment.length > 0)
    .filter((segment) => segment !== 'api' && segment !== 'aura');
  return route.join('/');
}

async function readRequestBody(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > MAX_REQUEST_BODY_BYTES) return null;
    chunks.push(buffer);
  }
  return Buffer.concat(chunks);
}

function createProxyHandler({
  fetchImpl = fetch,
  apiOrigin = process.env.AURA_RENDER_API_URL || DEFAULT_RENDER_API_URL,
  edgeToken = process.env.AURA_EDGE_TOKEN,
  timeoutMs = 34_000
} = {}) {
  return async function proxyApiRequest(request, response) {
    if (typeof edgeToken !== 'string' || edgeToken.length < 32) {
      response.statusCode = 503;
      response.setHeader('Content-Type', 'application/json; charset=utf-8');
      return response.end(JSON.stringify({ error: 'API proxy is not configured.' }));
    }

    const incomingUrl = new URL(request.url || '/', 'https://vercel.invalid');
    const path = resolveApiPath(request, incomingUrl);
    if (!ALLOWED_API_PATHS.has(path)) {
      response.statusCode = 404;
      return response.end(JSON.stringify({ error: 'API route not found.' }));
    }
    if (!['GET', 'POST'].includes(request.method)) {
      response.setHeader('Allow', 'GET, POST');
      response.statusCode = 405;
      return response.end(JSON.stringify({ error: 'Method not allowed.' }));
    }

    const target = new URL(`/api/${path}`, apiOrigin);
    target.search = incomingUrl.search;
    const headers = new Headers({
      'X-Aura-Edge-Token': edgeToken,
      Accept: request.headers?.accept || 'application/json'
    });
    for (const header of ['content-type', 'origin', 'x-forwarded-for', 'x-forwarded-proto', 'x-forwarded-host']) {
      const value = request.headers?.[header];
      if (typeof value === 'string') headers.set(header, value);
    }

    let body;
    if (request.method === 'POST') {
      body = await readRequestBody(request);
      if (body === null) {
        response.statusCode = 413;
        return response.end(JSON.stringify({ error: 'Request body exceeds the 20 kB limit.' }));
      }
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const upstream = await fetchImpl(target, {
        method: request.method,
        headers,
        ...(body ? { body } : {}),
        signal: controller.signal
      });
      upstream.headers.forEach((value, key) => {
        if (!['connection', 'content-length', 'transfer-encoding'].includes(key.toLowerCase())) {
          response.setHeader(key, value);
        }
      });
      response.statusCode = upstream.status;
      return response.end(Buffer.from(await upstream.arrayBuffer()));
    } catch {
      response.statusCode = 502;
      response.setHeader('Content-Type', 'application/json; charset=utf-8');
      return response.end(JSON.stringify({ error: 'The API is temporarily unavailable.' }));
    } finally {
      clearTimeout(timeout);
    }
  };
}

module.exports = { createProxyHandler };
