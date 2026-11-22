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

function concentration(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? Number(value.toFixed(1))
    : null;
}

function forecastPoints(hourly, currentTime) {
  if (!Array.isArray(hourly.time) || !Number.isFinite(currentTime)) return [];

  return hourly.time.flatMap((time, index) => {
    const aqi = normalizeAqi(hourly.us_aqi?.[index]);
    if (!Number.isFinite(time) || time <= currentTime || time > currentTime + 24 * HOUR_SECONDS || aqi === null) {
      return [];
    }
    return [{ time, aqi, pm25: concentration(hourly.pm2_5?.[index]) }];
  });
}

function forecastFormatters(timeZone) {
  const options = { timeZone, hour: 'numeric', minute: '2-digit' };
  try {
    return {
      hour: new Intl.DateTimeFormat('en-US', options),
      full: new Intl.DateTimeFormat('en-US', { ...options, month: 'short', day: 'numeric', timeZoneName: 'short' })
    };
  } catch {
    return forecastFormatters('UTC');
  }
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

/** Search locations through Open-Meteo's public geocoding API. */
export async function searchLocations(query, signal) {
  if (!query || query.trim().length < 2) return [];
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query.trim())}&count=5&language=en&format=json`;
    const response = await fetch(url, { signal });
    if (!response.ok) throw new Error(`Geocoding HTTP error ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data?.results)) return [];
    return data.results.map((item) => ({
      id: `geo_${item.id}`,
      name: item.name,
      region: [item.admin1, item.country].filter(Boolean).join(', '),
      country: item.country,
      country_code: item.country_code,
      lat: item.latitude,
      lon: item.longitude
    }));
  } catch (error) {
    if (!signal?.aborted) throw error;
    return [];
  }
}

/** Fetch current model estimates, a 24-hour hourly trend, and weather context. */
export async function fetchAirData(location, signal) {
  const cacheLocation = location.id || `${Number(location.lat).toFixed(2)}_${Number(location.lon).toFixed(2)}`;
  const cacheKey = `aura_air_cache_${cacheLocation}`;

  try {
    const airParams = new URLSearchParams({
      latitude: String(location.lat),
      longitude: String(location.lon),
      current: 'pm2_5,pm10,us_aqi',
      hourly: 'pm2_5,us_aqi',
      forecast_days: '2',
      timeformat: 'unixtime',
      timezone: 'auto'
    });
    const weatherParams = new URLSearchParams({
      latitude: String(location.lat),
      longitude: String(location.lon),
      current: 'temperature_2m,relative_humidity_2m,wind_speed_10m',
      timezone: 'auto'
    });

    const airSignal = signal ? AbortSignal.any([signal, AbortSignal.timeout(8000)]) : AbortSignal.timeout(8000);
    const weatherTimeout = AbortSignal.timeout(3500);
    const weatherSignal = signal ? AbortSignal.any([signal, weatherTimeout]) : weatherTimeout;
    const weatherRequest = fetch(`https://api.open-meteo.com/v1/forecast?${weatherParams}`, { signal: weatherSignal })
      .then((response) => response.ok ? response.json() : null)
      .catch(() => null);
    const airResponse = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?${airParams}`, { signal: airSignal });
    if (!airResponse.ok) throw new Error(`Air Quality HTTP error ${airResponse.status}`);

    const airData = await airResponse.json();
    const current = airData.current || {};
    const aqi = normalizeAqi(current.us_aqi);
    if (aqi === null) throw new Error('Open-Meteo did not return a valid current US AQI');

    const timezone = typeof airData.timezone === 'string' ? airData.timezone : 'UTC';
    const formatters = forecastFormatters(timezone);
    const points = forecastPoints(airData.hourly || {}, current.time);
    const lowerWindow = findLowerPollutionWindow(points, current.time, aqi, formatters.full);
    const diurnalHourly = points.map(({ time, aqi, pm25 }) => ({
      time,
      hour: formatters.hour.format(time * 1000),
      dateLabel: formatters.full.format(time * 1000),
      aqi,
      pm25,
      label: getUsAqiCategory(aqi)
    }));
    const weather = (await weatherRequest)?.current || {};
    const tempC = Number.isFinite(weather.temperature_2m) ? Math.round(weather.temperature_2m) : null;
    const humidity = Number.isFinite(weather.relative_humidity_2m) ? Math.round(weather.relative_humidity_2m) : null;
    const windKph = concentration(weather.wind_speed_10m);
    signal?.throwIfAborted();

    const result = {
      id: location.id || 'custom',
      name: location.name || 'Selected location',
      region: location.region || 'Local coordinates',
      country: location.country,
      country_code: location.country_code,
      timezone,
      lat: location.lat,
      lon: location.lon,
      aqi,
      aqiSystem: 'US AQI',
      category: getUsAqiCategory(aqi),
      descriptor: `${getUsAqiCategory(aqi)} • Open-Meteo model estimate`,
      pm25: concentration(current.pm2_5),
      pm10: concentration(current.pm10),
      tempC,
      humidity,
      windSpeed: windKph === null ? null : `${(windKph / 3.6).toFixed(1)} m/s`,
      cleanestWindow: lowerWindow?.label ?? null,
      cleanestWindowPeakAqi: lowerWindow?.peak ?? null,
      diurnalHourly,
      meteorologyNotes: 'Modelled outdoor air quality can differ from street-level conditions.',
      timestamp: Date.now(),
      isLive: true,
      isCached: false,
      isFallback: false,
      dataProvider: 'Open-Meteo / CAMS'
    };

    try {
      if (typeof localStorage !== 'undefined') localStorage.setItem(cacheKey, JSON.stringify(result));
    } catch {
      // Storage can be unavailable in private browsing or when quota is full.
    }
    return result;
  } catch {
    signal?.throwIfAborted();

    try {
      if (typeof localStorage !== 'undefined') {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          const savedAt = Number(parsed.timestamp);
          const cachedAqi = normalizeAqi(parsed.aqi);
          const hasValidReading = cachedAqi !== null && parsed.aqiSystem === 'US AQI'
            && Number.isFinite(savedAt) && savedAt > 0 && savedAt <= Date.now();
          if (hasValidReading) {
            const ageHours = Math.max(0, (Date.now() - savedAt) / 3600000);
            return {
              ...parsed,
              aqi: cachedAqi,
              category: getUsAqiCategory(cachedAqi),
              descriptor: 'Cached Open-Meteo model estimate',
              cleanestWindow: null,
              cleanestWindowPeakAqi: null,
              diurnalHourly: [],
              isLive: false,
              isCached: true,
              isFallback: false,
              staleHours: Math.max(1, Math.ceil(ageHours))
            };
          }
        }
      }
    } catch {
      // Ignore malformed or unavailable cached data.
    }

    return {
      id: location.id || 'custom',
      name: location.name || 'Selected location',
      region: location.region || 'Local coordinates',
      country: location.country,
      country_code: location.country_code,
      aqi: null,
      aqiSystem: 'US AQI',
      category: 'Unavailable',
      descriptor: 'Live air-quality data unavailable',
      pm25: null,
      pm10: null,
      tempC: null,
      humidity: null,
      windSpeed: null,
      cleanestWindow: null,
      diurnalHourly: [],
      timestamp: null,
      isLive: false,
      isCached: false,
      isFallback: false
    };
  }
}
