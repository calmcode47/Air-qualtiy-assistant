import React, { useState } from 'react';
import { getBand } from './sanctuaryBands';
import useSanctuaryScene from './useSanctuaryScene';
import './AtmosphericSanctuaryTwin3D.css';
import AtmosphericFallbackSVG from './AtmosphericFallbackSVG';

/**
 * Check if WebGL context is available in browser
 */
export function isWebGLAvailable() {
  try {
    if (typeof window === 'undefined') return false;
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

export default function AtmosphericSanctuaryTwin3D({
  outdoorAqi = null,
  fanSpeed = 'high',
  setFanSpeed,
  isNightMode = false,
  cityData,
  height,
  showHeader = true,
  showPanel = true,
  isSimpleMode = true
}) {
  const [scenarioAqi, setScenarioAqi] = useState(null);
  const aqi = scenarioAqi ?? Math.min(outdoorAqi ?? 100, 500);
  const purifierOn = fanSpeed !== 'off';
  const [fallbackReason, setFallbackReason] = useState(() => isWebGLAvailable() ? null : 'unavailable');

  const { stageRef, labelLidRef, labelHomeRef, labelIndRef, labelBurnRef } = useSanctuaryScene({
    fallbackReason, setFallbackReason, aqi, fanSpeed, isNightMode, isSimpleMode
  });

  function handleAqiChange(value) {
    setScenarioAqi(Number(value));
  }

  function handlePurifierToggle(checked) {
    setFanSpeed(checked ? 'high' : 'off');
  }


  const currentBand = getBand(aqi);
  // If WebGL failed or low-power mode chosen, show SVG fallback (Prompt 7 Task 4)
  if (fallbackReason) {
    return (
      <div className={`winter-smog-model-container w-full text-[#14161b] ${height === '100%' ? 'fill-height h-full' : ''}`}>
        <AtmosphericFallbackSVG
          aqi={aqi}
          purifierOn={purifierOn}
          cityData={cityData}
          isSimpleMode={isSimpleMode}
          webGlFailed={fallbackReason === 'unavailable'}
          onTry3D={fallbackReason === 'manual' ? () => setFallbackReason(null) : null}
        />
      </div>
    );
  }

  return (
    <div className={`winter-smog-model-container w-full text-[#14161b] ${height === '100%' ? 'fill-height h-full' : ''}`}>
      {/* Optional Top Title Header */}
      {showHeader && (
        <div className="winter-smog-hd">
          <h2>Air pollution and home filtration</h2>
        </div>
      )}

      {/* Grid Layout: 3D Stage on left, Control & Telemetry Panel on right */}
      <div className={showPanel ? 'winter-smog-layout' : 'w-full h-full flex-1 flex flex-col'}>
        {/* 3D Canvas Stage */}
        <div
          ref={stageRef}
          className={`winter-smog-stage ${height === '100%' ? 'fill-height' : ''} ${!showPanel ? 'no-border' : ''}`}
          style={{ height: height || 'min(72vh, 640px)' }}
        >
          <div className="winter-smog-hint">DRAG TO ROTATE · SCROLL TO ZOOM</div>

          {/* Low-Power 2D Mode Button (Prompt 7 Task 4) */}
          <button
            type="button"
            onClick={() => setFallbackReason('manual')}
            className="absolute top-3 right-3 z-10 bg-[#141822]/85 hover:bg-[#1f2636] text-[#D8E4DC] px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold transition border border-[#2D333F] flex items-center gap-1 shadow-sm"
            title="Switch to lightweight 2D diagram"
            aria-label="Switch to 2D view"
          >
            <span>2D View</span>
          </button>

          {/* Screen Reader Alternative (Prompt 7 Task 7) */}
          <div className="sr-only" aria-live="polite">
            Interactive illustration. The AQI slider shows a scenario value and is not a local air-quality reading.
            The atmospheric layer and filter effects are illustrative; this view does not estimate indoor PM2.5 or cleaner performance.
          </div>

          {/* 3D-Projected HTML Labels (Keyboard Focusable per Prompt 7 Task 7) */}
          <div
            ref={labelLidRef}
            className="winter-smog-lb"
            tabIndex={0}
            role="note"
            aria-label="Inversion Lid Layer"
            style={{ display: 'none' }}
          >
            <span />
            <b />
          </div>
          <div
            ref={labelHomeRef}
            className="winter-smog-lb"
            tabIndex={0}
            role="note"
            aria-label="Your Home Air Quality"
            style={{ display: 'none' }}
          >
            <span />
            <b />
          </div>
          <div
            ref={labelIndRef}
            className="winter-smog-lb"
            tabIndex={0}
            role="note"
            aria-label="Factory Stack Emissions"
            style={{ display: 'none' }}
          >
            <span />
            <b />
          </div>
          <div
            ref={labelBurnRef}
            className="winter-smog-lb"
            tabIndex={0}
            role="note"
            aria-label="Biomass Smoke"
            style={{ display: 'none' }}
          >
            <span />
            <b />
          </div>

          {/* Quick Purifier Action Switch when full panel is hidden */}
          {!showPanel && (
            <button
              type="button"
              onClick={() => handlePurifierToggle(!purifierOn)}
              className="winter-smog-quick-pur"
              title="Toggle home air purifier"
            >
              <span className={`winter-smog-dot ${purifierOn ? 'active' : ''}`} />
              <span>Purifier: {purifierOn ? 'ON' : 'OFF'}</span>
            </button>
          )}
        </div>

        {/* Side Panel Controls & Live Metrics */}
        {showPanel && (
          <div className="winter-smog-panel">
            <div>
              <div className="winter-smog-k">ILLUSTRATIVE AQI SCENARIO</div>
              <div className="winter-smog-aqi-n">{aqi}</div>
              <div
                className="winter-smog-band"
                style={{ color: '#18261F' }}
              >
                {currentBand[1]}
              </div>
            </div>

            <div className="winter-smog-tip">{currentBand[3]}</div>

            {/* AQI Range Slider */}
            <div>
              <input
                type="range"
                min="20"
                max="500"
                value={aqi}
                aria-label="Illustrative AQI scenario value"
                onChange={(e) => handleAqiChange(e.target.value)}
              />
            </div>

            {/* Quick Band Buttons */}
            <div className="winter-smog-chips">
              <button
                type="button"
                className={aqi === 25 ? 'active-chip' : ''}
                onClick={() => handleAqiChange(25)}
              >
                GOOD
              </button>
              <button
                type="button"
                className={aqi === 75 ? 'active-chip' : ''}
                onClick={() => handleAqiChange(75)}
              >
                MODERATE
              </button>
              <button
                type="button"
                className={aqi === 125 ? 'active-chip' : ''}
                onClick={() => handleAqiChange(125)}
              >
                SENSITIVE
              </button>
              <button
                type="button"
                className={aqi === 175 ? 'active-chip' : ''}
                onClick={() => handleAqiChange(175)}
              >
                UNHEALTHY
              </button>
              <button
                type="button"
                className={aqi === 250 ? 'active-chip' : ''}
                onClick={() => handleAqiChange(250)}
              >
                VERY UNHEALTHY
              </button>
              <button
                type="button"
                className={aqi === 350 ? 'active-chip' : ''}
                onClick={() => handleAqiChange(350)}
              >
                HAZARDOUS
              </button>
            </div>

            {/* Air Purifier Toggle */}
            <label className="winter-smog-sw">
              <span>Air purifier at home</span>
              <input
                type="checkbox"
                checked={purifierOn}
                onChange={(e) => handlePurifierToggle(e.target.checked)}
                className="w-4 h-4 cursor-pointer accent-[#14161b]"
              />
            </label>

            {/* Filter illustration note */}
            <div className="winter-smog-k" style={{ minHeight: '14px' }}>
              {purifierOn ? 'FILTER STATUS SHOWN FOR ILLUSTRATION ONLY' : ''}
            </div>

            <div className="winter-smog-note">
              Schematic illustration only. Particle motion, filter effect, and inversion position are not measured or calculated values.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
