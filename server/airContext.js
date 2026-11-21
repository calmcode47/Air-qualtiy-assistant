import { getUsAqiCategory, normalizeAqi } from '../shared/aqi.mjs';

export function groundAirContext(airData = {}) {
  const aqi = normalizeAqi(airData.aqi);
  const isCached = airData.isCached === true && aqi !== null;
  const isLive = airData.isLive === true && !isCached && aqi !== null;
  const peak = normalizeAqi(airData.cleanestWindowPeakAqi);
  const hasLowerWindow = isLive && peak !== null && peak < aqi && airData.cleanestWindow;
  return {
    name: airData.name,
    aqi: isLive || isCached ? aqi : null,
    category: getUsAqiCategory(isLive || isCached ? aqi : null),
    pm25: isLive ? airData.pm25 : undefined,
    isLive,
    isCached,
    staleHours: isCached ? airData.staleHours : undefined,
    cleanestWindow: hasLowerWindow ? airData.cleanestWindow : null,
    cleanestWindowPeakAqi: hasLowerWindow ? peak : null
  };
}
