const FEED_URL = 'https://snapdata.dev/api/v1/aqi/in/latest.json';
const SEARCH_RADIUS_KM = 25;
const CACHE_TTL_MS = 15 * 60 * 1000;
const MAX_READING_AGE_MS = 6 * 60 * 60 * 1000;
const MAX_FEED_BYTES = 4 * 1024 * 1024;

/**
 * @typedef {{ latitude: number, longitude: number }} Coordinates
 * @typedef {{ parameter: 'PM2.5' | 'PM10', value: number, time: number }} Measurement
 * @typedef {Coordinates & { name: string, city: string | null, measurements: Map<string, Measurement> }} Station
 */

/** @param {Coordinates} origin @param {Coordinates} station */
function distanceKm(origin, station) {
  const radians = (degrees) => degrees * Math.PI / 180;
  const latitudeDelta = radians(station.latitude - origin.latitude);
  const longitudeDelta = radians(station.longitude - origin.longitude);
  const arc = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(radians(origin.latitude)) * Math.cos(radians(station.latitude))
    * Math.sin(longitudeDelta / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(Math.min(1, arc)));
}

/** @param {number} latitude @param {number} longitude */
function validCoordinates(latitude, longitude) {
  return Number.isFinite(latitude) && Math.abs(latitude) <= 90
    && Number.isFinite(longitude) && Math.abs(longitude) <= 180;
}

/** @param {Response} response */
async function readFeed(response) {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('CPCB station feed returned an empty response.');

  const decoder = new TextDecoder();
  let bytes = 0;
  let text = '';
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) return JSON.parse(text + decoder.decode());
      bytes += value.byteLength;
      if (bytes > MAX_FEED_BYTES) {
        await reader.cancel();
        throw new Error('CPCB station feed exceeded the response size limit.');
      }
      text += decoder.decode(value, { stream: true });
    }
  } finally {
    reader.releaseLock();
  }
}

/** @param {unknown} value */
function parseFeedTime(value) {
  // Require an explicit offset so the same report has the same age on every server.
  if (typeof value !== 'string' || !/(?:Z|[+-]\d{2}:\d{2})$/iu.test(value)) return NaN;
  return Date.parse(value);
}

/** @param {any} data @param {number} fetchedAt */
function normalizeFeed(data, fetchedAt) {
  if (!Array.isArray(data?.records) || data.records.length > 100000) {
    throw new Error('CPCB station feed returned an invalid dataset.');
  }

  /** @type {Map<string, Station>} */
  const stations = new Map();
  for (const record of data.records) {
    if (typeof record?.station !== 'string' || !record.station.trim()
      || !validCoordinates(record.latitude, record.longitude)) continue;

    const { latitude, longitude } = record;
    const key = JSON.stringify([record.station, latitude, longitude]);
    let station = stations.get(key);
    if (!station) {
      station = {
        name: record.station.trim().slice(0, 120),
        city: typeof record.city === 'string' ? record.city.slice(0, 100) : null,
        latitude,
        longitude,
        measurements: new Map()
      };
      stations.set(key, station);
    }

    const parameter = typeof record.pollutant === 'string' ? record.pollutant.toUpperCase() : '';
    if (parameter !== 'PM2.5' && parameter !== 'PM10') continue;
    const rawValue = record.avg;
    const value = typeof rawValue === 'string' && rawValue.trim() ? Number(rawValue) : rawValue;
    const time = parseFeedTime(record.updated_at);
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0
      || !Number.isFinite(time) || time > fetchedAt) continue;

    const previous = station.measurements.get(parameter);
    if (!previous || time > previous.time) {
      station.measurements.set(parameter, { parameter, value: Number(value.toFixed(1)), time });
    }
  }

  const generatedAt = parseFeedTime(data.generated_at);
  return {
    stations: [...stations.values()],
    generatedAt: Number.isFinite(generatedAt) ? new Date(generatedAt).toISOString() : null,
    expiresAt: fetchedAt + CACHE_TTL_MS,
    stale: false
  };
}

/** @param {Station} station @param {number} now */
function recentMeasurements(station, now) {
  return [...station.measurements.values()].filter(({ time }) => time <= now && now - time <= MAX_READING_AGE_MS);
}

/** @param {{ fetchImpl?: typeof fetch, now?: () => number }} [options] */
export function createGroundStationService({ fetchImpl = fetch, now = Date.now } = {}) {
  /** @type {ReturnType<typeof normalizeFeed> | undefined} */
  let cachedFeed;
  /** @type {Promise<ReturnType<typeof normalizeFeed>> | undefined} */
  let pendingFeed;

  async function fetchFeed() {
    try {
      const response = await fetchImpl(FEED_URL, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(8000)
      });
      if (!response.ok) {
        throw Object.assign(new Error(`CPCB station feed returned HTTP ${response.status}.`), { status: response.status });
      }
      const data = await readFeed(response);
      cachedFeed = normalizeFeed(data, now());
      return cachedFeed;
    } catch (error) {
      if (cachedFeed) return { ...cachedFeed, stale: true };
      throw error;
    }
  }

  async function getFeed() {
    if (cachedFeed && cachedFeed.expiresAt > now()) return cachedFeed;
    // All coordinates use the same feed. Its deadline is independent of a browser disconnecting.
    pendingFeed ??= fetchFeed().finally(() => { pendingFeed = undefined; });
    return pendingFeed;
  }

  /** @param {number} latitude @param {number} longitude */
  async function getNearestStation(latitude, longitude) {
    if (!validCoordinates(latitude, longitude)) return { status: 'invalid_request' };
    if (latitude < 6 || latitude > 38 || longitude < 67 || longitude > 99) {
      return { status: 'unsupported_region' };
    }

    const origin = { latitude: Number(latitude.toFixed(2)), longitude: Number(longitude.toFixed(2)) };
    const feed = await getFeed();
    const lookupTime = now();
    let hasNearbyStation = false;
    let nearest = null;

    for (const station of feed.stations) {
      const distance = distanceKm(origin, station);
      if (distance > SEARCH_RADIUS_KM) continue;
      hasNearbyStation = true;
      if (nearest && distance >= nearest.distance) continue;
      const measurements = recentMeasurements(station, lookupTime);
      if (measurements.length > 0) nearest = { station, distance, measurements };
    }

    if (!nearest) {
      return { status: hasNearbyStation ? 'no_recent_measurements' : 'no_station', radiusKm: SEARCH_RADIUS_KM };
    }

    return {
      status: 'available',
      source: 'CPCB via data.gov.in',
      sourceUrl: 'https://www.data.gov.in/resource/real-time-air-quality-index-various-locations',
      mirrorUrl: 'https://snapdata.dev/docs/datasets/aqi/',
      license: 'Government Open Data License - India',
      locationName: nearest.station.name,
      city: nearest.station.city,
      distanceKm: Number(nearest.distance.toFixed(1)),
      generatedAt: feed.generatedAt,
      cached: feed.stale,
      measurements: nearest.measurements
        .sort((left, right) => left.parameter.localeCompare(right.parameter))
        .map(({ parameter, value, time }) => ({ parameter, value, unit: 'µg/m³', observedAt: new Date(time).toISOString() }))
    };
  }

  return { getNearestStation };
}
