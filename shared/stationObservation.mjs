// @ts-check

const ALLOWED_PARAMETERS = new Set(['PM2.5', 'PM10']);

/** @param {unknown} monitor */
export function normalizeGroundMonitor(monitor) {
  if (!monitor || typeof monitor !== 'object' || Array.isArray(monitor)) return null;
  const candidate = /** @type {Record<string, unknown>} */ (monitor);
  if (candidate.status !== 'available' || !Array.isArray(candidate.measurements)) return null;
  if (typeof candidate.locationName !== 'string' || !candidate.locationName.trim()) return null;
  const measurements = candidate.measurements.flatMap((measurement) => {
    const raw = measurement?.value;
    const value = typeof raw === 'string' && raw.trim() ? Number(raw) : raw;
    if (!ALLOWED_PARAMETERS.has(measurement?.parameter) || !Number.isFinite(value) || value < 0
      || (measurement.unit != null && measurement.unit !== 'µg/m³')
      || typeof measurement.observedAt !== 'string' || !/(?:Z|[+-]\d{2}:\d{2})$/u.test(measurement.observedAt)
      || !Number.isFinite(Date.parse(measurement.observedAt))) return [];
    return [{ parameter: measurement.parameter, value: Number(value.toFixed(1)), unit: 'µg/m³', observedAt: new Date(measurement.observedAt).toISOString() }];
  });
  if (!measurements.length) return null;
  return {
    status: 'available',
    source: typeof candidate.source === 'string' ? candidate.source.slice(0, 80) : 'CPCB via data.gov.in',
    locationName: candidate.locationName.trim().slice(0, 120),
    city: typeof candidate.city === 'string' ? candidate.city.slice(0, 100) : null,
    distanceKm: typeof candidate.distanceKm === 'number' && Number.isFinite(candidate.distanceKm) && candidate.distanceKm >= 0
      ? Number(candidate.distanceKm.toFixed(1))
      : null,
    measurements
  };
}
