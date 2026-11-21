import React from 'react';
import { Sparkles, ShieldCheck } from 'lucide-react';

export default function AtmosphericFallbackSVG({
  aqi = null,
  purifierOn = true,
  cityData = {},
  isSimpleMode = true,
  onTry3D,
  webGlFailed = false
}) {
  const currentAqi = aqi ?? "Unavailable";
  const cityName = cityData?.name || 'Local Area';

  // Labels based on simple mode
  const lidLabel = isSimpleMode ? 'POSSIBLE INVERSION LAYER' : 'THERMAL INVERSION SCHEMATIC';
  const lidSub = 'illustrative position';
  const homeLabel = isSimpleMode ? 'HOME FILTER CONCEPT' : 'HOME FILTER SCHEMATIC';
  const homeSub = purifierOn ? 'FILTER ON · ILLUSTRATION' : 'FILTER OFF';
  const indLabel = isSimpleMode ? 'FACTORY SMOKE' : 'STACK EMISSIONS';
  const burnLabel = isSimpleMode ? 'CROP RESIDUE BURNING' : 'BIOMASS SMOKE';

  const lidY = 175;

  return (
    <div
      className="relative w-full h-full min-h-[380px] bg-[#0A0C10] text-[#F4F2EC] rounded-2xl overflow-hidden flex flex-col justify-between p-4 border border-[#2D333F]"
      role="region"
      aria-label="Illustrative air-pollution and home-filter diagram"
    >
      {/* Screen Reader Alternative */}
      <div className="sr-only" aria-live="polite">
        Illustrative diagram for {cityName}. The AQI label shows the available outdoor estimate. The layer height and filter effect are not measured, and indoor PM2.5 is not estimated.
      </div>

      {/* Top Banner: Mode Indicator & Toggle */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 text-xs font-mono-code">
        <div className="flex items-center gap-2 bg-[#141822]/85 px-3 py-1.5 rounded-xl border border-[#232A38]">
          <span className="w-2 h-2 rounded-full bg-[#D9822B]"></span>
          <span className="text-[#D8E4DC] text-[11px] font-bold">
            {webGlFailed ? '2D Fallback Mode (WebGL Unavailable)' : 'Low-Power 2D Diagram'}
          </span>
        </div>

        {onTry3D && (
          <button
            type="button"
            onClick={onTry3D}
            className="flex items-center gap-1.5 bg-[#1F2937] hover:bg-[#374151] text-[#E5E7EB] px-3 py-1.5 rounded-xl text-[11px] font-bold transition border border-[#4B5563]"
            title="Switch to interactive 3D WebGL diorama"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#F3C474]" />
            <span>Try 3D Scene</span>
          </button>
        )}
      </div>

      {/* SVG Diagram Canvas */}
      <div className="relative flex-1 w-full my-2 flex items-center justify-center">
        <svg
          viewBox="0 0 760 380"
          className="w-full h-full max-h-[360px] select-none"
          aria-hidden="true"
        >
          <defs>
            {/* Sky Background Gradient */}
            <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#080A0E" />
              <stop offset="60%" stopColor="#141822" />
              <stop offset="100%" stopColor="#1C1814" />
            </linearGradient>

            {/* Trapped Smog Haze Gradient */}
            <linearGradient id="smogHaze" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#D9822B" stopOpacity="0.28" />
              <stop offset="50%" stopColor="#B5473A" stopOpacity="0.36" />
              <stop offset="100%" stopColor="#7A2E3A" stopOpacity="0.45" />
            </linearGradient>

            {/* Inversion Lid Ceiling Gradient */}
            <linearGradient id="lidGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#D6B33F" stopOpacity="0.1" />
              <stop offset="50%" stopColor="#D6B33F" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#D6B33F" stopOpacity="0.1" />
            </linearGradient>

            {/* Clean Indoor Air Glow */}
            <radialGradient id="cleanGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#6F9A62" stopOpacity="0.55" />
              <stop offset="70%" stopColor="#6F9A62" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#6F9A62" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Background Sky */}
          <rect x="0" y="0" width="760" height="380" fill="url(#skyGrad)" rx="12" />

          {/* Trapped Smog Layer Under Inversion Lid */}
          <rect
            x="30"
            y={lidY}
            width="700"
            height={320 - lidY}
            fill="url(#smogHaze)"
            rx="6"
          />

          {/* Upper Clean Atmosphere Notes above Lid */}
          <text
            x="380"
            y={Math.max(35, lidY - 18)}
            textAnchor="middle"
            fill="#56685F"
            fontSize="10"
            fontFamily="monospace"
            letterSpacing="1"
          >
            ILLUSTRATIVE ATMOSPHERIC LAYER
          </text>

          {/* Inversion Lid Ceiling Line */}
          <line
            x1="30"
            y1={lidY}
            x2="730"
            y2={lidY}
            stroke="url(#lidGrad)"
            strokeWidth="3"
            strokeDasharray="6 4"
          />

          {/* Ground Slab */}
          <rect x="30" y="320" width="700" height="40" fill="#151922" rx="4" />
          <line x1="30" y1="320" x2="730" y2="320" stroke="#2C3240" strokeWidth="2" />

          {/* Left: Industrial Factory & Plume */}
          <g transform="translate(90, 220)">
            {/* Factory Building */}
            <rect x="0" y="45" width="60" height="55" fill="#2D3442" rx="2" />
            <rect x="15" y="10" width="14" height="40" fill="#3D4556" />
            <rect x="38" y="22" width="12" height="28" fill="#3D4556" />
            {/* Plume curving under lid */}
            <path
              d={`M 22 10 Q 30 -30 70 ${Math.max(15, lidY - 215)}`}
              fill="none"
              stroke="#8B909A"
              strokeWidth="10"
              strokeLinecap="round"
              opacity="0.35"
            />
          </g>

          {/* Right: Crop Residue Burning */}
          <g transform="translate(610, 290)">
            <ellipse cx="25" cy="28" rx="35" ry="8" fill="#A94A28" opacity="0.6" />
            <circle cx="20" cy="24" r="5" fill="#D6B33F" opacity="0.8" />
            <circle cx="32" cy="22" r="4" fill="#D9822B" opacity="0.8" />
            {/* Smoke rising toward lid */}
            <path
              d={`M 25 15 Q 10 -40 -30 ${Math.max(10, lidY - 280)}`}
              fill="none"
              stroke="#B5473A"
              strokeWidth="12"
              strokeLinecap="round"
              opacity="0.32"
            />
          </g>

          {/* Center: City Buildings */}
          <g fill="#242B38" opacity="0.85">
            <rect x="250" y="200" width="35" height="120" rx="2" />
            <rect x="290" y="170" width="40" height="150" rx="2" />
            <rect x="430" y="180" width="38" height="140" rx="2" />
            <rect x="475" y="210" width="35" height="110" rx="2" />
          </g>

          {/* Center: The Home (Sanctuary) */}
          <g transform="translate(340, 230)">
            {/* Clean Air Halo */}
            {purifierOn && (
              <ellipse cx="40" cy="45" rx="55" ry="45" fill="url(#cleanGlow)" />
            )}

            {/* House Structure */}
            <polygon points="40,10 5,35 75,35" fill="#EAE4D8" stroke="#56685F" strokeWidth="1" />
            <rect x="10" y="35" width="60" height="55" fill="#FAF7F2" stroke="#56685F" strokeWidth="1" rx="2" />
            
            {/* Windows */}
            <rect x="18" y="42" width="18" height="18" fill={purifierOn ? '#6F9A62' : '#D9822B'} opacity="0.8" rx="2" />
            <rect x="44" y="42" width="18" height="18" fill={purifierOn ? '#6F9A62' : '#D9822B'} opacity="0.8" rx="2" />
            
            {/* Door */}
            <rect x="30" y="66" width="20" height="24" fill="#8C5311" rx="1" />

            {/* Purifier Exhaust Arrow */}
            {purifierOn && (
              <g stroke="#6F9A62" strokeWidth="2.5" fill="none" strokeLinecap="round">
                <path d="M 40 40 L 40 22 M 35 27 L 40 20 L 45 27" />
              </g>
            )}
          </g>
        </svg>

        {/* Projected Interactive HTML Labels on SVG Diagram */}
        {/* 1. Inversion Lid Label */}
        <div
          tabIndex={0}
          role="note"
          aria-label={`${lidLabel}: ${lidSub}`}
          className="absolute left-6 text-left pointer-events-auto cursor-default focus:ring-2 focus:ring-[#D6B33F] rounded p-1 transition"
          style={{ top: `${Math.max(12, (lidY / 380) * 80)}%` }}
        >
          <div className="text-[10px] font-mono font-bold text-[#F3C474] tracking-wider uppercase">
            {lidLabel}
          </div>
          <div className="text-[11px] font-mono text-[#D8E4DC]">
            {lidSub}
          </div>
        </div>

        {/* 2. Home Label */}
        <div
          tabIndex={0}
          role="note"
          aria-label={`${homeLabel}: ${homeSub}`}
          className="absolute left-1/2 -translate-x-1/2 bottom-8 text-center pointer-events-auto cursor-default focus:ring-2 focus:ring-[#6F9A62] rounded p-1 transition"
        >
          <div className="text-[11px] font-mono font-extrabold text-[#6F9A62] tracking-wider uppercase">
            {homeLabel}
          </div>
          <div className="text-[10px] font-mono font-bold text-white bg-[#18261F]/90 px-2 py-0.5 rounded-full inline-block mt-0.5 border border-[#3D6B56]">
            {homeSub}
          </div>
        </div>

        {/* 3. Industry Label */}
        <div
          tabIndex={0}
          role="note"
          aria-label={`${indLabel}: Industrial Emissions`}
          className="absolute left-10 bottom-24 text-left pointer-events-auto cursor-default focus:ring-2 focus:ring-[#8B909A] rounded p-1 transition hidden sm:block"
        >
          <div className="text-[9px] font-mono font-bold text-[#A6BCB0] tracking-wider uppercase">
            {indLabel}
          </div>
          <div className="text-[10px] font-mono text-[#A6BCB0]">
            Stack Emissions
          </div>
        </div>

        {/* 4. Crop Residue Label */}
        <div
          tabIndex={0}
          role="note"
          aria-label={`${burnLabel}: Surface Combustion`}
          className="absolute right-10 bottom-24 text-right pointer-events-auto cursor-default focus:ring-2 focus:ring-[#D9822B] rounded p-1 transition hidden sm:block"
        >
          <div className="text-[9px] font-mono font-bold text-[#D9822B] tracking-wider uppercase">
            {burnLabel}
          </div>
          <div className="text-[10px] font-mono text-[#A6BCB0]">
            Surface Smoke
          </div>
        </div>
      </div>

      {/* Footer Info Row */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#232A38] text-[11px] font-mono-code text-[#A6BCB0]">
        <div>
          Outdoor US AQI · <strong className="text-[#F3C474]">{currentAqi}</strong> • Illustrative diagram
        </div>
        <div className="text-[10px] text-[#A6BCB0]">
          Static physics diagram • Accessible 2D alternative
        </div>
      </div>
    </div>
  );
}
