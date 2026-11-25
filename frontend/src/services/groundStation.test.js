import { afterEach, expect, it, vi } from 'vitest';
import { fetchNearbyGroundStation } from './groundStation';
import { formatGroundMonitorNote } from '../../../shared/groundMonitor.mjs';

const location = { lat: 28.6, lon: 77.2 };
const observedAt = '2026-11-22T08:30:00Z';

function mockStation(measurements) {
  vi.stubGlobal('fetch', vi.fn(async () => Response.json({
    status: 'available', locationName: 'Anand Vihar', distanceKm: 1.2, measurements
  })));
}

afterEach(() => vi.unstubAllGlobals());

it('keeps genuine zeroes and uses each pollutant’s own reporting time', async () => {
  mockStation([
    { parameter: 'PM2.5', value: 0, observedAt },
    { parameter: 'PM10', value: 42.6, observedAt: '2026-11-22T09:45:00Z' }
  ]);
  const result = await fetchNearbyGroundStation(location);
  const note = formatGroundMonitorNote(result);
  expect(note).toMatch(/PM2\.5 0 µg\/m³ \([^)]*8:30[^)]*UTC\)/u);
  expect(note).toMatch(/PM10 42\.6 µg\/m³ \([^)]*9:45[^)]*UTC\)/u);
});

it.each([null, false, '', '   ', -1])('omits an unusable concentration (%j)', async (value) => {
  mockStation([
    { parameter: 'PM2.5', value, observedAt },
    { parameter: 'PM10', value: 18, observedAt }
  ]);
  const result = await fetchNearbyGroundStation(location);
  expect(result.measurements).toHaveLength(1);
  expect(result.measurements[0].parameter).toBe('PM10');
});

it('reports unavailable when a station has no usable observations', async () => {
  mockStation([{ parameter: 'PM10', value: 42, observedAt: 'unknown' }, null]);
  await expect(fetchNearbyGroundStation(location)).resolves.toEqual({ status: 'unavailable' });
});
