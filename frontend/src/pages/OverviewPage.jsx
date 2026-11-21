import React, { useState, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import ShareTodayModal from '../components/ShareTodayModal';
import AtmosphericSanctuaryTwin3D from '../components/LazyAtmosphericScene';
import AtmosphericFallbackSVG from '../components/AtmosphericFallbackSVG';
import {
  HOUSEHOLD_PERSONAS,
  deriveActionPlan,
  deriveVulnerabilities
} from '../data/householdPersonas';
import { useAir } from '../context/AirContext';
import { useProfile } from '../store/profile';
import { MetricSkeleton } from '../components/LoadingSkeleton';
import { SWAPS, getSwapById } from '../data/swaps';
import HowWeWorkedThisOut from '../components/HowWeWorkedThisOut';
import {
  Sparkles,
  Clock,
  Wrench,
  Users,
  Shield,
  Layers,
  Leaf,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Wind,
  Compass,
  HeartPulse,
  Sun,
  Flame,
  Home,
  Check,
  RotateCcw,
  Sliders,
  Share2
} from 'lucide-react';

export default function OverviewPage({
  cityData: propCityData,
  outdoorAqi: propOutdoorAqi,
  indoorAqi: propIndoorAqi = null,
  onNavigate,
  selectedPersonaId = 'family',
  setSelectedPersonaId,
  fanSpeed,
  setFanSpeed,
  isNightMode,
  setIsNightMode
}) {
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

  const cityData = airContext?.airData || propCityData;
  const outdoorAqi = airContext?.outdoorAqi ?? propOutdoorAqi;
  const isLoading = airContext?.isLoading || false;
  const isFallback = airContext?.isFallback || false;
  const isStale = airContext?.isStale || false;
  const staleHours = airContext?.staleHours || 0;

  const { t } = useTranslation();
  const isSimpleMode = profileContext?.isSimpleMode ?? true;

  const profile = profileContext?.profile || {};
  const isCalibrated = profile?.calibratedIndoorPm25 != null && Number.isFinite(Number(profile.calibratedIndoorPm25)) && Number(profile.calibratedIndoorPm25) >= 0 && Number(profile.calibratedIndoorPm25) <= 5000;
  const effectiveIndoorPm25 = isCalibrated ? Number(profile.calibratedIndoorPm25) : propIndoorAqi;

  const [calibrationInput, setCalibrationInput] = useState('');
  const [showCalibrationForm, setShowCalibrationForm] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Compute dynamic action plan and vulnerabilities from combinable rules
  const actionPlan = deriveActionPlan(profile, cityData);
  const vulnerabilities = deriveVulnerabilities(profile);

  // Derive suggested greener swaps matching household profile
  const getTailoredSwaps = (prof) => {
    const commuteMode = typeof prof.commute === 'object' ? prof.commute?.mode : prof.commute;
    const cookingFuel = prof.cookingFuel;
    const budget = prof.monthlyBudgetBand;
    const hasVulnerabilities =
      (prof.conditions && prof.conditions.length > 0) ||
      (prof.children && prof.children > 0) ||
      (prof.elderly && prof.elderly > 0);

    const matches = [];

    // Commute match
    if (commuteMode === 'car' || commuteMode === 'two_wheeler' || commuteMode === 'cycle') {
      const s = getSwapById('swap_metro_bus');
      if (s) matches.push(s);
    }

    // Cooking fuel match
    if (cookingFuel === 'biomass_wood' || cookingFuel === 'kerosene') {
      const s = getSwapById('swap_clean_cooking');
      if (s) matches.push(s);
    } else {
      const s = getSwapById('swap_rear_burner');
      if (s) matches.push(s);
    }

    // Bedroom / Vulnerability match
    if (hasVulnerabilities) {
      const s = getSwapById('swap_afternoon_walk');
      if (s) matches.push(s);
      const p = getSwapById('swap_bedroom_purifier');
      if (p && !matches.includes(p)) matches.push(p);
    }

    // Low cost / Budget match
    if (budget === 'low' || prof.purifierOwned === 'none') {
      const s = getSwapById('swap_closed_windows_peak');
      if (s && !matches.includes(s)) matches.push(s);
      const m = getSwapById('swap_wet_mopping');
      if (m && !matches.includes(m)) matches.push(m);
    }

    // Ensure we always have 3 distinct swaps
    for (const fallbackSwap of SWAPS) {
      if (matches.length >= 3) break;
      if (!matches.some((m) => m.id === fallbackSwap.id)) {
        matches.push(fallbackSwap);
      }
    }

    return matches.slice(0, 3);
  };

  const tailoredSwaps = getTailoredSwaps(profile);

  const currentPersona =
    HOUSEHOLD_PERSONAS.find((p) => p.id === selectedPersonaId) || HOUSEHOLD_PERSONAS[0];

  return (
    <div className="space-y-10">
      
      {/* ========================================================================= */}
      {/* 1. HERO / LANDING SECTION: INTEGRATED 3D ATMOSPHERIC TWIN AT TOP          */}
      {/* ========================================================================= */}
      <section className="bg-white rounded-3xl border border-[#E6DED6] p-6 sm:p-8 paper-shadow relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[#FAF0EC]/60 via-transparent to-transparent pointer-events-none rounded-tr-3xl"></div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch relative z-10">
          
          {/* Left Column: Atmospheric Telemetry & Direct Action */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-4">
            
            <div className="space-y-3.5">
              {/* Plain Sentence Lead: Required by Prompt 6 before numbers */}
              <div className="bg-[#FAF0EC] border-l-4 border-[#A94A28] px-4 py-2.5 rounded-r-xl">
                <p data-testid="hero-status-summary" className="text-xs sm:text-sm font-bold text-[#8C3D24]">
                  {cityData?.isLive
                    ? `${cityData.aqiSystem || 'US AQI'} is ${cityData.category || 'unavailable'} for ${cityData.name || 'your area'} (model estimate, not a street-level measurement).`
                    : `Current air-quality data is unavailable for ${cityData?.name || 'your area'}. Sample or cached readings should not guide today's decisions.`}
                </p>
              </div>

              {/* Status Pill */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono-code bg-[#FAF0EC] text-[#A94A28] border border-[#F2D1C5]">
                  <span className="w-2 h-2 rounded-full bg-[#A94A28]"></span>
                  <span>{cityData.name} • {cityData.aqiSystem || 'US AQI'}: {cityData.category || 'Unavailable'}</span>
                </span>
                {isFallback && (
                  <span className="text-[10px] font-mono-code font-bold px-2 py-0.5 rounded-full bg-[#FAF0EC] text-[#A94A28] border border-[#F2D1C5]">
                    Sample Data
                  </span>
                )}
                {isStale && (
                  <span className="text-[10px] font-mono-code font-bold px-2 py-0.5 rounded-full bg-[#FBF5EC] text-[#8C5311] border border-[#F2E0C5]">
                    Data is {staleHours}h old (cached)
                  </span>
                )}
                {cityData?.isCached && !isStale && (
                  <span className="text-[10px] font-mono-code font-bold px-2 py-0.5 rounded-full bg-[#FBF5EC] text-[#8C5311] border border-[#F2E0C5]">
                    Cached Data
                  </span>
                )}
              </div>

              {/* Headline */}
              <h1 className="text-3xl sm:text-4xl lg:text-[40px] font-extrabold font-serif-natural text-[#18261F] tracking-tight leading-[1.15]">
                {isSimpleMode
                  ? 'Use current air-quality information to plan outdoor time and reduce particles indoors.'
                  : 'Plan for urban air pollution with current data and practical household choices'}
              </h1>

              {/* Subtitle */}
              <p className="text-xs sm:text-sm text-[#56685F] leading-relaxed">
                {cityData?.isLive
                  ? `Air-quality values are Open-Meteo model estimates for ${cityData.name}; this location forecast is not a street-level sensor reading. ${cityData.meteorologyNotes || ''}`
                  : `Live data is unavailable for ${cityData?.name || 'this location'}. Wait for a current reading or check an official local advisory before making time-sensitive decisions.`}
              </p>

              {/* Lower forecast period callout */}
              <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#DFD6CB] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#EAF2ED] text-[#3D6B56] flex items-center justify-center font-bold text-lg shrink-0">
                    <Sun className="w-5 h-5 text-[#3D6B56]" />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono-code uppercase font-bold text-[#56685F]">
                      Lower-pollution forecast period
                    </div>
                    <div className="text-sm sm:text-base font-bold text-[#18261F] font-serif-natural">
                      {cityData.cleanestWindow || 'No lower-pollution period available'}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onNavigate('routines')}
                  className="bg-[#18261F] text-[#FAF8F4] px-3.5 py-2 rounded-xl text-xs font-bold hover:bg-[#2C3E33] transition flex items-center gap-1.5 shrink-0"
                >
                  <span>View Schedule</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Quick 3-Key Telemetry Metrics */}
            {isLoading ? (
              <div className="grid grid-cols-3 gap-3 pt-2">
                <MetricSkeleton />
                <MetricSkeleton />
                <MetricSkeleton />
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="bg-[#FAF7F2] p-3.5 rounded-2xl border border-[#DFD6CB]">
                  <span className="text-[9px] font-mono-code uppercase font-bold text-[#56685F] block">
                    {t('hero.outdoor_aqi', 'Outdoor Air')}
                  </span>
                  <div className="text-2xl font-extrabold font-mono-code text-[#A94A28] mt-0.5">
                    {outdoorAqi ?? '—'}
                  </div>
                  <span className="text-[10px] font-semibold text-[#8C3D24] block">
                    {cityData.category}
                  </span>
                </div>

                <div className="bg-[#FAF7F2] p-3.5 rounded-2xl border border-[#DFD6CB] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-mono-code uppercase font-bold text-[#56685F] block">
                        Indoor PM2.5 monitor reading
                      </span>
                      {isCalibrated && (
                        <span className="text-[9px] font-mono-code font-bold px-1.5 py-0.5 rounded bg-[#EAF2ED] text-[#3D6B56]">
                          Saved by you
                        </span>
                      )}
                    </div>
                    <div className="text-2xl font-extrabold font-mono-code text-[#3D6B56] mt-0.5 flex items-baseline gap-1">
                      {effectiveIndoorPm25 == null ? (
                        <span className="text-base text-[#56685F]">Not measured</span>
                      ) : (
                        <><span>{effectiveIndoorPm25}</span><span className="text-[11px] font-normal text-[#56685F]">µg/m³</span></>
                      )}
                    </div>
                  </div>

                  <div className="mt-1 pt-1 border-t border-[#DFD6CB]">
                    {showCalibrationForm ? (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (calibrationInput.trim()) {
                            profileContext?.calibrateIndoor(calibrationInput);
                            setShowCalibrationForm(false);
                            setCalibrationInput('');
                          }
                        }}
                        className="flex items-center gap-1 mt-1"
                      >
                        <input
                          type="number"
                          min="0"
                          max="5000"
                          step="0.1"
                          placeholder="e.g. 24"
                          value={calibrationInput}
                          onChange={(e) => setCalibrationInput(e.target.value)}
                          className="w-16 px-1.5 py-0.5 text-xs font-mono-code border border-[#DDD5C7] rounded bg-white text-[#18261F] focus:outline-none"
                          autoFocus
                        />
                        <button
                          type="submit"
                          className="px-2 py-0.5 text-[10px] font-bold bg-[#18261F] text-white rounded hover:bg-[#2C3E33]"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowCalibrationForm(false)}
                          className="text-[10px] text-[#56685F] hover:text-[#18261F] px-1"
                        >
                          ✕
                        </button>
                      </form>
                    ) : (
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setShowCalibrationForm(true)}
                          className="text-[10px] text-[#3D6B56] hover:underline font-semibold"
                        >
                          {isCalibrated ? 'Edit saved reading' : 'Enter a monitor reading'}
                        </button>
                        {isCalibrated && (
                          <button
                            type="button"
                            onClick={() => profileContext?.resetCalibration()}
                            className="text-[9px] text-[#56685F] hover:text-[#A94A28]"
                            title="Clear saved monitor reading"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-[#FAF7F2] p-3.5 rounded-2xl border border-[#DFD6CB]">
                  <span className="text-[9px] font-mono-code uppercase font-bold text-[#56685F] block">
                    Wind Velocity
                  </span>
                  <div className="text-2xl font-extrabold font-mono-code text-[#18261F] mt-0.5">
                    {cityData.windSpeed || 'Unavailable'}
                  </div>
                  <span className="text-[10px] text-[#8C5311] font-semibold block">
                    {cityData.isLive ? 'Open-Meteo weather estimate' : 'No current weather data'}
                  </span>
                </div>
              </div>
            )}

          </div>

          {/* Right Column: 3D Atmospheric Inversion & Sanctuary Twin */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between text-xs font-mono-code font-bold text-[#56685F] px-1">
              <span className="flex items-center gap-1.5 truncate">
                <span className="w-2 h-2 rounded-full bg-[#3D6B56] shrink-0"></span>
                <span className="truncate">{isSimpleMode ? 'Air-quality illustration' : '3D air-quality illustration · Drag to orbit'}</span>
              </span>
              <button
                onClick={() => onNavigate('sanctuary')}
                className="text-[11px] text-[#18261F] hover:underline flex items-center gap-1 font-semibold shrink-0 whitespace-nowrap ml-2"
              >
                <span>Full Simulation</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* The Professional Three.js Atmospheric Twin */}
            <div className="flex-1 w-full rounded-2xl overflow-hidden border border-[#DDD5C7] shadow-inner bg-[#0a0c10] min-h-[380px] lg:min-h-[440px] flex flex-col">
              {isSimpleMode ? (
                <AtmosphericFallbackSVG aqi={outdoorAqi} cityData={cityData} purifierOn={fanSpeed !== 'off'} />
              ) : (
              <Suspense
                fallback={
                  <div className="w-full h-full min-h-[380px] bg-[#0A0C10] flex flex-col items-center justify-center p-6 text-center text-[#A6BCB0] animate-pulse">
                    <div className="w-10 h-10 rounded-2xl bg-[#1A202C] mb-3 flex items-center justify-center text-[#56685F]">
                      <Layers className="w-5 h-5 animate-spin" />
                    </div>
                    <div className="text-xs font-mono font-bold text-[#E5E7EB]">
                      Loading 3D illustration...
                    </div>
                    <div className="text-[11px] font-mono text-[#56685F] mt-1">
                      Overview is ready while 3D initializes
                    </div>
                  </div>
                }
              >
                <AtmosphericSanctuaryTwin3D
                  outdoorAqi={outdoorAqi}
                  fanSpeed={fanSpeed}
                  setFanSpeed={setFanSpeed}
                  isNightMode={isNightMode}
                  setIsNightMode={setIsNightMode}
                  cityData={cityData}
                  height="100%"
                  showHeader={false}
                  showPanel={false}
                  isSimpleMode={isSimpleMode}
                />
              </Suspense>
              )}
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. TODAY'S 3-POINT ACTION CHECKLIST                                       */}
      {/* ========================================================================= */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-serif-natural text-[#18261F]">
              {t('actions.plan_heading', 'Immediate 3-Point Action Plan for Today')}
            </h2>
            <p className="text-xs text-[#56685F]">
              {t('actions.plan_subtitle', 'Practical suggestions based on your household profile and available air-quality data')}
            </p>
          </div>
          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#18261F] text-[#FAF8F4] hover:bg-[#2C3E33] text-xs font-semibold transition shadow-2xs"
              title="Share Today's Air Status Card"
            >
              <Share2 className="w-3.5 h-3.5 text-[#F3C474]" />
              <span>Share Status</span>
            </button>
            <button
              type="button"
              onClick={() => profileContext?.setIsOnboardingOpen(true)}
              className="text-xs text-[#3D6B56] hover:underline font-semibold flex items-center gap-1"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Customize Household</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {actionPlan.map((act) => (
            <div
              key={act.step}
              data-testid={`action-step-${act.step}`}
              className="bg-white rounded-3xl border border-[#E6DED6] p-6 paper-shadow flex flex-col justify-between space-y-4 h-full"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono-code font-bold text-xs ${act.numClass}`}
                  >
                    {act.step}
                  </span>
                  <span
                    className={`text-[10px] font-mono-code font-bold px-2 py-0.5 rounded-full ${act.badgeClass}`}
                  >
                    {act.phase}
                  </span>
                </div>
                <h3
                  data-testid={`action-step-title-${act.step}`}
                  className="text-base font-bold font-serif-natural text-[#18261F]"
                >
                  {act.title}
                </h3>
                <p className="text-xs text-[#56685F] leading-relaxed">
                  {act.description}
                </p>
              </div>
              <div className="mt-auto pt-3 border-t border-[#E6DED6] text-[11px] text-[#3D6B56] font-semibold">
                {act.impact}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. PERSONALIZED HOUSEHOLD SITUATION SELECTOR                               */}
      {/* ========================================================================= */}
      <section className="bg-white rounded-3xl border border-[#E6DED6] p-6 sm:p-8 paper-shadow space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#E6DED6]">
          <div>
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-[#3D6B56]" />
              <h2 className="text-xl font-bold font-serif-natural text-[#18261F]">
                Tailored Guidance for Your Household
              </h2>
            </div>
            <p className="text-xs text-[#56685F] mt-0.5">
              Click a preset to quickly apply, or customize full profile details
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => profileContext?.setIsOnboardingOpen(true)}
              className="px-3 py-1 text-xs font-semibold rounded-full bg-[#18261F] text-[#FAF7F2] hover:bg-[#2C3E33] transition"
            >
              Edit Full Profile
            </button>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#FAF7F2] text-[#18261F] border border-[#DDD5C7] font-mono-code">
              5 Presets
            </span>
          </div>
        </div>

        {/* Persona Selectors */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {HOUSEHOLD_PERSONAS.map((p) => {
            const isSelected = selectedPersonaId === p.id;
            return (
              <button
                key={p.id}
                onClick={() => {
                  profileContext?.applyPreset(p.id);
                  if (setSelectedPersonaId) setSelectedPersonaId(p.id);
                }}
                className={`p-3.5 text-left rounded-2xl transition border flex flex-col justify-between h-full ${
                  isSelected
                    ? 'bg-[#FAF7F2] border-2 border-[#18261F] shadow-sm'
                    : 'bg-white border-[#E6DED6] hover:bg-[#FAF7F2]'
                }`}
              >
                <div>
                  <div className="text-xl">{p.icon}</div>
                  <div className="text-xs font-bold text-[#18261F] mt-2 line-clamp-2 leading-snug">
                    {p.title}
                  </div>
                </div>
                <div className="text-[10px] text-[#56685F] mt-1.5 line-clamp-2 leading-relaxed">
                  {p.subtitle}
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Persona Detail Box */}
        <div className="bg-[#FAF7F2] p-5 rounded-2xl border border-[#DFD6CB] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-lg">{currentPersona.icon}</span>
              <span className="font-bold text-sm text-[#18261F] font-serif-natural">
                {currentPersona.title}
              </span>
              <span className="text-[10px] font-mono-code font-bold px-2 py-0.5 rounded-full bg-[#EAF2ED] text-[#3D6B56]">
                {profile.adults || 2} adults, {profile.children || 0} kids, {profile.elderly || 0} seniors
              </span>
              <span className="text-[10px] font-mono-code font-bold px-2 py-0.5 rounded-full bg-[#FAF0EC] text-[#A94A28]">
                Commute: {typeof profile.commute === 'object' ? profile.commute?.mode || 'two-wheeler' : profile.commute || 'two-wheeler'}
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-semibold text-[#18261F] block">
                Targeted Household Vulnerabilities:
              </span>
              <ul className="text-xs text-[#56685F] space-y-1 list-disc list-inside">
                {vulnerabilities.slice(0, 3).map((v, i) => (
                  <li key={i}>{v}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 shrink-0 self-start md:self-center">
            <button
              onClick={() => profileContext?.setIsOnboardingOpen(true)}
              className="bg-white border border-[#DDD5C7] text-[#18261F] px-3.5 py-2 rounded-xl text-xs font-semibold hover:bg-[#FAF7F2] transition flex items-center gap-1.5"
            >
              <Sliders className="w-3.5 h-3.5 text-[#3D6B56]" />
              <span>Fine-Tune</span>
            </button>
            <button
              onClick={() => onNavigate('advisor')}
              className="bg-[#18261F] text-[#FAF8F4] px-4 py-2 rounded-xl text-xs font-semibold hover:bg-[#2C3E33] transition flex items-center gap-2"
            >
              <span>Ask Advisor</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* GREENER SWAPS SECTION (Matching Household Profile)                        */}
      {/* ========================================================================= */}
      <section className="bg-white rounded-3xl border border-[#E6DED6] p-6 sm:p-8 paper-shadow space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E6DED6]">
          <div>
            <div className="flex items-center gap-2">
              <Leaf className="w-5 h-5 text-[#3D6B56]" />
              <h2 className="text-xl font-bold font-serif-natural text-[#18261F]">
                Greener Swaps for Your Household
              </h2>
            </div>
            <p className="text-xs text-[#56685F] mt-0.5">
              Everyday exposure-reduction choices tailored to your commute, cooking fuel, and household budget
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('impact')}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#3D6B56] text-white hover:bg-[#2F5443] transition flex items-center gap-1.5 self-start sm:self-auto shrink-0 shadow-sm"
          >
            <span>Open Choices Ledger</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Tailored Swaps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tailoredSwaps.map((swap) => {
            return (
              <div
                key={swap.id}
                className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#DFD6CB] flex flex-col justify-between space-y-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white text-[#56685F] border border-[#DFD6CB]">
                      {swap.category}
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#EAF2ED] text-[#3D6B56]">
                      {swap.costBand}
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-[#18261F] leading-snug">
                    {swap.label}
                  </h3>
                  <p className="text-[11px] text-[#56685F] leading-relaxed">
                    <span>{swap.impact.value}</span>
                  </p>
                </div>

                <div className="pt-2 border-t border-[#DFD6CB]/60 flex items-center justify-between text-[11px]">
                  <span className="text-[10px] font-mono text-[#56685F]">
                    {swap.timeEffect}
                  </span>
                  <HowWeWorkedThisOut
                    title={swap.label}
                    formula="No personal exposure or emissions total is calculated."
                    assumptions={swap.impact.assumptions}
                    confidence={swap.impact.confidence}
                    source={swap.impact.source}
                    buttonLabel="How we worked this out"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. COMPLETE TOOLS & CAPABILITIES NAVIGATION GRID                          */}
      {/* ========================================================================= */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-serif-natural text-[#18261F]">
            Explore Assistant Capabilities
          </h2>
          <p className="text-xs text-[#56685F]">
            Every tool is designed to provide actionable answers and clear quantification
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Card 1: AI Advisor */}
          <button
            onClick={() => onNavigate('advisor')}
            className="p-6 rounded-3xl bg-white border border-[#E6DED6] paper-shadow text-left hover:border-[#18261F] transition group flex flex-col justify-between h-full space-y-3"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-[#FBF5EC] text-[#8C5311] flex items-center justify-center font-bold">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold font-serif-natural text-[#18261F] group-hover:text-[#3D6B56] transition flex items-center justify-between">
                <span>GenAI Smog Advisor</span>
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition -translate-x-2 group-hover:translate-x-0" />
              </h3>
              <p className="text-xs text-[#56685F] leading-relaxed">
                Ask about daily routines, indoor particle sources, filtration choices, or how to interpret this location forecast.
              </p>
            </div>
          </button>

          {/* Card 2: Daily Routines */}
          <button
            onClick={() => onNavigate('routines')}
            className="p-6 rounded-3xl bg-white border border-[#E6DED6] paper-shadow text-left hover:border-[#18261F] transition group flex flex-col justify-between h-full space-y-3"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-[#EAF2ED] text-[#3D6B56] flex items-center justify-center font-bold">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold font-serif-natural text-[#18261F] group-hover:text-[#3D6B56] transition flex items-center justify-between">
                <span>Hourly Air-Quality Forecast</span>
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition -translate-x-2 group-hover:translate-x-0" />
              </h3>
              <p className="text-xs text-[#56685F] leading-relaxed">
                Compare the available hourly pollution forecast. It does not measure local street conditions or determine a safe time to go out.
              </p>
            </div>
          </button>

          {/* Card 3: DIY Filter Hacks */}
          <button
            onClick={() => onNavigate('hacks')}
            className="p-6 rounded-3xl bg-white border border-[#E6DED6] paper-shadow text-left hover:border-[#18261F] transition group flex flex-col justify-between h-full space-y-3"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-[#FAF0EC] text-[#A94A28] flex items-center justify-center font-bold">
                <Wrench className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold font-serif-natural text-[#18261F] group-hover:text-[#3D6B56] transition flex items-center justify-between">
                <span>Indoor Filtration and Source Control</span>
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition -translate-x-2 group-hover:translate-x-0" />
              </h3>
              <p className="text-xs text-[#56685F] leading-relaxed">
                Practical steps for choosing filtration, reducing indoor particle sources, and understanding equipment limits.
              </p>
            </div>
          </button>

          {/* Card 4: Community Shield */}
          <button
            onClick={() => onNavigate('community')}
            className="p-6 rounded-3xl bg-white border border-[#E6DED6] paper-shadow text-left hover:border-[#18261F] transition group flex flex-col justify-between h-full space-y-3"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-[#FAF7F2] text-[#18261F] flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold font-serif-natural text-[#18261F] group-hover:text-[#3D6B56] transition flex items-center justify-between">
                <span>Community Shield</span>
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition -translate-x-2 group-hover:translate-x-0" />
              </h3>
              <p className="text-xs text-[#56685F] leading-relaxed">
                Zero-burn leaf composting circles, electric radiant heat replacing coal braziers, and school carpool pods.
              </p>
            </div>
          </button>

          {/* Card 5: Direct Impact Calculator */}
          <button
            onClick={() => onNavigate('impact')}
            className="p-6 rounded-3xl bg-white border border-[#E6DED6] paper-shadow text-left hover:border-[#18261F] transition group flex flex-col justify-between h-full space-y-3"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-[#EAF2ED] text-[#3D6B56] flex items-center justify-center font-bold">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold font-serif-natural text-[#18261F] group-hover:text-[#3D6B56] transition flex items-center justify-between">
                <span>Direct Impact Ledger</span>
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition -translate-x-2 group-hover:translate-x-0" />
              </h3>
              <p className="text-xs text-[#56685F] leading-relaxed">
                Track household choices and review their likely environmental effects, assumptions, and evidence limits.
              </p>
            </div>
          </button>

          {/* Card 6: 3D Sanctuary Twin */}
          <button
            onClick={() => onNavigate('sanctuary')}
            className="p-6 rounded-3xl bg-white border border-[#E6DED6] paper-shadow text-left hover:border-[#18261F] transition group flex flex-col justify-between h-full space-y-3"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-[#FAF7F2] text-[#688A72] flex items-center justify-center font-bold">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold font-serif-natural text-[#18261F] group-hover:text-[#3D6B56] transition flex items-center justify-between">
                <span>3D Atmospheric Twin</span>
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition -translate-x-2 group-hover:translate-x-0" />
              </h3>
              <p className="text-xs text-[#56685F] leading-relaxed">
                Interactive 3D architectural cutaway featuring particle smoke filtration, laminar flow streams, and day/night toggles.
              </p>
            </div>
          </button>
        </div>
      </section>

      {/* Share Today Modal */}
      <ShareTodayModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        cityData={cityData}
        outdoorAqi={outdoorAqi}
        actionPlan={actionPlan}
      />

    </div>
  );
}
