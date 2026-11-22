import React, { useState } from 'react';
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
  RotateCw,
  Globe,
  BookOpen,
  Share2
} from 'lucide-react';
import AdvisoryBanner from './AdvisoryBanner';
import { useAir } from '../context/AirContext';
import { useProfile } from '../store/profile';
import useNavbarLocationSearch from './useNavbarLocationSearch';

export default function Navbar({ openMaskGuide, openGlossary, openShareToday }) {
  const { t, i18n } = useTranslation();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const {
    airData: cityData, outdoorAqi, error, isOffline, isStale, isCached, staleHours, isLoading,
    selectLocation, searchLocations, requestCurrentLocation
  } = useAir();
  const { isSimpleMode, toggleSimpleMode, updateProfile, setIsOnboardingOpen } = useProfile();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const {
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
  } = useNavbarLocationSearch({ searchLocations, selectLocation });

  const currentLang = i18n.resolvedLanguage || 'en';

  function handleLanguageChange(language) {
    void i18n.changeLanguage(language);
    updateProfile({ preferredLanguage: language });
  }

  const navItems = [
    { id: 'overview', path: '/', label: t('nav.overview', 'Overview'), icon: Home },
    { id: 'advisor', path: '/advisor', label: t('nav.advisor', 'Advisor'), icon: Sparkles },
    { id: 'routines', path: '/routines', label: t('nav.routines', 'Daily Routines'), icon: Clock },
    { id: 'hacks', path: '/hacks', label: t('nav.hacks', 'DIY Filter & Hacks'), icon: Wrench },
    { id: 'community', path: '/community', label: t('nav.community', 'Community Shield'), icon: Users },
    { id: 'impact', path: '/impact', label: t('nav.impact', 'Impact Calculator'), icon: Shield },
    { id: 'sanctuary', path: '/home', label: t('nav.sanctuary', '3D Sanctuary'), icon: Layers }
  ];

  function handleNavClick(path) {
    navigate(path);
    setMobileMenuOpen(false);
  }

  function isItemActive(item) {
    return pathname === item.path;
  }

  return (
    <header className="sticky top-0 z-50 bg-[#FAF8F4]/95 backdrop-blur-md border-b border-[#E7E0D2] shadow-xs">
      <AdvisoryBanner {...{ isOffline, isCached, isStale, staleHours, cityData }} />

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 grid grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-3 gap-y-2">
        {/* Brand & Subtitle */}
        <button
          onClick={() => handleNavClick('/')}
          className="min-w-0 flex items-center gap-2 text-left group"
        >
          <div className="w-9 h-9 shrink-0 rounded-2xl bg-[#18261F] text-[#F4F2EC] flex items-center justify-center font-serif text-base font-bold shadow-sm group-hover:scale-105 transition">
            e
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold font-serif-natural text-[#18261F] tracking-tight">
                Aura
              </span>
            </div>
            <div className="text-[10px] font-mono-code text-[#56685F] leading-none">
              Urban Air Quality Assistant
            </div>
          </div>
        </button>

        {/* Right: Location Selector, Search, Geolocation & AQI Status Badge */}
        <div className="col-span-2 row-start-2 sm:col-span-1 sm:col-start-2 sm:row-start-1 flex items-center flex-wrap justify-start gap-1.5 sm:gap-2">
          {/* Geolocation Button */}
          <button
            type="button"
            onClick={requestCurrentLocation}
            className="p-1.5 sm:p-2 rounded-full bg-[#FAF7F2] border border-[#DDD5C7] text-[#56685F] hover:text-[#18261F] hover:bg-[#EFECE3] transition shadow-2xs"
            title="Use my current location (GPS)"
            aria-label="Use current location"
          >
            <Crosshair className={`w-3.5 h-3.5 ${isLoading ? 'motion-safe:animate-spin text-[#A94A28]' : ''}`} />
          </button>

          {/* Search Trigger Button */}
          <button
            type="button"
            ref={searchButtonRef}
            onClick={() => {
              if (searchOpen) updateSearchQuery('');
              setSearchOpen(!searchOpen);
            }}
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
              value={cityData.id}
              onChange={(e) => selectLocation(e.target.value)}
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
            onClick={toggleSimpleMode}
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
            onClick={() => setIsOnboardingOpen(true)}
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

        </div>

        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="col-start-2 row-start-1 sm:col-start-3 xl:hidden w-9 h-9 rounded-xl bg-[#FAF7F2] border border-[#DDD5C7] flex items-center justify-center text-[#18261F]"
          aria-label="Toggle Navigation Menu"
          aria-expanded={mobileMenuOpen}
          aria-controls={mobileMenuOpen ? 'aura-mobile-menu' : undefined}
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Desktop Page Navigation Links */}
        <nav aria-label="Main navigation" className="hidden xl:flex col-span-3 flex-wrap items-center gap-1 bg-[#EFECE3] p-1 rounded-2xl border border-[#DFD8CC]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = isItemActive(item);
            return (
              <button
                key={item.id}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => handleNavClick(item.path)}
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

      </div>

      {/* Geocoding Search Dropdown Popover */}
      {searchOpen && (
        <div className="border-t border-[#E7E0D2] bg-[#FAF8F4] px-4 py-3 shadow-md animate-in slide-in-from-top-1 duration-150">
          <div className="max-w-xl mx-auto space-y-2">
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-[#DFD8CC]">
              <Search className="w-4 h-4 text-[#56685F] shrink-0" />
              <input
                ref={searchInputRef}
                type="search"
                aria-label="Search for a location"
                value={searchQuery}
                onChange={(event) => updateSearchQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    setSearchOpen(false);
                    searchButtonRef.current?.focus();
                  }
                }}
                placeholder="Search any global city or locality (e.g. Chandigarh, Denver, Karachi)..."
                className="w-full text-xs text-[#18261F] placeholder:text-[#A6BCB0] bg-transparent focus:outline-none font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    updateSearchQuery('');
                    searchInputRef.current?.focus();
                  }}
                  aria-label="Clear location search"
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

      {error && (
        <p role="status" className="bg-[#FBF5EC] text-[#79500F] px-4 py-2 text-xs text-center">{error}</p>
      )}

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <nav id="aura-mobile-menu" aria-label="Main navigation" className="xl:hidden max-h-[60dvh] overflow-y-auto border-t border-[#E7E0D2] bg-[#FAF8F4] px-4 pt-3 pb-5 space-y-2 animate-in slide-in-from-top-2 duration-200">
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
                setIsOnboardingOpen(true);
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
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => handleNavClick(item.path)}
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
                  }}
                  className="flex-1 py-2 px-3 rounded-xl bg-[#FAF7F2] border border-[#DDD5C7] text-xs font-semibold text-[#18261F] flex items-center justify-center gap-1.5"
                >
                  <BookOpen className="w-3.5 h-3.5 text-[#56685F]" />
                  <span>{t('glossary.nav_link', 'Glossary')}</span>
                </button>
              )}
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
