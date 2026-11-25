import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { createServer } from 'node:http';
import { gzipSync } from 'node:zlib';
import proxyModule from './vercelProxy.cjs';

const { createProxyHandler } = proxyModule;

function mockResponse() {
  return {
    headers: {},
    statusCode: 200,
    body: undefined,
    setHeader(name, value) { this.headers[name.toLowerCase()] = value; },
    end(value) { this.body = value; }
  };
}

test('Vercel API proxy adds the edge secret and forwards Vercel client IP', async () => {
  let forwarded;
  const handler = createProxyHandler({
    edgeToken: 't'.repeat(40),
    fetchImpl: async (url, options) => {
      forwarded = { url: String(url), options };
      return new Response(JSON.stringify({ status: 'ok' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'X-Request-ID': 'test-id' }
      });
    }
  });
  const request = Readable.from([]);
  Object.assign(request, {
    method: 'GET',
    url: '/api/aura/health?check=1',
    query: { path: ['health'] },
    headers: {
      accept: 'application/json',
      'x-forwarded-for': '198.51.100.22',
      'x-aura-edge-token': 'attacker-controlled'
    }
  });
  const response = mockResponse();

  await handler(request, response);

  assert.equal(response.statusCode, 200);
  assert.equal(forwarded.url, 'https://aura-air-quality-api.onrender.com/api/health?check=1');
  assert.equal(forwarded.options.headers.get('x-aura-edge-token'), 't'.repeat(40));
  assert.equal(forwarded.options.headers.get('x-forwarded-for'), '198.51.100.22');
  assert.equal(forwarded.options.redirect, 'error');
  assert.equal(response.headers['x-request-id'], 'test-id');
  assert.equal(String(response.body), JSON.stringify({ status: 'ok' }));
});

test('Vercel API proxy fails closed when its shared secret is missing', async () => {
  let fetchCalled = false;
  const handler = createProxyHandler({ edgeToken: '', fetchImpl: async () => { fetchCalled = true; } });
  const request = Readable.from([]);
  Object.assign(request, { method: 'GET', url: '/api/aura/health', query: { path: ['health'] }, headers: {} });
  const response = mockResponse();

  await handler(request, response);

  assert.equal(response.statusCode, 503);
  assert.equal(fetchCalled, false);
});

test('Vercel API proxy resolves the rewritten route from the request URL', async () => {
  let forwardedUrl;
  const handler = createProxyHandler({
    edgeToken: 't'.repeat(40),
    fetchImpl: async (url) => {
      forwardedUrl = String(url);
      return new Response(JSON.stringify({ status: 'ok' }), { status: 200 });
    }
  });
  const request = Readable.from([]);
  Object.assign(request, {
    method: 'GET',
    url: '/api/aura/monitor?lat=0&lon=0',
    query: { path: ['aura', 'monitor'] },
    headers: {}
  });
  const response = mockResponse();

  await handler(request, response);

  assert.equal(response.statusCode, 200);
  assert.equal(forwardedUrl, 'https://aura-air-quality-api.onrender.com/api/monitor?lat=0&lon=0');
});

test('serves decoded upstream JSON with its retry metadata', async (t) => {
  const json = JSON.stringify({ error: 'Try again shortly.' });
  const upstream = createServer((_req, res) => {
    res.writeHead(429, { 'Content-Type': 'application/json', 'Content-Encoding': 'gzip', 'Retry-After': '60' });
    res.end(gzipSync(json));
  });
  await new Promise((resolve) => upstream.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => upstream.close(resolve)));
  const handler = createProxyHandler({
    edgeToken: 't'.repeat(40),
    apiOrigin: `http://127.0.0.1:${upstream.address().port}`
  });
  const request = Object.assign(Readable.from([]), { method: 'GET', url: '/api/health' });
  const response = mockResponse();
  await handler(request, response);
  assert.equal(response.statusCode, 429);
  assert.equal(response.headers['retry-after'], '60');
  assert.equal(response.headers['cache-control'], 'no-store');
  assert.equal(response.headers['content-encoding'], undefined);
  assert.equal(String(response.body), json);
});
