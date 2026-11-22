import { describe, expect, it } from 'vitest';
import { createGroundStationService } from '../../../server/groundStations.js';

const NOW = Date.parse('2026-11-22T12:00:00Z');

function response(data, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(data)
  };
}

describe('server/groundStations.js', () => {
  it('validates coordinates and avoids lookups outside India', async () => {
    let fetchCount = 0;
    const service = createGroundStationService({ fetchImpl: async () => { fetchCount += 1; return response({ records: [] }); } });
    await expect(service.getNearestStation(NaN, 77)).resolves.toEqual({ status: 'invalid_request' });
    await expect(service.getNearestStation(100, 77)).resolves.toEqual({ status: 'invalid_request' });
    await expect(service.getNearestStation(40.71, -74)).resolves.toEqual({ status: 'unsupported_region' });
    expect(fetchCount).toBe(0);
  });

  it('selects the closest station with its newest valid pollutant values', async () => {
    const service = createGroundStationService({
      now: () => NOW,
      fetchImpl: async () => response({
        generated_at: '2026-11-22T11:45:00Z',
        records: [
          { station: 'Closer but old', city: 'Delhi', pollutant: 'PM2.5', avg: 15, latitude: 28.61, longitude: 77.21, updated_at: '2026-11-22T05:00:00Z' },
          { station: 'Nearest active', city: 'Delhi', pollutant: 'PM2.5', avg: 45.27, latitude: 28.62, longitude: 77.22, updated_at: '2026-11-22T10:00:00Z' },
          { station: 'Nearest active', city: 'Delhi', pollutant: 'PM2.5', avg: 48.24, latitude: 28.62, longitude: 77.22, updated_at: '2026-11-22T11:00:00Z' },
          { station: 'Nearest active', city: 'Delhi', pollutant: 'PM10', avg: null, latitude: 28.62, longitude: 77.22, updated_at: '2026-11-22T11:00:00Z' },
          { station: 'Nearest active', city: 'Delhi', pollutant: 'NO2', avg: 12, latitude: 28.62, longitude: 77.22, updated_at: '2026-11-22T11:00:00Z' },
          { station: 'Bad coordinates', city: 'Delhi', pollutant: 'PM2.5', avg: 12, latitude: NaN, longitude: 77.22, updated_at: '2026-11-22T11:00:00Z' }
        ]
      })
    });

    const result = await service.getNearestStation(28.61, 77.21);
    expect(result.status).toBe('available');
    expect(result.locationName).toBe('Nearest active');
    expect(result.measurements).toEqual([
      { parameter: 'PM2.5', value: 48.2, unit: 'µg/m³', observedAt: '2026-11-22T11:00:00Z' }
    ]);
    expect(result.distanceKm).toBe(1.5);
    expect(JSON.stringify(result)).not.toContain('latitude');
  });

  it('returns no-station when no current reports are nearby', async () => {
    const service = createGroundStationService({
      now: () => NOW,
      fetchImpl: async () => response({ records: [
        { station: 'Far station', pollutant: 'PM2.5', avg: 20, latitude: 29, longitude: 78, updated_at: '2026-11-22T11:00:00Z' },
        { station: 'Stale station', pollutant: 'PM2.5', avg: 20, latitude: 28.61, longitude: 77.21, updated_at: '2026-11-22T05:00:00Z' }
      ] })
    });
    await expect(service.getNearestStation(28.61, 77.21)).resolves.toEqual({ status: 'no_station', radiusKm: 25 });
  });

  it('caches a valid feed and serves it as stale after an upstream failure', async () => {
    let now = NOW;
    let fetchCount = 0;
    const service = createGroundStationService({
      now: () => now,
      fetchImpl: async () => {
        fetchCount += 1;
        if (fetchCount > 1) throw new Error('temporary feed outage');
        return response({ records: [
          { station: 'Cached station', pollutant: 'PM2.5', avg: 38, latitude: 28.61, longitude: 77.21, updated_at: '2026-11-22T11:00:00Z' }
        ] });
      }
    });

    await expect(service.getNearestStation(28.61, 77.21)).resolves.toMatchObject({ status: 'available', cached: false });
    await service.getNearestStation(28.61, 77.21);
    expect(fetchCount).toBe(1);
    now += 16 * 60 * 1000;
    await expect(service.getNearestStation(28.61, 77.21)).resolves.toMatchObject({ status: 'available', cached: true });
    expect(fetchCount).toBe(2);
  });

  it('rejects oversized, malformed, and non-successful feed responses', async () => {
    const oversized = createGroundStationService({ fetchImpl: async () => ({ ok: true, text: async () => 'x'.repeat(4 * 1024 * 1024 + 1) }) });
    await expect(oversized.getNearestStation(28.61, 77.21)).rejects.toThrow(/size limit/u);

    const malformed = createGroundStationService({ fetchImpl: async () => response({ records: 'not-an-array' }) });
    await expect(malformed.getNearestStation(28.61, 77.21)).rejects.toThrow(/invalid dataset/u);

    const unavailable = createGroundStationService({ fetchImpl: async () => response({}, 503) });
    await expect(unavailable.getNearestStation(28.61, 77.21)).rejects.toThrow(/HTTP 503/u);
  });
});
