// @ts-check

const FEED_URL = 'https://snapdata.dev/api/v1/aqi/in/latest.json';
const SEARCH_RADIUS_KM = 25;
const CACHE_TTL_MS = 15 * 60 * 1000;
const MAX_READING_AGE_MS = 6 * 60 * 60 * 1000;
const MAX_FEED_BYTES = 4 * 1024 * 1024;

/** @param {number} latitudeA @param {number} longitudeA @param {number} latitudeB @param {number} longitudeB */
function distanceKm(latitudeA, longitudeA, latitudeB, longitudeB) {
  const radians = (degrees) => degrees * Math.PI / 180;
  const latitudeDelta = radians(latitudeB - latitudeA);
  const longitudeDelta = radians(longitudeB - longitudeA);
  const arc = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(radians(latitudeA)) * Math.cos(radians(latitudeB))
    * Math.sin(longitudeDelta / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(arc), Math.sqrt(1 - arc));
}

/** @param {any} data */
function normalizeFeed(data) {
  if (!Array.isArray(data?.records) || data.records.length > 100000) {
    throw new Error('CPCB station feed returned an invalid dataset.');
  }
  return data.records;
}

/** @param {number} latitude @param {number} longitude */
function isIndiaLocation(latitude, longitude) {
  return latitude >= 6 && latitude <= 38 && longitude >= 67 && longitude <= 99;
}

/** @param {{ fetchImpl?: typeof fetch, now?: () => number }} [options] */
export function createGroundStationService({ fetchImpl = fetch, now = Date.now } = {}) {
  let cachedFeed = null;

  /** @param {AbortSignal | undefined} signal */
  async function getFeed(signal) {
    if (cachedFeed && cachedFeed.expiresAt > now()) return cachedFeed;

    try {
      const timeout = AbortSignal.timeout(8000);
      const requestSignal = signal ? AbortSignal.any([signal, timeout]) : timeout;
      const response = await fetchImpl(FEED_URL, {
        headers: { Accept: 'application/json' },
        signal: requestSignal
      });
      if (!response.ok) {
        const error = Object.assign(new Error(`CPCB station feed returned HTTP ${response.status}.`), { status: response.status });
        throw error;
      }
      const text = await response.text();
      if (text.length > MAX_FEED_BYTES) throw new Error('CPCB station feed exceeded the response size limit.');
      const data = JSON.parse(text);
      cachedFeed = {
        records: normalizeFeed(data),
        generatedAt: typeof data.generated_at === 'string' ? data.generated_at : null,
        expiresAt: now() + CACHE_TTL_MS
      };
      return cachedFeed;
    } catch (error) {
      if (cachedFeed && !signal?.aborted) return { ...cachedFeed, stale: true };
      throw error;
    }
  }

  /** @param {number} latitude @param {number} longitude @param {AbortSignal} [signal] */
  async function getNearestStation(latitude, longitude, signal) {
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)
      || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return { status: 'invalid_request' };
    }
    if (!isIndiaLocation(latitude, longitude)) return { status: 'unsupported_region' };

    const roundedLatitude = Number(latitude.toFixed(2));
    const roundedLongitude = Number(longitude.toFixed(2));
    const feed = await getFeed(signal);
    const stations = new Map();

    for (const record of feed.records) {
      if (typeof record?.station !== 'string'
        || !Number.isFinite(record.latitude) || !Number.isFinite(record.longitude)
        || typeof record.updated_at !== 'string') continue;
      const parameter = String(record.pollutant || '').toUpperCase();
      if (!['PM2.5', 'PM10'].includes(parameter)) continue;
      const value = record.avg === null || record.avg === undefined ? NaN : Number(record.avg);
      const observedAt = Date.parse(record.updated_at);
      if (!Number.isFinite(value) || value < 0 || !Number.isFinite(observedAt)
        || observedAt > now() || now() - observedAt > MAX_READING_AGE_MS) continue;

      const key = `${record.station}|${record.latitude}|${record.longitude}`;
      let station = stations.get(key);
      if (!station) {
        station = {
          name: record.station.slice(0, 120),
          city: typeof record.city === 'string' ? record.city.slice(0, 100) : null,
          latitude: record.latitude,
          longitude: record.longitude,
          measurements: new Map()
        };
        stations.set(key, station);
      }
      const existing = station.measurements.get(parameter);
      if (!existing || observedAt > Date.parse(existing.observedAt)) {
        station.measurements.set(parameter, {
          parameter,
          value: Number(value.toFixed(1)),
          unit: parameter === 'PM2.5' || parameter === 'PM10' ? 'µg/m³' : null,
          observedAt: record.updated_at
        });
      }
    }

    const candidates = [...stations.values()]
      .map((station) => ({
        ...station,
        distance: distanceKm(roundedLatitude, roundedLongitude, station.latitude, station.longitude)
      }))
      .filter((station) => station.distance <= SEARCH_RADIUS_KM)
      .sort((left, right) => left.distance - right.distance);

    if (candidates.length === 0) {
      return { status: 'no_station', radiusKm: SEARCH_RADIUS_KM };
    }
    const nearest = candidates.find((station) => station.measurements.size > 0);
    if (!nearest) return { status: 'no_recent_measurements', radiusKm: SEARCH_RADIUS_KM };

    return {
      status: 'available',
      source: 'CPCB via data.gov.in',
      sourceUrl: 'https://www.data.gov.in/resource/real-time-air-quality-index-various-locations',
      mirrorUrl: 'https://snapdata.dev/docs/datasets/aqi/',
      license: 'Government Open Data License - India',
      locationName: nearest.name,
      city: nearest.city,
      distanceKm: Number(nearest.distance.toFixed(1)),
      generatedAt: feed.generatedAt,
      cached: Boolean(feed.stale),
      measurements: [...nearest.measurements.values()].sort((left, right) => left.parameter.localeCompare(right.parameter))
    };
  }

  return { getNearestStation };
}
