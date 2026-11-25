import { hasValidCoordinates } from './airData.js';
import { normalizeGroundMonitor } from '../../../shared/stationObservation.mjs';

function parseStation(result) {
  if (result?.status === 'available') {
    const observation = normalizeGroundMonitor(result);
    if (observation) {
      return {
        ...observation,
        cached: result.cached === true,
        generatedAt: typeof result.generatedAt === 'string' && Number.isFinite(Date.parse(result.generatedAt))
          ? new Date(result.generatedAt).toISOString() : null,
        sourceUrl: typeof result.sourceUrl === 'string' ? result.sourceUrl : undefined,
        mirrorUrl: typeof result.mirrorUrl === 'string' ? result.mirrorUrl : undefined,
        license: typeof result.license === 'string' ? result.license : undefined
      };
    }
  }
  if (result?.status === 'unsupported_region' || result?.status === 'no_recent_measurements') {
    return { status: result.status };
  }
  if (result?.status === 'no_station' && Number.isFinite(result.radiusKm) && result.radiusKm >= 0) {
    return { status: result.status, radiusKm: result.radiusKm };
  }
  return { status: 'unavailable' };
}

export async function fetchNearbyGroundStation(location, signal) {
  if (!hasValidCoordinates(location?.lat, location?.lon)) {
    return { status: 'unavailable' };
  }

  const params = new URLSearchParams({
    lat: location.lat.toFixed(2),
    lon: location.lon.toFixed(2)
  });
  try {
    const response = await fetch(`/api/monitor?${params}`, {
      headers: { Accept: 'application/json' },
      signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(10000)]) : AbortSignal.timeout(10000)
    });
    return response.ok ? parseStation(await response.json()) : { status: 'unavailable' };
  } catch (error) {
    if (signal?.aborted) throw error;
    return { status: 'unavailable' };
  }
}
