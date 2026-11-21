import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Sparkles,
  Clock,
  Wrench,
  Users,
  Shield,
  Layers,
  Home,
  MapPin,
  Menu,
  X,
  Search,
  Crosshair,
  WifiOff,
  AlertTriangle,
  RotateCw,
  Globe,
  BookOpen,
  HelpCircle,
  Share2
} from 'lucide-react';
import { useAir } from '../context/AirContext';
import { useProfile } from '../store/profile';

export default function Navbar({
  activePage,
  setActivePage,
  selectedCity,
  setSelectedCity,
  cityData: propCityData,
  outdoorAqi: propOutdoorAqi,
  openMaskGuide,
  openGlossary,
  openShareToday
}) {
  const { t, i18n } = useTranslation();
  let location, navigate;
  try {
    location = useLocation();
    navigate = useNavigate();
  } catch (e) {
    location = { pathname: '/' };
    navigate = null;
  }

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);
  const searchInputRef = useRef(null);

  // Read from AirProvider context
  let airContext;
  try {
    airContext = useAir();
  } catch (e) {
    airContext = null;
  }

  let profileContext;
  try {
    profileContext = useProfile();
  } catch (e) {
    profileContext = null;
  }

  const cityData = airContext?.airData || propCityData || {};
  const outdoorAqi = airContext ? airContext.outdoorAqi : propOutdoorAqi ?? null;
  const isOffline = airContext?.isOffline || false;
  const isStale = airContext?.isStale || false;
  const isCached = Boolean(airContext?.isCached || cityData?.isCached);
  const isFallback = airContext?.isFallback || false;
  const staleHours = airContext?.staleHours || 0;
  const isLoading = airContext?.isLoading || false;

  const currentLang = i18n.language ? i18n.language.split('-')[0] : (profileContext?.profile?.preferredLanguage || 'en');
  const isSimpleMode = profileContext?.isSimpleMode ?? true;

  const handleLanguageChange = (lng) => {
    i18n.changeLanguage(lng);
    profileContext?.updateProfile({ preferredLanguage: lng });
  };

  const navItems = [
    { id: 'overview', path: '/', label: t('nav.overview', 'Overview'), icon: Home },
    { id: 'advisor', path: '/advisor', label: t('nav.advisor', 'AI Advisor'), icon: Sparkles },
    { id: 'routines', path: '/routines', label: t('nav.routines', 'Daily Routines'), icon: Clock },
    { id: 'hacks', path: '/hacks', label: t('nav.hacks', 'DIY Filter & Hacks'), icon: Wrench },
    { id: 'community', path: '/community', label: t('nav.community', 'Community Shield'), icon: Users },
    { id: 'impact', path: '/impact', label: t('nav.impact', 'Impact Calculator'), icon: Shield },
    { id: 'sanctuary', path: '/home', label: t('nav.sanctuary', '3D Sanctuary'), icon: Layers }
  ];

  const handleNavClick = (item) => {
    const targetPath = typeof item === 'string'
      ? (item === 'overview' ? '/' : item === 'sanctuary' ? '/home' : item.startsWith('/') ? item : `/${item}`)
      : item.path;
    const targetId = typeof item === 'string' ? item : item.id;

    if (navigate) {
      navigate(targetPath);
    }
    if (setActivePage) {
      setActivePage(targetId);
    }
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isItemActive = (item) => {
    if (location?.pathname) {
      if (item.path === '/') return location.pathname === '/' || location.pathname === '/overview';
      return location.pathname === item.path || (item.id === 'sanctuary' && location.pathname === '/sanctuary');
    }
    return activePage === item.id;
  };

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  const search = airContext?.searchLocations;
  useEffect(() => {
    setSearchResults([]);
    setSearchError(false);
    setIsSearching(Boolean(searchOpen && searchQuery.trim().length >= 2 && search));
    if (!searchOpen || searchQuery.trim().length < 2 || !search) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(6000)]);
        const results = await search(searchQuery, signal);
        if (!controller.signal.aborted) {
          setSearchResults(results);
          setSearchError(signal.aborted);
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
  }, [searchQuery, searchOpen, search]);

  const handleSelectLocation = (location) => {
    (airContext?.selectLocation || setSelectedCity)?.(location);
    setSearchOpen(false);
    setSearchQuery('');
  };

  const handleQuickCityChange = (key) => {
    (airContext?.selectLocation || setSelectedCity)?.(key);
  };

  const handleGeolocationClick = () => {
    if (airContext?.useCurrentLocation) {
      airContext.useCurrentLocation();
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-[#FAF8F4]/95 backdrop-blur-md border-b border-[#E7E0D2] shadow-xs">
      {/* Top Advisory Banner (Static, Dismissible) */}
      {!isBannerDismissed && (
        <div className="bg-[#18261F] text-[#F4F2EC] px-4 py-1.5 text-xs font-medium">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1.5">
            <div className="flex items-center gap-2">
              {isOffline && isCached ? (
                <span className="flex items-center gap-1.5 text-[#F3C474] font-semibold text-[11px]">
                  <WifiOff className="w-3.5 h-3.5 fill-[#D18820] text-[#18261F]" />
                  Offline — showing saved data
                </span>
              ) : (isStale || isCached) ? (
                <span className="flex items-center gap-1.5 text-[#F3C474] font-semibold text-[11px]">
                  <Clock className="w-3.5 h-3.5 fill-[#D18820] text-[#18261F]" />
                  {isStale ? `Data is ${staleHours}h old (cached)` : 'Showing cached data'}
                </span>
              ) : isFallback ? (
                <span className="flex items-center gap-1.5 text-[#A6BCB0] font-semibold text-[11px]">
                  <AlertTriangle className="w-3.5 h-3.5 fill-[#D18820] text-[#18261F]" />
                  Sample data · not current
                </span>
              ) : isOffline ? (
                <span className="flex items-center gap-1.5 text-[#F3C474] font-semibold text-[11px]">
                  <WifiOff className="w-3.5 h-3.5" />
                  Offline — no saved reading for this location
                </span>
              ) : (
                <>
                  <span className="text-[11px] text-[#D8E4DC]">
                    {cityData.isLive ? 'Open-Meteo model estimate · not a street-level sensor' : 'Air-quality reading unavailable'}
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center gap-3 text-[11px] text-[#A6BCB0] font-mono-code">
              <span>Lower forecast period: <strong className="text-[#8AB394]">{cityData.cleanestWindow || 'Unavailable'}</strong></span>
              <span className="hidden md:inline">•</span>
              <span className="hidden md:inline">Educational Health Tool</span>
              <button
                type="button"
                onClick={() => setIsBannerDismissed(true)}
                className="ml-2 text-[#A6BCB0] hover:text-white p-0.5 rounded transition"
                title="Dismiss banner"
                aria-label="Dismiss banner"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
        {/* Brand & Subtitle */}
        <button
          onClick={() => handleNavClick('overview')}
          className="flex items-center gap-3 text-left group focus:outline-none"
        >
          <div className="w-9 h-9 rounded-2xl bg-[#18261F] text-[#F4F2EC] flex items-center justify-center font-serif text-base font-bold shadow-sm group-hover:scale-105 transition">
            e
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold font-serif-natural text-[#18261F] tracking-tight">
                Aura
              </span>
              <span className="text-[10px] font-mono-code font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#EAE4D8] text-[#56685F]">
                Smog Companion
              </span>
            </div>
            <div className="text-[10px] font-mono-code text-[#56685F] leading-none">
              Urban Air Quality Assistant
            </div>
          </div>
        </button>

        {/* Desktop Page Navigation Links */}
        <nav className="hidden xl:flex items-center gap-1 bg-[#EFECE3] p-1 rounded-2xl border border-[#DFD8CC]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = isItemActive(item);
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                  isActive
                    ? 'bg-[#18261F] text-[#F4F2EC] shadow-sm'
                    : 'text-[#56685F] hover:text-[#18261F] hover:bg-white/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#688A72]' : ''}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right: Location Selector, Search, Geolocation & AQI Status Badge */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Geolocation Button */}
          <button
            type="button"
            onClick={handleGeolocationClick}
            className="p-1.5 sm:p-2 rounded-full bg-[#FAF7F2] border border-[#DDD5C7] text-[#56685F] hover:text-[#18261F] hover:bg-[#EFECE3] transition shadow-2xs"
            title="Use my current location (GPS)"
            aria-label="Use current location"
          >
            <Crosshair className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#A94A28]' : ''}`} />
          </button>

          {/* Search Trigger Button */}
          <button
            type="button"
            onClick={() => setSearchOpen(!searchOpen)}
            aria-expanded={searchOpen}
            className="p-1.5 sm:p-2 rounded-full bg-[#FAF7F2] border border-[#DDD5C7] text-[#56685F] hover:text-[#18261F] hover:bg-[#EFECE3] transition shadow-2xs"
            title="Search city or locality"
            aria-label="Search city or locality"
          >
            <Search className="w-3.5 h-3.5" />
          </button>

          {/* Quick Location Select Dropdown */}
          <div className="flex items-center gap-1.5 bg-[#FAF7F2] rounded-full px-2 sm:px-2.5 py-1 sm:py-1.5 border border-[#DDD5C7] shadow-2xs">
            <MapPin className="w-3.5 h-3.5 text-[#A94A28] shrink-0" />
            <select
              data-testid="location-select"
              aria-label="Select City"
              value={cityData?.id || selectedCity || 'delhi'}
              onChange={(e) => handleQuickCityChange(e.target.value)}
              className="text-xs font-bold font-mono-code bg-transparent text-[#18261F] cursor-pointer focus:outline-none max-w-[85px] sm:max-w-[110px] truncate"
            >
              <option value="delhi">Delhi NCR</option>
              <option value="lahore">Lahore</option>
              <option value="saltlake">Salt Lake</option>
              <option value="beijing">Beijing</option>
              {cityData?.id && !['delhi', 'lahore', 'saltlake', 'beijing'].includes(cityData.id) && (
                <option value={cityData.id}>{cityData.name}</option>
              )}
            </select>
          </div>

          {/* Real-Time AQI Badge */}
          <div className="hidden 2xl:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FAF0EC] border border-[#F2D1C5] text-xs">
            <span className="text-[10px] uppercase font-bold text-[#56685F] font-mono-code">{cityData.aqiSystem || 'US AQI'}</span>
            <span className="font-extrabold font-mono-code text-[#A94A28]">{outdoorAqi != null && Number.isFinite(Number(outdoorAqi)) ? outdoorAqi : '—'}</span>
            <span className="text-[10px] font-semibold text-[#8C3D24]">({cityData.category || 'Unavailable'})</span>
          </div>

          {/* Language Switcher */}
          <div className="flex items-center gap-1 bg-[#FAF7F2] rounded-full px-2 py-1 border border-[#DDD5C7] shadow-2xs">
            <Globe className="w-3.5 h-3.5 text-[#56685F] shrink-0" />
            <select
              value={currentLang}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="text-xs font-semibold bg-transparent text-[#18261F] cursor-pointer focus:outline-none"
              aria-label="Select Language"
            >
              <option value="en">English</option>
              <option value="hi">हिंदी</option>
              <option value="pa">ਪੰਜਾਬੀ</option>
            </select>
          </div>

          {/* Simple Mode Toggle */}
          <button
            type="button"
            onClick={() => profileContext?.toggleSimpleMode()}
            className={`hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-full border text-xs font-semibold transition shadow-2xs ${
              isSimpleMode
                ? 'bg-[#EAF2ED] border-[#CCE0D4] text-[#3D6B56]'
                : 'bg-[#FAF7F2] border-[#DDD5C7] text-[#56685F] hover:bg-[#EFECE3]'
            }`}
            title="Toggle Simple / Technical Language"
            aria-label="Toggle Simple Language Mode"
          >
            <span className="text-[10px] font-mono uppercase font-bold">
              {isSimpleMode ? 'Simple' : 'Technical'}
            </span>
          </button>

          {/* Mask Guide Quick Link */}
          {openMaskGuide && (
            <button
              type="button"
              onClick={openMaskGuide}
              className="hidden 2xl:flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-[#FAF7F2] border border-[#DDD5C7] text-xs font-semibold text-[#56685F] hover:text-[#18261F] hover:bg-[#EFECE3] transition shadow-2xs"
              title="Mask Guide (N95 / FFP2)"
              aria-label="Open Mask Guide"
            >
              <span>😷</span>
              <span>{t('mask_guide.nav_link', 'Masks')}</span>
            </button>
          )}

          {/* Glossary Quick Link */}
          {openGlossary && (
            <button
              type="button"
              onClick={openGlossary}
              className="hidden 2xl:flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-[#FAF7F2] border border-[#DDD5C7] text-xs font-semibold text-[#56685F] hover:text-[#18261F] hover:bg-[#EFECE3] transition shadow-2xs"
              title="Smog Glossary"
              aria-label="Open Smog Glossary"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#56685F]" />
              <span>{t('glossary.nav_link', 'Glossary')}</span>
            </button>
          )}

          {/* Household Profile Button */}
          <button
            type="button"
            onClick={() => profileContext?.setIsOnboardingOpen(true)}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-[#FAF7F2] border border-[#DDD5C7] text-xs font-semibold text-[#18261F] hover:bg-[#EFECE3] transition shadow-2xs"
            title="Edit Household Profile"
            aria-label="Edit Household Profile"
          >
            <Users className="w-3.5 h-3.5 text-[#3D6B56]" />
            <span className="hidden xl:inline text-xs">Profile</span>
          </button>

          {/* Share Today Status Button */}
          {openShareToday && (
            <button
              type="button"
              onClick={openShareToday}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-[#18261F] text-[#FAF8F4] hover:bg-[#2C3E33] text-xs font-semibold transition shadow-2xs"
              title="Share Today's Air Status Card"
              aria-label="Share Today's Air Status Card"
            >
              <Share2 className="w-3.5 h-3.5 text-[#F3C474]" />
              <span className="hidden sm:inline">Share</span>
            </button>
          )}

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#FAF7F2] border border-[#DDD5C7] flex items-center justify-center text-[#18261F]"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4 sm:w-5 sm:h-5" /> : <Menu className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>
        </div>
      </div>

      {/* Geocoding Search Dropdown Popover */}
      {searchOpen && (
        <div className="border-t border-[#E7E0D2] bg-[#FAF8F4] px-4 py-3 shadow-md animate-in slide-in-from-top-1 duration-150">
          <div className="max-w-xl mx-auto space-y-2">
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-[#DFD8CC]">
              <Search className="w-4 h-4 text-[#56685F] shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search any global city or locality (e.g. Chandigarh, Denver, Karachi)..."
                className="w-full text-xs text-[#18261F] placeholder:text-[#A6BCB0] bg-transparent focus:outline-none font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-[#56685F] hover:text-[#18261F]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Results Dropdown */}
            {isSearching && (
              <div className="text-xs text-[#56685F] py-2 px-1 flex items-center gap-2">
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
                <span>Searching Open-Meteo geocoding database...</span>
              </div>
            )}

            {searchResults.length > 0 && (
              <div className="bg-white rounded-xl border border-[#DFD8CC] divide-y divide-[#F0EBE1] shadow-sm max-h-56 overflow-y-auto">
                {searchResults.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectLocation(item)}
                    className="w-full text-left p-2.5 hover:bg-[#FAF7F2] transition flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-[#18261F]">{item.name}</div>
                      <div className="text-[11px] text-[#56685F]">{item.region}</div>
                    </div>
                    <span className="text-[10px] font-mono text-[#3D6B56] font-semibold">Select</span>
                  </button>
                ))}
              </div>
            )}

            {searchQuery.trim().length >= 2 && !isSearching && searchResults.length === 0 && (
              <p role="status" className="text-xs text-[#56685F] py-2 px-1">
                {searchError ? 'Location search is unavailable. Try again or choose a preset city.' : `No matching locations found for “${searchQuery}”.`}
              </p>
            )}
          </div>
        </div>
      )}

      {airContext?.error && (
        <p role="status" className="bg-[#FBF5EC] text-[#79500F] px-4 py-2 text-xs text-center">{airContext.error}</p>
      )}

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#E7E0D2] bg-[#FAF8F4] px-4 pt-3 pb-5 space-y-2 animate-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-2 gap-2 pb-3 border-b border-[#E7E0D2]">
            <div className="bg-[#FAF0EC] p-2.5 rounded-xl border border-[#F2D1C5]">
              <span className="text-[10px] font-mono-code uppercase font-bold text-[#56685F] block">{cityData.aqiSystem || 'US AQI'}</span>
              <span className="text-lg font-bold text-[#A94A28] font-mono-code">{outdoorAqi != null && Number.isFinite(Number(outdoorAqi)) ? outdoorAqi : '—'}</span>
              <span className="text-[10px] text-[#8C3D24] block">{cityData.category || 'Unavailable'}</span>
            </div>
            <div className="bg-[#EAF2ED] p-2.5 rounded-xl border border-[#CCE0D4]">
              <span className="text-[10px] font-mono-code uppercase font-bold text-[#56685F] block">Lower forecast period</span>
              <span className="text-xs font-bold text-[#3D6B56] block mt-1">{cityData.cleanestWindow || 'Unavailable'}</span>
              <span className="text-[10px] text-[#53645C] block">Model estimate · check local alerts</span>
            </div>
          </div>

          <div className="space-y-1 pt-1">
            <button
              type="button"
              onClick={() => {
                profileContext?.setIsOnboardingOpen(true);
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#FAF7F2] border border-[#DDD5C7] text-[#18261F] mb-1"
            >
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#3D6B56]" />
                <span>Edit Household Profile</span>
              </span>
              <span className="text-[10px] text-[#56685F] font-mono-code">Personalize</span>
            </button>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = isItemActive(item);
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? 'bg-[#18261F] text-[#F4F2EC]'
                      : 'text-[#56685F] hover:bg-[#EAE4D8] hover:text-[#18261F]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}

            {/* Mobile Mask Guide and Glossary Links */}
            <div className="pt-2 border-t border-[#E7E0D2] flex gap-2">
              {openMaskGuide && (
                <button
                  type="button"
                  onClick={() => {
                    openMaskGuide();
                    setMobileMenuOpen(false);
                  }}
                  className="flex-1 py-2 px-3 rounded-xl bg-[#FAF7F2] border border-[#DDD5C7] text-xs font-semibold text-[#18261F] flex items-center justify-center gap-1.5"
                >
                  <span>😷</span>
                  <span>{t('mask_guide.nav_link', 'Mask Guide')}</span>
                </button>
              )}
              {openGlossary && (
                <button
                  type="button"
                  onClick={() => {
                    openGlossary();
                    setMobileMenuOpen(false);
                  }}
                  className="flex-1 py-2 px-3 rounded-xl bg-[#FAF7F2] border border-[#DDD5C7] text-xs font-semibold text-[#18261F] flex items-center justify-center gap-1.5"
                >
                  <BookOpen className="w-3.5 h-3.5 text-[#56685F]" />
                  <span>{t('glossary.nav_link', 'Glossary')}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
