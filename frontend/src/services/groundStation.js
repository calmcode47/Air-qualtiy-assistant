export async function fetchNearbyGroundStation(location, signal) {
  if (!Number.isFinite(location?.lat) || !Number.isFinite(location?.lon)) {
    return { status: 'unavailable' };
  }

  const params = new URLSearchParams({
    lat: String(location.lat),
    lon: String(location.lon)
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
