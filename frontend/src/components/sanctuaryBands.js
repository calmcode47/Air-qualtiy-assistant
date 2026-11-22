// US AQI bands used for the illustrative color scale.
const BANDS = [
  [50, 'GOOD', '#6F9A62', 'Use the current local air-quality guidance for your area.'],
  [100, 'MODERATE', '#6F9A62', 'People unusually sensitive to particle pollution may choose to reduce prolonged outdoor exertion.'],
  [150, 'UNHEALTHY FOR SENSITIVE GROUPS', '#D6B33F', 'Sensitive groups may need to reduce prolonged or strenuous outdoor activity.'],
  [200, 'UNHEALTHY', '#D9822B', 'People in sensitive groups should avoid prolonged outdoor exertion; others may need to limit it.'],
  [300, 'VERY UNHEALTHY', '#B5473A', 'Reduce outdoor exertion and follow current local public-health guidance.'],
  [Infinity, 'HAZARDOUS', '#7A2E3A', 'Avoid outdoor exertion and follow current local public-health guidance.']
];

export function getBand(aqi) {
  for (const band of BANDS) {
    if (aqi <= band[0]) return band;
  }
  return BANDS[BANDS.length - 1];
}

