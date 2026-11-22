import { test } from 'node:test';
import assert from 'node:assert/strict';
import app, { createApp, parseTrustProxyHops } from './index.js';
import { AdviceResponseSchema } from './schema.js';
import { generateRuleBasedAdvice } from '../shared/advice.mjs';
import { createGroundStationService } from './groundStations.js';

const stationFixtureNow = Date.now();
const stationObservedAt = new Date(stationFixtureNow - 60 * 60 * 1000).toISOString();
const stationFeed = {
  generated_at: new Date(stationFixtureNow).toISOString(),
  records: [
    {
      city: 'Delhi', station: 'Anand Vihar, Delhi - DPCC', pollutant: 'PM2.5', avg: 42.56,
      latitude: 28.647622, longitude: 77.315809, updated_at: stationObservedAt
    },
    {
      city: 'Delhi', station: 'Anand Vihar, Delhi - DPCC', pollutant: 'PM10', avg: 78,
      latitude: 28.647622, longitude: 77.315809, updated_at: stationObservedAt
    },
    {
      city: 'Delhi', station: 'ITO, Delhi - CPCB', pollutant: 'PM2.5', avg: 100,
      latitude: 28.628624, longitude: 77.24106, updated_at: stationObservedAt
    }
  ]
};

function responseFor(data, status = 200) {
  const body = JSON.stringify(data);
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => body
  };
}

async function withServer(t, serverApp = app) {
  const server = serverApp.listen(0);
  t.after(() => server.close());
  await new Promise((resolve) => server.once('listening', resolve));
  return `http://127.0.0.1:${server.address().port}/api`;
}

test('GET /api/health reports keyless local guidance mode', async (t) => {
  const baseUrl = await withServer(t);
  const response = await fetch(`${baseUrl}/health`);
  const result = await response.json();
  assert.equal(response.status, 200);
  assert.equal(result.status, 'ok');
  assert.equal(result.assistantMode, 'local-guidance');
  assert.equal(result.liveAdvisorEnabled, false);
});

test('proxy-hop parsing accepts numeric hop counts and rejects malformed settings', () => {
  assert.equal(parseTrustProxyHops(undefined), false);
  assert.equal(parseTrustProxyHops('2'), 2);
  assert.throws(() => parseTrustProxyHops('1.5'), /non-negative integer/);
  assert.throws(() => parseTrustProxyHops('-1'), /non-negative integer/);
});

test('POST /api/advice returns schema-valid personalized local guidance without credentials', async (t) => {
  const baseUrl = await withServer(t);
  const response = await fetch(`${baseUrl}/advice`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'How do I protect my child on the school run?',
      profile: { children: 1, purifierOwned: 'none' },
      airData: { name: 'Delhi NCR', aqi: 382, isLive: true }
    })
  });
  const result = await response.json();
  const { mode, ...advice } = result;
  assert.equal(response.status, 200);
  assert.equal(mode, 'local-guidance');
  assert.equal(AdviceResponseSchema.safeParse(advice).success, true);
  assert.ok(advice.recommendations.length > 0);
  assert.match(advice.recommendations.find((item) => item.id === 'cleaner-indoor-air').action, /no-cost source control/i);
});

test('rule-based shared advice validates and addresses the houseplant myth', () => {
  const advice = generateRuleBasedAdvice({
    message: 'Will houseplants clean the indoor smog?',
    airData: { name: 'Delhi', aqi: 415, isLive: true },
    language: 'en'
  });
  assert.equal(AdviceResponseSchema.safeParse(advice).success, true);
  assert.match(advice.recommendations.find((item) => item.id === 'plants-and-filtration').action, /Do not rely on houseplants/i);
});

test('urgent questions receive the translated safety guidance immediately', async (t) => {
  const baseUrl = await withServer(t);
  const response = await fetch(`${baseUrl}/advice`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'I cannot breathe', language: 'hi' })
  });
  const result = await response.json();
  assert.equal(result.mode, 'safety-guidance');
  assert.match(result.summary, /आपातकालीन/);
});

test('advice uses a ground-monitor observation in context without treating it as the selected-location reading', async (t) => {
  const baseUrl = await withServer(t);
  const response = await fetch(`${baseUrl}/advice`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Should my family spend time outdoors?',
      groundMonitor: {
        status: 'available', source: 'CPCB via data.gov.in', locationName: 'Anand Vihar station', city: 'Delhi',
        distanceKm: 2.8, generatedAt: '2026-11-22T09:30:00Z', cached: false,
        measurements: [{ parameter: 'PM2.5', value: 42.6, unit: 'µg/m³', observedAt: '2026-11-22T08:30:00Z' }]
      }
    })
  });
  const result = await response.json();
  assert.equal(response.status, 200);
  assert.match(result.summary, /Anand Vihar station/);
  assert.match(result.summary, /not a reading at your location/);
  assert.match(result.summary, /PM2.5 42.6 µg\/m³/);
});

test('request length, size, and schema limits are enforced', async (t) => {
  const baseUrl = await withServer(t);
  const longMessage = await fetch(`${baseUrl}/advice`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'x'.repeat(601) })
  });
  assert.equal(longMessage.status, 400);
  assert.match((await longMessage.json()).error, /600 characters/);

  const largePayload = await fetch(`${baseUrl}/advice`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'test', padding: 'x'.repeat(22 * 1024) })
  });
  assert.equal(largePayload.status, 413);
  assert.match((await largePayload.json()).error, /20 kB/);

  const invalidHistory = await fetch(`${baseUrl}/advice`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'What about tomorrow?', history: Array.from({ length: 7 }, () => ({ role: 'user', content: 'Hi' })) })
  });
  assert.equal(invalidHistory.status, 400);
});

test('ground-monitor route returns the closest CPCB reading without sending credentials', async (t) => {
  const requests = [];
  const appWithFeed = createApp({
    origins: [],
    groundStationFetch: async (url, options) => {
      requests.push({ url: String(url), options });
      return responseFor(stationFeed);
    }
  });
  const baseUrl = await withServer(t, appWithFeed);
  const response = await fetch(`${baseUrl}/monitor?lat=28.65&lon=77.32`);
  const station = await response.json();
  assert.equal(response.status, 200);
  assert.equal(station.status, 'available');
  assert.equal(station.locationName, 'Anand Vihar, Delhi - DPCC');
  assert.equal(station.distanceKm, 0.5);
  assert.deepEqual(station.measurements.map(({ parameter, value, unit }) => ({ parameter, value, unit })), [
    { parameter: 'PM10', value: 78, unit: 'µg/m³' },
    { parameter: 'PM2.5', value: 42.6, unit: 'µg/m³' }
  ]);
  assert.equal(station.source, 'CPCB via data.gov.in');
  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, 'https://snapdata.dev/api/v1/aqi/in/latest.json');
  assert.deepEqual(requests[0].options.headers, { Accept: 'application/json' });
  assert.equal(JSON.stringify(station).includes('28.647622'), false);
});

test('ground-monitor lookup skips null and older-than-six-hour readings and uses the next station', async () => {
  const service = createGroundStationService({
    now: () => Date.parse('2026-11-22T12:00:00Z'),
    fetchImpl: async () => responseFor({
      generated_at: '2026-11-22T11:30:00Z',
      records: [
        { city: 'Delhi', station: 'Closest', pollutant: 'PM2.5', avg: 0, latitude: 28.61, longitude: 77.21, updated_at: '2026-11-22T05:00:00Z' },
        { city: 'Delhi', station: 'Next', pollutant: 'PM2.5', avg: 52, latitude: 28.62, longitude: 77.22, updated_at: '2026-11-22T10:00:00Z' },
        { city: 'Delhi', station: 'Next', pollutant: 'PM10', avg: null, latitude: 28.62, longitude: 77.22, updated_at: '2026-11-22T10:00:00Z' }
      ]
    })
  });

  const result = await service.getNearestStation(28.61, 77.21);
  assert.equal(result.locationName, 'Next');
  assert.deepEqual(result.measurements.map(({ parameter, value }) => ({ parameter, value })), [
    { parameter: 'PM2.5', value: 52 }
  ]);
});

test('ground-monitor route validates coordinates and reports unsupported regions', async (t) => {
  const baseUrl = await withServer(t, createApp({ groundStationFetch: async () => { throw new Error('should not fetch'); } }));
  const invalid = await fetch(`${baseUrl}/monitor?lat=100&lon=77`);
  assert.equal(invalid.status, 400);
  assert.equal((await invalid.json()).status, 'invalid_request');
  const unsupported = await fetch(`${baseUrl}/monitor?lat=40.7&lon=-74`);
  assert.equal(unsupported.status, 200);
  assert.equal((await unsupported.json()).status, 'unsupported_region');
});

test('server logs station upstream failures with a request ID and without request data', async (t) => {
  const logLines = [];
  const appWithFailure = createApp({
    origins: [],
    groundStationFetch: async () => { throw new Error('upstream connection failed'); },
    logger: { warn: (line) => logLines.push(line) }
  });
  const baseUrl = await withServer(t, appWithFailure);
  const response = await fetch(`${baseUrl}/monitor?lat=28.61&lon=77.21`);
  const body = await response.json();
  const log = JSON.parse(logLines[0]);
  assert.equal(response.status, 503);
  assert.equal(body.status, 'unavailable');
  assert.equal(log.event, 'ground_station_lookup_failed');
  assert.equal(log.requestId, response.headers.get('x-request-id'));
  assert.equal(log.path, '/api/monitor');
  assert.doesNotMatch(logLines.join('\n'), /28\.61|77\.21/);
});

test('API requests from a disallowed origin are rejected', async (t) => {
  const baseUrl = await withServer(t, createApp({ origins: ['https://allowed.example'] }));
  const response = await fetch(`${baseUrl}/health`, { headers: { Origin: 'https://untrusted.example' } });
  assert.equal(response.status, 403);
});
