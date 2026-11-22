// @ts-check

/** @param {unknown} value @returns {number | null} */
export function normalizeAqi(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? Math.round(value)
    : null;
}

/** @param {number | null} value @returns {string} */
export function getUsAqiCategory(value) {
  const aqi = normalizeAqi(value);
  if (aqi === null) return 'Unavailable';
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
  if (aqi <= 200) return 'Unhealthy';
  if (aqi <= 300) return 'Very Unhealthy';
  return 'Hazardous';
}

/** @param {{ children?: unknown, elderly?: unknown, conditions?: unknown }} [profile] */
export function isSensitiveHousehold(profile = {}) {
  return Number(profile.children || 0) > 0
    || Number(profile.elderly || 0) > 0
    || (Array.isArray(profile.conditions) && profile.conditions.length > 0);
}

/** @param {number | null} value @param {boolean} sensitive @returns {string} */
export function outdoorGuidance(value, sensitive) {
  const aqi = normalizeAqi(value);
  if (aqi === null) return 'Check a current local air-quality advisory before planning strenuous outdoor activity.';
  if (aqi > 300) return 'Avoid outdoor physical activity. Keep activity low indoors and use a cleaner-air room if available. Check local alerts and account for heat and other indoor risks.';
  if (aqi > 200) return sensitive
    ? 'Sensitive household members should avoid outdoor physical activity. Others should avoid prolonged or strenuous outdoor activity.'
    : 'Avoid prolonged or strenuous outdoor activity and consider moving exercise indoors.';
  if (aqi > 150) return sensitive
    ? 'Sensitive household members should avoid prolonged or strenuous outdoor activity. Others should reduce it and take breaks.'
    : 'Reduce prolonged or strenuous outdoor activity and take breaks.';
  if (aqi > 100) return sensitive
    ? 'Sensitive household members should shorten outdoor activities, reduce intensity, and take more breaks.'
    : 'Follow local guidance. This level primarily affects sensitive groups.';
  return 'Use current local guidance and adjust outdoor activity based on how you feel.';
}
