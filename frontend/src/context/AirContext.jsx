import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchAirData,
  getCachedReadingAgeHours,
  hasValidCoordinates,
  searchLocations,
  createEmptyReading,
  DEFAULT_LOCATIONS
} from '../services/airData';
import { fetchNearbyGroundStation } from '../services/groundStation';

const AirContext = createContext(null);
const LOCATION_STORAGE_KEY = 'aura_selected_location';
const REFRESH_INTERVAL_MS = 30 * 60 * 1000;
const CACHE_AGE_INTERVAL_MS = 60 * 1000;

function browserLocation(latitude, longitude) {
  const lat = Number(latitude.toFixed(2));
  const lon = Number(longitude.toFixed(2));
  return { id: `loc_${lat}_${lon}`, name: 'My Current Location', region: 'Approximate browser location', lat, lon };
}

function readSavedLocation() {
  try {
    const location = JSON.parse(localStorage.getItem(LOCATION_STORAGE_KEY));
    if (location && Object.hasOwn(DEFAULT_LOCATIONS, location.id)) return DEFAULT_LOCATIONS[location.id];
    if (typeof location?.id !== 'string' || !hasValidCoordinates(location.lat, location.lon)) return DEFAULT_LOCATIONS.delhi;
    if (location.id.startsWith('loc_')) return browserLocation(location.lat, location.lon);
    if (typeof location.name !== 'string' || !location.name.trim()) return DEFAULT_LOCATIONS.delhi;
    return {
      id: location.id,
      name: location.name.trim(),
      region: typeof location.region === 'string' ? location.region : '',
      country: typeof location.country === 'string' ? location.country : undefined,
      country_code: typeof location.country_code === 'string' ? location.country_code : undefined,
      lat: location.lat,
      lon: location.lon
    };
  } catch {
    return DEFAULT_LOCATIONS.delhi;
  }
}

export function AirProvider({ children }) {
  const [initialLocation] = useState(readSavedLocation);
  const [airData, setAirData] = useState(() => createEmptyReading(initialLocation, 'Waiting for live or cached data'));
  const [groundStation, setGroundStation] = useState({ status: 'loading' });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOffline, setIsOffline] = useState(() => typeof navigator !== 'undefined' ? !navigator.onLine : false);

  const latestLocation = useRef(initialLocation);
  const activeRequest = useRef(null);
  const locationAttempt = useRef(0);

  const loadAirData = useCallback((location) => {
    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;
    fetchNearbyGroundStation(location, controller.signal)
      .then((station) => {
        if (!controller.signal.aborted) setGroundStation(station);
      })
      .catch(() => {
        if (!controller.signal.aborted) setGroundStation({ status: 'unavailable' });
      });
    return fetchAirData(location, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setAirData(data);
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setError('Could not load air-quality data. Check your connection or try another location.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    loadAirData(initialLocation);
    return () => activeRequest.current?.abort();
  }, [initialLocation, loadAirData]);

  useEffect(() => {
    if (!airData.isCached) return;
    const updateAge = () => {
      setAirData((current) => {
        if (!current.isCached) return current;
        const staleHours = getCachedReadingAgeHours(current.timestamp);
        return staleHours === current.staleHours ? current : { ...current, staleHours };
      });
    };
    const timer = window.setInterval(updateAge, CACHE_AGE_INTERVAL_MS);
    document.addEventListener('visibilitychange', updateAge);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', updateAge);
    };
  }, [airData.isCached]);

  const refresh = useCallback(() => {
    setIsLoading(true);
    setError(null);
    setGroundStation({ status: 'loading' });
    return loadAirData(latestLocation.current);
  }, [loadAirData]);

  const lastReadingAt = airData.timestamp;
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      refresh();
    };
    const handleOffline = () => {
      setIsOffline(true);
      refresh();
    };
    const refreshIfOlder = () => {
      if (!document.hidden && navigator.onLine && Date.now() - (lastReadingAt || 0) >= REFRESH_INTERVAL_MS) {
        refresh();
      }
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', refreshIfOlder);
    const timer = window.setInterval(refreshIfOlder, REFRESH_INTERVAL_MS);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', refreshIfOlder);
      window.clearInterval(timer);
    };
  }, [lastReadingAt, refresh]);

  const selectLocation = useCallback((locationOrKey) => {
    const location = typeof locationOrKey === 'string' ? DEFAULT_LOCATIONS[locationOrKey] : locationOrKey;
    if (!location || !hasValidCoordinates(location.lat, location.lon)) return;
    locationAttempt.current += 1;
    if (latestLocation.current.id === location.id) {
      refresh();
      return;
    }

    latestLocation.current = location;
    setAirData(createEmptyReading(location, 'Waiting for live or cached data'));
    refresh();
    try {
      localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(location));
    } catch {
      // The selected location is still usable for this session.
    }
  }, [refresh]);

  const requestCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    const attempt = ++locationAttempt.current;
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (attempt !== locationAttempt.current) return;
        selectLocation(browserLocation(position.coords.latitude, position.coords.longitude));
      },
      () => {
        if (attempt === locationAttempt.current) {
          setError('Location access was denied or timed out. You can pick a city or search manually.');
        }
      },
      { timeout: 8000 }
    );
  }, [selectLocation]);

  return (
    <AirContext.Provider
      value={{
        airData,
        groundStation,
        outdoorAqi: airData?.aqi ?? null,
        isLoading,
        error,
        isOffline,
        isStale: Boolean(airData?.isCached && airData?.staleHours >= 2),
        isCached: Boolean(airData?.isCached),
        staleHours: airData?.staleHours || 0,
        selectLocation,
        searchLocations,
        requestCurrentLocation
      }}
    >
      {children}
    </AirContext.Provider>
  );
}

export function useAir() {
  const context = useContext(AirContext);
  if (!context) {
    throw new Error('useAir must be used within an AirProvider');
  }
  return context;
}
