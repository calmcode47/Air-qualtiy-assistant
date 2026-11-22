import React, { Suspense } from 'react';
import { Volume2, VolumeX, Moon, Layers } from 'lucide-react';
import { toggleAcousticChime } from '../utils/audioChime';
import { useProfile } from '../store/profile';
import { useAir } from '../context/AirContext';

import AtmosphericSanctuaryTwin3D from '../components/LazyAtmosphericScene';

export default function SanctuaryPage({
  fanSpeed,
  setFanSpeed,
  isNightMode,
  setIsNightMode,
  isSoundActive,
  setIsSoundActive
}) {
  const { airData: cityData, outdoorAqi } = useAir();
  const { isSimpleMode } = useProfile();
  const handleToggleSound = () => {
    const next = !isSoundActive;
    setIsSoundActive(next);
    toggleAcousticChime(next);
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="bg-white rounded-3xl border border-[#E6DED6] p-6 sm:p-8 paper-shadow">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🌿</span>
              <h1 className="text-2xl sm:text-3xl font-extrabold font-serif-natural text-[#18261F]">
                3D Atmospheric Sanctuary &amp; Simulation Twin
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-[#56685F] mt-1 max-w-2xl">
              Interactive illustration of outdoor pollution sources and a home air-filter concept. It is not a physical forecast or an indoor-air measurement. Drag to orbit, scroll to zoom.
            </p>
          </div>

          <span className="text-xs text-[#56685F] bg-[#FAF7F2] px-3 py-2 rounded-xl border border-[#DFD6CB]">Illustration only · no indoor reading or filter performance estimate</span>
        </div>
      </div>

      {/* 3D Canvas Box */}
      <div className="bg-white rounded-3xl border border-[#E6DED6] p-4 sm:p-6 paper-shadow space-y-4">
        <div className="rounded-2xl overflow-hidden border border-[#DDD5C7] shadow-inner bg-[#f3f3f1]">
          <Suspense
            fallback={
              <div role="status" className="w-full h-[560px] bg-[#f3f3f1] flex flex-col items-center justify-center gap-3 p-6 text-center text-[#18261F]">
                <Layers aria-hidden="true" className="w-6 h-6 motion-safe:animate-spin" />
                <p className="text-sm font-bold">Loading interactive illustration…</p>
              </div>
            }
          >
            <AtmosphericSanctuaryTwin3D
              key={cityData.id}
              isSimpleMode={isSimpleMode}
              outdoorAqi={outdoorAqi}
              fanSpeed={fanSpeed}
              setFanSpeed={setFanSpeed}
              isNightMode={isNightMode}
              cityData={cityData}
              height="560px"
            />
          </Suspense>
        </div>

        {/* Tactile Control Panel Beneath Canvas */}
        <div className="bg-[#FAF7F2] p-4 sm:p-6 rounded-2xl border border-[#DFD6CB] flex flex-wrap items-center justify-between gap-4">
          {/* Fan Controls */}
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-bold font-mono-code uppercase tracking-wider text-[#56685F]">
              Airflow Fan Speed:
            </span>
            {['off', 'low', 'med', 'high'].map((spd) => (
              <button
                key={spd}
                aria-pressed={fanSpeed === spd}
                onClick={() => setFanSpeed(spd)}
                className={`px-3 py-1.5 rounded-xl font-mono-code font-bold text-xs uppercase transition ${
                  fanSpeed === spd
                    ? 'bg-[#18261F] text-white shadow-xs'
                    : 'bg-white text-[#56685F] border border-[#DDD5C7] hover:bg-[#EAE4D8]'
                }`}
              >
                {spd}
              </button>
            ))}
          </div>

          {/* Interactive Feature Toggles */}
          <div className="flex items-center gap-3">
            {/* Scene lighting toggle */}
            <button
              aria-pressed={isNightMode}
              onClick={() => setIsNightMode(!isNightMode)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-mono-code font-bold text-xs transition border ${
                isNightMode
                  ? 'bg-[#18261F] text-[#F3C474] border-[#18261F]'
                  : 'bg-white text-[#56685F] border-[#DDD5C7] hover:bg-[#EAE4D8]'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span>{isNightMode ? 'Night illustration' : 'Day illustration'}</span>
            </button>

            {/* Acoustic chime toggle (off by default, explicit click, visible mute control) */}
            <button
              onClick={handleToggleSound}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-mono-code font-bold text-xs transition border ${
                isSoundActive
                  ? 'bg-[#18261F] text-[#F3C474] border-[#18261F]'
                  : 'bg-white text-[#56685F] border-[#DDD5C7] hover:bg-[#EAE4D8]'
              }`}
              title={isSoundActive ? 'Mute acoustic chime' : 'Start acoustic chime'}
              aria-label={isSoundActive ? 'Mute acoustic chime' : 'Start acoustic chime'}
            >
              {isSoundActive ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-[#F3C474]" />
                  <span>Audio Chime: On (Mute)</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-[#56685F]" />
                  <span>Audio Chime: Muted</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Environmental Explanation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-xs text-[#56685F]">
          <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#DFD6CB]">
            <strong className="text-[#18261F] block mb-1">Atmospheric layer:</strong>
            The boundary is a visual cue for a possible inversion layer. Its position is illustrative and does not represent a measured height.
          </div>
          <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#DFD6CB]">
            <strong className="text-[#18261F] block mb-1">Filter concept:</strong>
            Mechanical filtration can reduce particles when the cleaner is suitable for the room, operated, and maintained. This illustration does not estimate results.
          </div>
          <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#DFD6CB]">
            <strong className="text-[#18261F] block mb-1">Building Weather Envelope:</strong>
            Avoid indoor smoke sources and use kitchen exhaust that vents outdoors where available. Do not block required ventilation or combustion-air openings.
          </div>
        </div>
      </div>
    </div>
  );
}
