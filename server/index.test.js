import { test } from 'node:test';
import assert from 'node:assert/strict';
import app, { createApp, parseGeminiDailyLimit, parseTrustProxyHops } from './index.js';
import { AdviceResponseSchema } from './schema.js';
import { generateRuleBasedAdvice } from '../shared/advice.mjs';
import { createGroundStationService } from './groundStations.js';

const stationFeed = {
  generated_at: '2026-11-22T09:30:00Z',
  records: [
    {
      city: 'Delhi', station: 'Anand Vihar, Delhi - DPCC', pollutant: 'PM2.5', avg: 42.56,
      latitude: 28.647622, longitude: 77.315809, updated_at: '2026-11-22T08:30:00Z'
    },
    {
      city: 'Delhi', station: 'Anand Vihar, Delhi - DPCC', pollutant: 'PM10', avg: 78,
      latitude: 28.647622, longitude: 77.315809, updated_at: '2026-11-22T08:30:00Z'
    },
    {
      city: 'Delhi', station: 'ITO, Delhi - CPCB', pollutant: 'PM2.5', avg: 100,
      latitude: 28.628624, longitude: 77.24106, updated_at: '2026-11-22T08:30:00Z'
    }
  ]
};

function responseFor(data, status = 200) {
  return Response.json(data, { status });
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
  assert.equal(result.provider.status, 'disabled');
});

test('proxy-hop parsing accepts numeric hop counts and rejects malformed settings', () => {
  assert.equal(parseTrustProxyHops(undefined), false);
  assert.equal(parseTrustProxyHops('2'), 2);
  assert.throws(() => parseTrustProxyHops('1.5'), /non-negative integer/);
  assert.throws(() => parseTrustProxyHops('-1'), /non-negative integer/);
});

test('health reports the observed forwarded-IP chain and warns if its length changes', async (t) => {
  const logLines = [];
  const baseUrl = await withServer(t, createApp({
    trustProxy: 4,
    logger: { info: (line) => logLines.push(line), warn: (line) => logLines.push(line) }
  }));
  const first = await fetch(`${baseUrl}/health`, { headers: { 'X-Forwarded-For': '198.51.100.1' } });
  const firstResult = await first.json();
  const second = await fetch(`${baseUrl}/health`, { headers: { 'X-Forwarded-For': '198.51.100.2, 203.0.113.2' } });
  const secondResult = await second.json();

  assert.deepEqual(firstResult.proxyChain, { configuredTrustProxy: 4, observedForwardedForEntries: 1 });
  assert.deepEqual(secondResult.proxyChain, { configuredTrustProxy: 4, observedForwardedForEntries: 2 });
  assert.equal(JSON.parse(logLines[0]).event, 'forwarded_ip_chain_observed');
  assert.equal(JSON.parse(logLines[1]).event, 'forwarded_ip_chain_changed');
  assert.equal(JSON.parse(logLines[1]).previousForwardedForEntries, 1);
  assert.equal(JSON.parse(logLines[1]).forwardedForEntries, 2);
  assert.doesNotMatch(logLines.join('\n'), /198\.51|203\.0/);
});

test('Gemini daily limit parsing defaults safely and accepts zero or a positive integer', () => {
  assert.equal(parseGeminiDailyLimit(undefined), 10);
  assert.equal(parseGeminiDailyLimit('0'), 0);
  assert.equal(parseGeminiDailyLimit('250'), 250);
  assert.throws(() => parseGeminiDailyLimit('-1'), /non-negative integer/);
  assert.throws(() => parseGeminiDailyLimit('1.5'), /non-negative integer/);
});

test('public health checks do not replace the trusted edge observation', async (t) => {
  const logLines = [];
  const baseUrl = await withServer(t, createApp({
    edgeToken: 'test-edge-token',
    trustProxy: 2,
    logger: { info: (line) => logLines.push(line), warn: (line) => logLines.push(line) }
  }));

  const trusted = await fetch(`${baseUrl}/health`, {
    headers: { 'X-Aura-Edge-Token': 'test-edge-token', 'X-Forwarded-For': '198.51.100.1, 203.0.113.1' }
  });
  assert.equal((await trusted.json()).proxyChain.observedForwardedForEntries, 2);

  const probe = await fetch(`${baseUrl}/health`);
  assert.equal(probe.status, 200);
  assert.equal((await probe.json()).proxyChain.observedForwardedForEntries, 2);
  assert.equal(logLines.length, 1);
});

test('startup model check reports provider availability through health and logs failures', async (t) => {
  const logLines = [];
  const advisor = async () => generateRuleBasedAdvice({ message: 'air quality' });
  advisor.model = 'gemini-3.8-flash';
  advisor.checkModel = async () => { throw new Error('{"error":{"code":404,"status":"NOT_FOUND","message":"model name is invalid"}}'); };
  const appWithModelCheck = createApp({ advisor, logger: {
    info: (line) => logLines.push(line), warn: (line) => logLines.push(line)
  } });
  const baseUrl = await withServer(t, appWithModelCheck);
  const before = await (await fetch(`${baseUrl}/health`)).json();
  assert.deepEqual(before.provider, { status: 'checking', model: 'gemini-3.8-flash' });

  await appWithModelCheck.locals.runStartupModelCheck();
  await appWithModelCheck.locals.runStartupModelCheck();
  const after = await (await fetch(`${baseUrl}/health`)).json();
  const event = logLines.map((line) => JSON.parse(line)).find((line) => line.event === 'gemini_startup_check_failed');
  assert.deepEqual(after.provider, { status: 'unavailable', model: 'gemini-3.8-flash' });
  assert.equal(event.error.status, 404);
  assert.match(event.error.message, /model name is invalid/);
  assert.equal(logLines.map((line) => JSON.parse(line)).filter((line) => line.event === 'gemini_startup_check_failed').length, 1);
});

test('startup model metadata check is skipped when the Gemini daily limit is zero', async () => {
  let checkCount = 0;
  const advisor = async () => generateRuleBasedAdvice({ message: 'air quality' });
  advisor.model = 'gemini-3.8-flash';
  advisor.checkModel = async () => { checkCount += 1; };
  const appWithZeroBudget = createApp({ advisor, geminiDailyLimit: 0, logger: { warn() {} } });
  await appWithZeroBudget.locals.runStartupModelCheck();
  assert.equal(checkCount, 0);
});

test('POST /api/advice uses valid Gemini output and identifies the guidance mode', async (t) => {
  let receivedInput;
  const expectedAdvice = generateRuleBasedAdvice({ message: 'How can I reduce indoor particles?' });
  const appWithAdvisor = createApp({
    advisor: async (input, { signal }) => {
      receivedInput = input;
      assert.ok(signal instanceof AbortSignal);
      return expectedAdvice;
    }
  });
  const baseUrl = await withServer(t, appWithAdvisor);
  const response = await fetch(`${baseUrl}/advice`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'How can I reduce indoor particles?', language: 'hi' })
  });
  const result = await response.json();

  assert.equal(response.status, 200);
  assert.equal(result.mode, 'gemini-guidance');
  assert.equal(response.headers.get('x-aura-advice-mode'), 'gemini-guidance');
  assert.deepEqual(receivedInput.message, 'How can I reduce indoor particles?');
  assert.equal(receivedInput.language, 'hi');
  assert.equal(AdviceResponseSchema.safeParse(Object.fromEntries(Object.entries(result).filter(([key]) => key !== 'mode'))).success, true);
});

test('POST /api/advice falls back to local guidance when Gemini fails', async (t) => {
  const logLines = [];
  const appWithFailure = createApp({
    advisor: async () => { throw new Error('provider unavailable'); },
    logger: { warn: (line) => logLines.push(line) }
  });
  const baseUrl = await withServer(t, appWithFailure);
  const response = await fetch(`${baseUrl}/advice`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'How can I reduce indoor particles?' })
  });
  const result = await response.json();
  const { mode, ...advice } = result;

  assert.equal(response.status, 200);
  assert.equal(mode, 'local-guidance');
  assert.equal(response.headers.get('x-aura-advice-mode'), 'local-guidance');
  assert.equal(AdviceResponseSchema.safeParse(advice).success, true);
  assert.equal(JSON.parse(logLines[0]).event, 'gemini_advice_failed');
});

test('POST /api/advice falls back without logging ADVISOR_BUSY as a provider failure', async (t) => {
  const logLines = [];
  const appWithBusyAdvisor = createApp({
    geminiDailyLimit: 1,
    advisor: (() => {
      let calls = 0;
      return async () => {
        calls += 1;
        if (calls === 1) {
          const error = new Error('busy');
          error.code = 'ADVISOR_BUSY';
          throw error;
        }
        return generateRuleBasedAdvice({ message: 'How can I reduce indoor particles?' });
      };
    })(),
    logger: { warn: (line) => logLines.push(line) }
  });
  const baseUrl = await withServer(t, appWithBusyAdvisor);
  const ask = () => fetch(`${baseUrl}/advice`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'How can I reduce indoor particles?' })
  });
  const busyFallback = await ask();
  const successAfterBusy = await ask();
  const cappedFallback = await ask();

  assert.equal((await busyFallback.json()).mode, 'local-guidance');
  assert.equal((await successAfterBusy.json()).mode, 'gemini-guidance');
  assert.equal((await cappedFallback.json()).mode, 'local-guidance');
  assert.equal(logLines.length, 0);
});

test('POST /api/advice rejects invalid Gemini output and falls back to valid local guidance', async (t) => {
  const appWithInvalidAdvisor = createApp({ advisor: async () => ({ summary: 'invalid', recommendations: [] }) });
  const baseUrl = await withServer(t, appWithInvalidAdvisor);
  const response = await fetch(`${baseUrl}/advice`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'How can I reduce indoor particles?' })
  });
  const { mode, ...advice } = await response.json();

  assert.equal(response.status, 200);
  assert.equal(mode, 'local-guidance');
  assert.equal(AdviceResponseSchema.safeParse(advice).success, true);
});

test('urgent advice bypasses the Gemini advisor', async (t) => {
  let advisorCalls = 0;
  const appWithAdvisor = createApp({ advisor: async () => {
    advisorCalls += 1;
    return generateRuleBasedAdvice({ message: 'irrelevant' });
  } });
  const baseUrl = await withServer(t, appWithAdvisor);
  const response = await fetch(`${baseUrl}/advice`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'I cannot breathe', language: 'pa' })
  });
  const result = await response.json();

  assert.equal(response.status, 200);
  assert.equal(result.mode, 'safety-guidance');
  assert.match(result.summary, /ਹੁਣੇ/);
  assert.equal(advisorCalls, 0);
});

test('Gemini daily cap is global across client IPs and resets at the next UTC date', async (t) => {
  let currentTime = Date.parse('2026-11-22T23:59:00Z');
  let advisorCalls = 0;
  const appWithDailyCap = createApp({
    trustProxy: 1,
    geminiDailyLimit: 1,
    now: () => currentTime,
    advisor: async () => {
      advisorCalls += 1;
      return generateRuleBasedAdvice({ message: 'How can I reduce indoor particles?' });
    }
  });
  const baseUrl = await withServer(t, appWithDailyCap);
  const ask = (ip) => fetch(`${baseUrl}/advice`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': ip },
    body: JSON.stringify({ message: 'How can I reduce indoor particles?' })
  });

  assert.equal((await (await ask('198.51.100.1')).json()).mode, 'gemini-guidance');
  assert.equal((await (await ask('198.51.100.2')).json()).mode, 'local-guidance');
  assert.equal(advisorCalls, 1);
  currentTime += 60_000;
  assert.equal((await (await ask('198.51.100.2')).json()).mode, 'gemini-guidance');
  assert.equal(advisorCalls, 2);
});

test('Render API rejects direct requests with spoofed forwarded IPs when edge protection is enabled', async (t) => {
  let advisorCalls = 0;
  const appBehindTrustedEdge = createApp({
    trustProxy: 4,
    edgeToken: 'edge-secret',
    advisor: async () => {
      advisorCalls += 1;
      return generateRuleBasedAdvice({ message: 'How can I reduce indoor particles?' });
    }
  });
  const baseUrl = await withServer(t, appBehindTrustedEdge);
  const response = await fetch(`${baseUrl}/advice`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Forwarded-For': '198.51.100.88, 203.0.113.99'
    },
    body: JSON.stringify({ message: 'How can I reduce indoor particles?' })
  });

  assert.equal(response.status, 403);
  assert.match((await response.json()).error, /trusted application edge/);
  assert.equal(advisorCalls, 0);

  const healthResponse = await fetch(`${baseUrl}/health`);
  assert.equal(healthResponse.status, 200);
  assert.equal((await healthResponse.json()).status, 'ok');
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
    groundStationNow: () => Date.parse('2026-11-22T09:30:00Z'),
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
  for (const query of ['lat=100&lon=77', 'lat=&lon=77', 'lat=28.61&lat=28.62&lon=77', 'lon=77']) {
    const invalid = await fetch(`${baseUrl}/monitor?${query}`);
    assert.equal(invalid.status, 400);
    assert.equal((await invalid.json()).status, 'invalid_request');
  }
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
