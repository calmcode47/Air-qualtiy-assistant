const ALLOWED_PARAMETERS = new Set(['PM2.5', 'PM10']);

export function normalizeGroundMonitor(monitor) {
  if (!monitor || monitor.status !== 'available' || !Array.isArray(monitor.measurements)) return null;
  if (typeof monitor.locationName !== 'string' || !monitor.locationName.trim()) return null;
  const measurements = monitor.measurements.flatMap((measurement) => {
    const value = Number(measurement?.value);
    if (!ALLOWED_PARAMETERS.has(measurement?.parameter) || !Number.isFinite(value) || value < 0
      || typeof measurement?.observedAt !== 'string') return [];
    return [{ parameter: measurement.parameter, value: Number(value.toFixed(1)), observedAt: measurement.observedAt }];
  });
  if (!measurements.length) return null;
  return {
    source: typeof monitor.source === 'string' ? monitor.source.slice(0, 80) : 'CPCB via data.gov.in',
    locationName: monitor.locationName.trim().slice(0, 120),
    city: typeof monitor.city === 'string' ? monitor.city.slice(0, 100) : null,
    distanceKm: Number.isFinite(monitor.distanceKm) && monitor.distanceKm >= 0 ? Number(monitor.distanceKm.toFixed(1)) : null,
    measurements
  };
}

export function formatGroundMonitorNote(monitor) {
  const normalized = normalizeGroundMonitor(monitor);
  if (!normalized) return null;
  const values = normalized.measurements.map(({ parameter, value }) => `${parameter} ${value} µg/m³`).join(', ');
  const distance = normalized.distanceKm === null ? '' : `, ${normalized.distanceKm} km away`;
  const reportedAt = normalized.measurements[0]?.observedAt;
  return `Nearby CPCB station ${normalized.locationName}${distance} reported ${values} at ${reportedAt}. This is a station measurement, not a reading at your location.`;
}
