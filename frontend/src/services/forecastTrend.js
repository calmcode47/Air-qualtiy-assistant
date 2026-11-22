const SECONDS_PER_HOUR = 60 * 60;

/** Summarize the direction of the next available forecast points without calling them safe. */
export function getForecastTrend(hourly, sampleCount = 3) {
  if (!Array.isArray(hourly) || !Number.isInteger(sampleCount) || sampleCount < 2) return null;
  const points = hourly
    .filter((point) => Number.isFinite(point?.time) && Number.isFinite(point?.aqi) && point.aqi >= 0)
    .sort((left, right) => left.time - right.time)
    .slice(0, sampleCount);
  if (points.length < 2) return null;

  const first = points[0];
  const last = points.at(-1);
  const change = last.aqi - first.aqi;
  return {
    direction: change <= -5 ? 'lower' : change >= 5 ? 'higher' : 'similar',
    hours: Math.max(1, Math.round((last.time - first.time) / SECONDS_PER_HOUR)),
    firstAqi: first.aqi,
    lastAqi: last.aqi
  };
}
