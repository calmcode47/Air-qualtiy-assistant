// @ts-check

import { ADVICE_TEMPLATES, interpolate } from './adviceTemplates.mjs';

const ALLOWED_PARAMETERS = new Set(['PM2.5', 'PM10']);

/** @param {unknown} monitor */
export function normalizeGroundMonitor(monitor) {
  if (!monitor || typeof monitor !== 'object' || Array.isArray(monitor)) return null;
  const candidate = /** @type {Record<string, unknown>} */ (monitor);
  if (candidate.status !== 'available' || !Array.isArray(candidate.measurements)) return null;
  if (typeof candidate.locationName !== 'string' || !candidate.locationName.trim()) return null;
  const measurements = candidate.measurements.flatMap((measurement) => {
    const value = Number(measurement?.value);
    if (!ALLOWED_PARAMETERS.has(measurement?.parameter) || !Number.isFinite(value) || value < 0
      || typeof measurement?.observedAt !== 'string') return [];
    return [{ parameter: measurement.parameter, value: Number(value.toFixed(1)), observedAt: measurement.observedAt }];
  });
  if (!measurements.length) return null;
  return {
    source: typeof candidate.source === 'string' ? candidate.source.slice(0, 80) : 'CPCB via data.gov.in',
    locationName: candidate.locationName.trim().slice(0, 120),
    city: typeof candidate.city === 'string' ? candidate.city.slice(0, 100) : null,
    distanceKm: typeof candidate.distanceKm === 'number' && Number.isFinite(candidate.distanceKm) && candidate.distanceKm >= 0
      ? Number(candidate.distanceKm.toFixed(1))
      : null,
    measurements
  };
}

/** @param {unknown} monitor @param {'en' | 'hi' | 'pa'} [language] */
export function formatGroundMonitorNote(monitor, language = 'en') {
  const normalized = normalizeGroundMonitor(monitor);
  if (!normalized) return null;
  const values = normalized.measurements.map(({ parameter, value }) => `${parameter} ${value} µg/m³`).join(', ');
  const distance = normalized.distanceKm === null ? '' : `, ${normalized.distanceKm} km away`;
  const reportedAt = normalized.measurements[0]?.observedAt;
  const languageKey = Object.hasOwn(ADVICE_TEMPLATES, language) ? language : 'en';
  const locale = ADVICE_TEMPLATES[languageKey];
  const time = new Date(reportedAt);
  const formattedTime = Number.isFinite(time.getTime())
    ? new Intl.DateTimeFormat(languageKey, { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(time)
    : reportedAt;
  const localizedDistance = languageKey === 'hi'
    ? (normalized.distanceKm === null ? '' : `, ${normalized.distanceKm} किमी दूर`)
    : languageKey === 'pa'
      ? (normalized.distanceKm === null ? '' : `, ${normalized.distanceKm} ਕਿਮੀ ਦੂਰ`)
      : distance;
  return interpolate(locale.messages.groundMonitor, {
    name: normalized.locationName,
    distance: localizedDistance,
    values,
    time: formattedTime
  });
}
