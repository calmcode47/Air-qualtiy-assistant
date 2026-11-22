import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchAirData,
  searchLocations,
  DEFAULT_LOCATIONS
} from '../services/airData';
import { fetchNearbyGroundStation } from '../services/groundStation';

const AirContext = createContext(null);

function getInitialLocationData(location) {
  return {
    id: location?.id || 'custom',
    name: location?.name || 'Selected location',
    region: location?.region || 'Local coordinates',
    aqi: null,
    aqiSystem: 'US AQI',
    category: 'Unavailable',
    pm25: null,
    pm10: null,
    cleanestWindow: null,
    diurnalHourly: [],
    isLive: false,
    isCached: false,
    descriptor: 'Waiting for live or cached data'
  };
}

export function AirProvider({ children }) {
  const [initialLocation] = useState(() => {
    try {
      const saved = localStorage.getItem('aura_selected_location');
      const location = saved ? JSON.parse(saved) : null;
      if (location?.id?.startsWith?.('loc_') && Number.isFinite(location.lat) && Number.isFinite(location.lon)) {
        return { ...location, lat: Math.round(location.lat * 100) / 100, lon: Math.round(location.lon * 100) / 100 };
      }
      if (location && typeof location.id === 'string' && Number.isFinite(location.lat) && Number.isFinite(location.lon)) return location;
    } catch {}
    return DEFAULT_LOCATIONS.delhi;
  });

  const [airData, setAirData] = useState(() => getInitialLocationData(initialLocation));
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
      if (!document.hidden && navigator.onLine && Date.now() - (lastReadingAt || 0) >= 30 * 60 * 1000) {
        refresh();
      }
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', refreshIfOlder);
    const timer = window.setInterval(refreshIfOlder, 30 * 60 * 1000);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', refreshIfOlder);
      window.clearInterval(timer);
    };
  }, [lastReadingAt, refresh]);

  const selectLocation = useCallback((locationOrKey) => {
    const location = typeof locationOrKey === 'string' ? DEFAULT_LOCATIONS[locationOrKey] : locationOrKey;
    if (!location || !Number.isFinite(location.lat) || !Number.isFinite(location.lon)) return;
    locationAttempt.current += 1;
    if (latestLocation.current.id === location.id) {
      refresh();
      return;
    }

    latestLocation.current = location;
    setAirData(getInitialLocationData(location));
    refresh();
    try {
      localStorage.setItem('aura_selected_location', JSON.stringify(location));
    } catch {}
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
        const lat = Math.round(position.coords.latitude * 100) / 100;
        const lon = Math.round(position.coords.longitude * 100) / 100;
        selectLocation({ id: `loc_${lat}_${lon}`, name: 'My Current Location', region: 'Approximate browser location', lat, lon });
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
