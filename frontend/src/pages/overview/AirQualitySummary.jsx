import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Sun } from 'lucide-react';
import { useAir } from '../../context/AirContext';
import { useProfile } from '../../store/profile';
import { MetricSkeleton } from '../../components/LoadingSkeleton';

export default function AirQualitySummary({ onNavigate }) {
  const { airData: cityData, outdoorAqi, isLoading, isStale, staleHours } = useAir();
  const { profile, isSimpleMode, calibrateIndoor, resetCalibration } = useProfile();
  const { t } = useTranslation();
  const effectiveIndoorPm25 = profile.calibratedIndoorPm25;
  const isCalibrated = effectiveIndoorPm25 !== null;
  const editButton = useRef(null);
  const [calibrationInput, setCalibrationInput] = useState('');
  const [showCalibrationForm, setShowCalibrationForm] = useState(false);

  function openCalibrationForm() {
    setCalibrationInput(effectiveIndoorPm25 === null ? '' : String(effectiveIndoorPm25));
    setShowCalibrationForm(true);
  }

  function closeCalibrationForm() {
    setShowCalibrationForm(false);
    requestAnimationFrame(() => editButton.current?.focus());
  }

  return (
    <section className="bg-white rounded-3xl border border-[#E6DED6] p-6 sm:p-8 paper-shadow relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[#FAF0EC]/60 via-transparent to-transparent pointer-events-none rounded-tr-3xl"></div>

      <div className="relative z-10 space-y-4">

        <div className="space-y-3.5">
          <div className="bg-[#FAF0EC] border-l-4 border-[#A94A28] px-4 py-2.5 rounded-r-xl">
            <p data-testid="hero-status-summary" className="text-xs sm:text-sm font-bold text-[#8C3D24]">
              {cityData?.isLive
                ? `${cityData.aqiSystem || 'US AQI'} is ${cityData.category || 'unavailable'} for ${cityData.name || 'your area'} (model estimate, not a street-level measurement).`
                : `Current air-quality data is unavailable for ${cityData?.name || 'your area'}. Check an official local advisory for time-sensitive decisions.`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono-code bg-[#FAF0EC] text-[#A94A28] border border-[#F2D1C5]">
              <span className="w-2 h-2 rounded-full bg-[#A94A28]"></span>
              <span>{cityData.name} • {cityData.aqiSystem || 'US AQI'}: {cityData.category || 'Unavailable'}</span>
            </span>
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

          <h1 className="text-3xl sm:text-4xl lg:text-[40px] font-extrabold font-serif-natural text-[#18261F] tracking-tight leading-[1.15]">
            {isSimpleMode
              ? 'Use current air-quality information to plan outdoor time and reduce particles indoors.'
              : 'Plan for urban air pollution with current data and practical household choices'}
          </h1>

          <p className="text-xs sm:text-sm text-[#56685F] leading-relaxed">
            {cityData?.isLive
              ? `Air-quality values are Open-Meteo model estimates for ${cityData.name}; this location forecast is not a street-level sensor reading. ${cityData.meteorologyNotes || ''}`
              : `Live data is unavailable for ${cityData?.name || 'this location'}. Wait for a current reading or check an official local advisory before making time-sensitive decisions.`}
          </p>

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

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <MetricSkeleton />
            <MetricSkeleton />
            <MetricSkeleton />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
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
                <div className="flex flex-wrap items-center justify-between gap-1">
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
                    onSubmit={(event) => {
                      event.preventDefault();
                      calibrateIndoor(calibrationInput);
                      closeCalibrationForm();
                    }}
                    className="flex flex-wrap items-center gap-1 mt-1"
                  >
                    <input
                      aria-label="Indoor PM2.5 in micrograms per cubic meter"
                      required
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
                      aria-label="Cancel monitor reading"
                      onClick={closeCalibrationForm}
                      className="text-[10px] text-[#56685F] hover:text-[#18261F] px-1"
                    >
                      ✕
                    </button>
                  </form>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <button
                      type="button"
                      ref={editButton}
                      onClick={openCalibrationForm}
                      className="text-[10px] text-[#3D6B56] hover:underline font-semibold"
                    >
                      {isCalibrated ? 'Edit saved reading' : 'Enter a monitor reading'}
                    </button>
                    {isCalibrated && (
                      <button
                        type="button"
                        onClick={resetCalibration}
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
                {cityData.windSpeed && cityData.isLive ? 'Open-Meteo weather estimate' : 'No current weather data'}
              </span>
            </div>
          </div>
        )}


      </div>
    </section>
  );
}
