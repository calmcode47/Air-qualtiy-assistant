// @ts-check

import { ADVICE_TEMPLATES, interpolate } from './adviceTemplates.mjs';

import { normalizeGroundMonitor } from './stationObservation.mjs';

/** @param {unknown} monitor @param {'en' | 'hi' | 'pa'} [language] */
export function formatGroundMonitorNote(monitor, language = 'en') {
  const normalized = normalizeGroundMonitor(monitor);
  if (!normalized) return null;
  const languageKey = Object.hasOwn(ADVICE_TEMPLATES, language) ? language : 'en';
  const { messages } = ADVICE_TEMPLATES[languageKey];
  const formatter = new Intl.DateTimeFormat(languageKey, { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' });
  const values = normalized.measurements.map(({ parameter, value, unit, observedAt }) => (
    `${parameter} ${value} ${unit} (${formatter.format(new Date(observedAt))} UTC)`
  )).join(', ');
  return interpolate(messages.groundMonitor, {
    name: normalized.locationName,
    distance: normalized.distanceKm === null ? '' : interpolate(messages.stationDistance, { km: normalized.distanceKm }),
    values
  });
}
