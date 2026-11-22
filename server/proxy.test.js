import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
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
  assert.equal(forwarded.options.headers.has('x-aura-edge-token') && forwarded.options.headers.get('x-aura-edge-token') !== 'attacker-controlled', true);
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
