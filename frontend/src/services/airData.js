import { getUsAqiCategory, normalizeAqi } from '../../../shared/aqi.mjs';

export { getUsAqiCategory };

/**
 * Open-Meteo air-quality and weather data connector.
 * AQI values come from Open-Meteo's US AQI variables, which include pollutant
 * averaging rules. PM values remain modelled concentration estimates.
 */
export const DEFAULT_LOCATIONS = {
  delhi: {
    id: 'delhi',
    name: 'Delhi NCR',
    region: 'Indo-Gangetic Basin, India',
    country_code: 'IN',
    lat: 28.6139,
    lon: 77.2090
  },
  lahore: {
    id: 'lahore',
    name: 'Lahore',
    region: 'Punjab Plain, Pakistan',
    country_code: 'PK',
    lat: 31.5204,
    lon: 74.3587
  },
  saltlake: {
    id: 'saltlake',
    name: 'Salt Lake City Basin',
    region: 'Wasatch Mountain Basin, USA',
    country_code: 'US',
    lat: 40.7608,
    lon: -111.8910
  },
  beijing: {
    id: 'beijing',
    name: 'Beijing',
    region: 'Northern Plain, China',
    country_code: 'CN',
    lat: 39.9042,
    lon: 116.4074
  }
};

const HOUR_SECONDS = 3600;
const AQI_SYSTEM = 'US AQI';
const AIR_ENDPOINT = 'https://air-quality-api.open-meteo.com/v1/air-quality';
const WEATHER_ENDPOINT = 'https://api.open-meteo.com/v1/forecast';
const GEOCODING_ENDPOINT = 'https://geocoding-api.open-meteo.com/v1/search';

function locationDetails(location) {
  return {
    id: location.id || 'custom',
    name: location.name || 'Selected location',
    region: location.region || 'Local coordinates',
    country: location.country,
    country_code: location.country_code
  };
}

export function createEmptyReading(location, descriptor = 'Live air-quality data unavailable') {
  return {
    ...locationDetails(location),
    aqi: null,
    aqiSystem: AQI_SYSTEM,
    category: 'Unavailable',
    descriptor,
    pm25: null,
    pm10: null,
    observedAt: null,
    tempC: null,
    humidity: null,
    windSpeed: null,
    cleanestWindow: null,
    cleanestWindowPeakAqi: null,
    diurnalHourly: [],
    timestamp: null,
    isLive: false,
    isCached: false,
    isFallback: false
  };
}

export function getCachedReadingAgeHours(savedAt, now = Date.now()) {
  return Math.max(1, Math.ceil((now - savedAt) / (HOUR_SECONDS * 1000)));
}

function getCacheKey(location) {
  const identity = location.id || `${Number(location.lat).toFixed(2)}_${Number(location.lon).toFixed(2)}`;
  return `aura_air_cache_${identity}`;
}

function readCachedAirData(location) {
  try {
    const saved = JSON.parse(localStorage.getItem(getCacheKey(location)));
    const now = Date.now();
    const savedAt = Number(saved?.timestamp);
    const aqi = normalizeAqi(saved?.aqi);
    if (saved?.aqiSystem !== AQI_SYSTEM || aqi === null
      || !Number.isFinite(savedAt) || savedAt <= 0 || savedAt > now) return null;

    return {
      ...createEmptyReading(location, 'Cached Open-Meteo model estimate'),
      aqi,
      category: getUsAqiCategory(aqi),
      pm25: concentration(saved.pm25),
      pm10: concentration(saved.pm10),
      timezone: usableTimeZone(saved.timezone),
      timestamp: savedAt,
      isCached: true,
      staleHours: getCachedReadingAgeHours(savedAt, now)
    };
  } catch {
    return null;
  }
}

function saveAirData(location, reading) {
  try {
    localStorage.setItem(getCacheKey(location), JSON.stringify({
      aqiSystem: reading.aqiSystem,
      aqi: reading.aqi,
      pm25: reading.pm25,
      pm10: reading.pm10,
      timezone: reading.timezone,
      timestamp: reading.timestamp
    }));
  } catch {
    // The forecast is still usable when storage is blocked or full.
  }
}

export function hasValidCoordinates(lat, lon) {
  return Number.isFinite(lat) && Math.abs(lat) <= 90
    && Number.isFinite(lon) && Math.abs(lon) <= 180;
}

function dateFromEpochSeconds(value) {
  return Number.isFinite(value) && Math.abs(value) <= 8.64e12 ? value * 1000 : null;
}

function concentration(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? Number(value.toFixed(1))
    : null;
}

function forecastPoints(hourly, currentTime) {
  if (!Array.isArray(hourly.time) || !Number.isFinite(currentTime)) return [];

  return hourly.time.flatMap((time, index) => {
    const aqi = normalizeAqi(hourly.us_aqi?.[index]);
    if (dateFromEpochSeconds(time) === null || time <= currentTime || time > currentTime + 24 * HOUR_SECONDS || aqi === null) {
      return [];
    }
    return [{ time, aqi, pm25: concentration(hourly.pm2_5?.[index]) }];
  });
}

function usableTimeZone(value) {
  if (typeof value !== 'string') return 'UTC';
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value });
    return value;
  } catch {
    return 'UTC';
  }
}

function forecastFormatters(timeZone) {
  /** @type {Intl.DateTimeFormatOptions} */
  const options = { timeZone, hour: 'numeric', minute: '2-digit' };
  return {
    hour: new Intl.DateTimeFormat('en-US', options),
    full: new Intl.DateTimeFormat('en-US', { ...options, month: 'short', day: 'numeric', timeZoneName: 'short' })
  };
}

function findLowerPollutionWindow(points, currentTime, currentAqi, formatter) {
  let best = null;
  for (let index = 0; index + 1 < points.length; index += 1) {
    const first = points[index];
    const second = points[index + 1];
    const end = second.time + HOUR_SECONDS;
    const peak = Math.max(first.aqi, second.aqi);
    if (second.time - first.time !== HOUR_SECONDS || end > currentTime + 24 * HOUR_SECONDS || peak >= currentAqi) continue;

    const mean = (first.aqi + second.aqi) / 2;
    if (!best || mean < best.mean) best = { start: first.time, end, mean, peak };
  }

  if (!best) return null;
  const label = formatter.formatRange(best.start * 1000, best.end * 1000);
  return { label, peak: best.peak };
}

async function getJson(endpoint, params, signal, timeoutMs) {
  const deadline = AbortSignal.timeout(timeoutMs);
  const requestSignal = signal ? AbortSignal.any([signal, deadline]) : deadline;
  const response = await fetch(`${endpoint}?${new URLSearchParams(params)}`, { signal: requestSignal });
  if (!response.ok) throw new Error(`Open-Meteo returned HTTP ${response.status}`);
  return response.json();
}

/** Search locations through Open-Meteo's public geocoding API. */
export async function searchLocations(query = '', signal) {
  const name = query.trim();
  if (name.length < 2) return [];
  const data = await getJson(GEOCODING_ENDPOINT, { name, count: '5', language: 'en', format: 'json' }, signal, 6000);
  if (!Array.isArray(data?.results)) return [];
  return data.results.flatMap((item) => {
    if (!Number.isInteger(item?.id) || typeof item.name !== 'string' || !item.name.trim()
      || !hasValidCoordinates(item.latitude, item.longitude)) return [];
    return [{
      id: `geo_${item.id}`,
      name: item.name,
      region: [item.admin1, item.country].filter(Boolean).join(', '),
      country: item.country,
      country_code: item.country_code,
      lat: item.latitude,
      lon: item.longitude
    }];
  });
}

function normalizeReading(location, airData, weather) {
  const current = airData?.current ?? {};
  const aqi = normalizeAqi(current.us_aqi);
  if (aqi === null) throw new Error('Open-Meteo did not return a valid current US AQI');

  const timezone = usableTimeZone(airData.timezone);
  const formatters = forecastFormatters(timezone);
  const observedAt = dateFromEpochSeconds(current.time);
  const points = observedAt === null ? [] : forecastPoints(airData.hourly ?? {}, current.time);
  const lowerWindow = findLowerPollutionWindow(points, current.time, aqi, formatters.full);
  const category = getUsAqiCategory(aqi);
  const windKph = concentration(weather?.wind_speed_10m);

  return {
    ...createEmptyReading(location, `${category} • Open-Meteo model estimate`),
    timezone,
    aqi,
    category,
    pm25: concentration(current.pm2_5),
    pm10: concentration(current.pm10),
    observedAt,
    tempC: Number.isFinite(weather?.temperature_2m) ? Math.round(weather.temperature_2m) : null,
    humidity: Number.isFinite(weather?.relative_humidity_2m) ? Math.round(weather.relative_humidity_2m) : null,
    windSpeed: windKph === null ? null : `${(windKph / 3.6).toFixed(1)} m/s`,
    cleanestWindow: lowerWindow?.label ?? null,
    cleanestWindowPeakAqi: lowerWindow?.peak ?? null,
    diurnalHourly: points.map(({ time, aqi, pm25 }) => ({
      time,
      hour: formatters.hour.format(time * 1000),
      dateLabel: formatters.full.format(time * 1000),
      aqi,
      pm25,
      label: getUsAqiCategory(aqi)
    })),
    timestamp: Date.now(),
    isLive: true
  };
}

/** Fetch current model estimates, a 24-hour hourly trend, and weather context. */
export async function fetchAirData(location, signal) {
  const coordinates = { latitude: String(location.lat), longitude: String(location.lon), timezone: 'auto' };
  const weather = getJson(WEATHER_ENDPOINT, {
    ...coordinates,
    current: 'temperature_2m,relative_humidity_2m,wind_speed_10m'
  }, signal, 3500).catch(() => null);

  try {
    const airData = await getJson(AIR_ENDPOINT, {
      ...coordinates,
      current: 'pm2_5,pm10,us_aqi',
      hourly: 'pm2_5,us_aqi',
      forecast_days: '2',
      timeformat: 'unixtime'
    }, signal, 8000);
    const reading = normalizeReading(location, airData, (await weather)?.current);
    signal?.throwIfAborted();
    saveAirData(location, reading);
    return reading;
  } catch {
    signal?.throwIfAborted();
    return readCachedAirData(location) ?? createEmptyReading(location);
  }
}
