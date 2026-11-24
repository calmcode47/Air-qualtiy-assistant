import { hasValidCoordinates } from './airData.js';

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
    const result = await response.json();
    if (response.ok && ['available', 'unsupported_region', 'no_station', 'no_recent_measurements'].includes(result?.status)) {
      return result;
    }
    return { status: 'unavailable' };
  } catch (error) {
    if (signal?.aborted) throw error;
    return { status: 'unavailable' };
  }
}
