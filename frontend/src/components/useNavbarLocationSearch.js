import { useEffect, useRef, useState } from 'react';

export default function useNavbarLocationSearch({ searchLocations, selectLocation }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const searchInputRef = useRef(null);
  const searchButtonRef = useRef(null);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  function updateSearchQuery(query) {
    setSearchQuery(query);
    setSearchResults([]);
    setSearchError(false);
    setIsSearching(query.trim().length >= 2);
  }

  useEffect(() => {
    if (!searchOpen || searchQuery.trim().length < 2) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const results = await searchLocations(searchQuery, controller.signal);
        if (!controller.signal.aborted) {
          setSearchResults(results);
        }
      } catch {
        if (!controller.signal.aborted) setSearchError(true);
      } finally {
        if (!controller.signal.aborted) setIsSearching(false);
      }
    }, 350);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery, searchOpen, searchLocations]);

  function handleSelectLocation(location) {
    selectLocation(location);
    searchButtonRef.current?.focus();
    setSearchOpen(false);
    updateSearchQuery('');
  }

  return {
    searchOpen,
    setSearchOpen,
    searchQuery,
    searchResults,
    isSearching,
    searchError,
    searchInputRef,
    searchButtonRef,
    updateSearchQuery,
    handleSelectLocation
  };
}
