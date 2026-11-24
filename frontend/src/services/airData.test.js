import { afterEach, describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchAirData, getUsAqiCategory, searchLocations, DEFAULT_LOCATIONS } from './airData';

afterEach(() => vi.unstubAllGlobals());

it('keeps valid search results when the provider includes malformed places', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => Response.json({
    results: [null, { id: 1, name: 'Invalid', latitude: 99, longitude: 0 },
      { id: 1275339, name: 'Mumbai', latitude: 19.076, longitude: 72.878 }]
  })));

  const places = await searchLocations('Mumbai');
  expect(places).toHaveLength(1);
  expect(places[0]).toMatchObject({ id: 'geo_1275339', name: 'Mumbai', lat: 19.076, lon: 72.878 });
});

describe('Open-Meteo US AQI categories', () => {
  it('uses the six US AQI health-concern bands', () => {
    expect(getUsAqiCategory(0)).toBe('Good');
    expect(getUsAqiCategory(50)).toBe('Good');
    expect(getUsAqiCategory(51)).toBe('Moderate');
    expect(getUsAqiCategory(100)).toBe('Moderate');
    expect(getUsAqiCategory(101)).toBe('Unhealthy for Sensitive Groups');
    expect(getUsAqiCategory(150)).toBe('Unhealthy for Sensitive Groups');
    expect(getUsAqiCategory(151)).toBe('Unhealthy');
    expect(getUsAqiCategory(200)).toBe('Unhealthy');
    expect(getUsAqiCategory(201)).toBe('Very Unhealthy');
    expect(getUsAqiCategory(300)).toBe('Very Unhealthy');
    expect(getUsAqiCategory(301)).toBe('Hazardous');
    expect(getUsAqiCategory(501)).toBe('Hazardous');
    expect(getUsAqiCategory(null)).toBe('Unavailable');
  });
});

describe('Live data, caching, and honest fallbacks', () => {
  let mockStorage = {};

  beforeEach(() => {
    vi.restoreAllMocks();
    mockStorage = {};
    global.localStorage = {
      getItem: vi.fn((key) => mockStorage[key] || null),
      setItem: vi.fn((key, value) => { mockStorage[key] = String(value); }),
      removeItem: vi.fn((key) => { delete mockStorage[key]; }),
      clear: vi.fn(() => { mockStorage = {}; })
    };
  });

  it('uses the provider AQI and computes a lower forecast window from hourly values', async () => {
    const airPayload = {
      timezone: 'Asia/Kolkata',
      current: { time: Date.parse('2026-11-21T09:00:00+05:30') / 1000, us_aqi: 142, pm2_5: 48.2, pm10: 70.1 },
      hourly: {
        time: [9, 10, 11, 12, 13].map((hour) => Date.parse(`2026-11-21T${String(hour).padStart(2, '0')}:00:00+05:30`) / 1000),
        us_aqi: [142, 130, 110, 95, 100],
        pm2_5: [48.2, 43, 35, null, 30]
      }
    };
    const weatherPayload = { current: { temperature_2m: 18, relative_humidity_2m: 60, wind_speed_10m: 7.2 } };
    global.fetch = vi.fn((url) => Promise.resolve({
      ok: true,
      json: async () => String(url).includes('air-quality-api') ? airPayload : weatherPayload
    }));

    const result = await fetchAirData(DEFAULT_LOCATIONS.delhi);

    expect(result.isLive).toBe(true);
    expect(result.aqi).toBe(142);
    expect(result.aqiSystem).toBe('US AQI');
    expect(result.category).toBe('Unhealthy for Sensitive Groups');
    expect(result.pm25).toBe(48.2);
    expect(result.cleanestWindow).toMatch(/12:00.*2:00/);
    expect(result.cleanestWindowPeakAqi).toBe(100);
    expect(result.diurnalHourly).toHaveLength(4);
    expect(result.diurnalHourly[2].pm25).toBeNull();
    expect(result.diurnalHourly.every((hour) => hour.label === getUsAqiCategory(hour.aqi))).toBe(true);
    expect(global.fetch.mock.calls.some(([url]) => String(url).includes('timeformat=unixtime'))).toBe(true);
  });

  it('keeps AQI when weather fails and skips missing forecast hours when comparing windows', async () => {
    const currentTime = Date.parse('2026-11-01T00:00:00-04:00') / 1000;
    global.fetch = vi.fn(async (url) => ({
      ok: true,
      json: async () => {
        if (!String(url).includes('air-quality-api')) throw new SyntaxError('Malformed weather response');
        return {
          timezone: 'America/New_York',
          current: { time: currentTime, us_aqi: 125 },
          hourly: {
            time: [1, 2, 3, 4].map((hour) => currentTime + hour * 3600),
            us_aqi: [75, null, 70, 160]
          }
        };
      }
    }));

    const result = await fetchAirData(DEFAULT_LOCATIONS.delhi);
    expect(result.isLive).toBe(true);
    expect(result.humidity).toBeNull();
    expect(result.cleanestWindow).toBeNull();
    expect(result.diurnalHourly.map((point) => point.aqi)).toEqual([75, 70, 160]);
  });

  it('returns unavailable data when neither network nor cache is available', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network offline'));
    const result = await fetchAirData(DEFAULT_LOCATIONS.delhi);

    expect(result.isFallback).toBe(false);
    expect(result.isLive).toBe(false);
    expect(result.descriptor).toMatch(/unavailable/i);
    expect(result.aqi).toBeNull();
    expect(result.category).toBe('Unavailable');
    expect(result.cleanestWindow).toBeNull();
    expect(result.name).toBe('Delhi NCR');
  });

  it('serves a cached reading with its age when the network fails', async () => {
    const twoHoursAgo = Date.now() - 2.5 * 3600 * 1000;
    localStorage.setItem('aura_air_cache_delhi', JSON.stringify({
      id: 'delhi', name: 'Delhi NCR', aqi: 110, aqiSystem: 'US AQI',
      category: 'Unhealthy for Sensitive Groups', pm25: 38,
      timestamp: twoHoursAgo, isLive: true
    }));
    global.fetch = vi.fn().mockRejectedValue(new Error('Network timeout'));

    const result = await fetchAirData(DEFAULT_LOCATIONS.delhi);

    expect(result.isCached).toBe(true);
    expect(result.isLive).toBe(false);
    expect(result.staleHours).toBeGreaterThanOrEqual(2);
    expect(result.aqi).toBe(110);
    expect(result.cleanestWindow).toBeNull();
    expect(result.diurnalHourly).toEqual([]);
  });

  it('does not substitute Delhi sample readings for an unknown location', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network offline'));
    const result = await fetchAirData({ id: 'geo_1', name: 'New City', lat: 10, lon: 10 });

    expect(result.name).toBe('New City');
    expect(result.aqi).toBeNull();
    expect(result.category).toBe('Unavailable');
    expect(result.isFallback).toBe(false);
  });
});
