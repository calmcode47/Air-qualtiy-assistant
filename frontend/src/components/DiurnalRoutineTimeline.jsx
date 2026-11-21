import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock, Info, Sun } from 'lucide-react';
import { useProfile } from '../store/profile';
import { getUsAqiCategory, isSensitiveHousehold, outdoorGuidance } from '../../../shared/aqi.mjs';

function guidanceFor(aqi, profile = {}) {
  const category = getUsAqiCategory(aqi);

  if (aqi == null || !Number.isFinite(Number(aqi))) {
    return {
      phase: 'Forecast unavailable',
      summary: 'There is no hourly forecast for this location. Check a current local air-quality advisory before planning strenuous outdoor activity.',
      rules: ['Use the latest local advisory for time-sensitive plans.', 'If your household has a clinician-provided air-quality plan, follow it.'],
      impact: 'No exposure estimate is available because no current forecast was returned.'
    };
  }

  const activity = outdoorGuidance(aqi, isSensitiveHousehold(profile));

  return {
    phase: category,
    summary: `Forecast US AQI is ${Math.round(aqi)} (${category}). ${activity}`,
    rules: [
      activity,
      'A forecast period with a lower AQI is comparative, not a guaranteed safe window or a street-level reading.',
      'For indoor particles, reduce sources and use a correctly sized mechanical filter if available; ventilate when outdoor air is cleaner.'
    ],
    impact: 'Less time or exertion during higher pollution can reduce inhaled pollution; this is not a personal dose calculation.'
  };
}

function barColor(aqi) {
  if (aqi <= 50) return 'bg-[#6F9A62]';
  if (aqi <= 100) return 'bg-[#D6B33F]';
  if (aqi <= 150) return 'bg-[#D9822B]';
  if (aqi <= 200) return 'bg-[#B5473A]';
  return 'bg-[#7A2E3A]';
}

export default function DiurnalRoutineTimeline({ cityData = {} }) {
  const { profile } = useProfile();
  const hourly = Array.isArray(cityData.diurnalHourly) ? cityData.diurnalHourly : [];
  const [selectedHourIdx, setSelectedHourIdx] = useState(0);
  const selectedIndex = Math.min(selectedHourIdx, Math.max(0, hourly.length - 1));
  const currentHourData = hourly[selectedIndex] || null;
  const guidance = useMemo(() => guidanceFor(currentHourData?.aqi, profile), [currentHourData, profile]);
  const lowerWindow = cityData.cleanestWindow || 'No lower-pollution period available';

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-3xl border border-[#E6DED6] p-6 sm:p-7 paper-shadow space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E6DED6]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#EAF2ED] text-[#3D6B56] border border-[#CCE0D4] flex items-center justify-center"><Clock className="w-5 h-5" /></div>
            <div>
              <h2 className="text-xl font-serif-natural font-bold text-[#1A2922]">Hourly air-quality forecast</h2>
              <p className="text-xs text-[#53645C]">Compare forecast hours in the selected location’s time zone. A lower AQI can still warrant precautions.</p>
            </div>
          </div>
          <div className="text-xs bg-[#FAF7F2] border border-[#DFD6CB] rounded-xl px-3 py-2">
            <span className="font-semibold text-[#53645C]">Lower forecast period:</span>{' '}
            <strong className="text-[#1A2922]">{lowerWindow}</strong>
            {cityData.cleanestWindowPeakAqi != null && <span className="block text-[#53645C]">Peak US AQI {cityData.cleanestWindowPeakAqi} · {getUsAqiCategory(cityData.cleanestWindowPeakAqi)}</span>}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className="lg:col-span-4 bg-[#FAF7F2] p-5 rounded-2xl border border-[#DFD6CB] space-y-3">
            <div className="flex items-center justify-between text-xs text-[#53645C]">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Selected forecast hour</span>
              <span className="font-mono font-bold text-[#1A2922]">{cityData.name || 'Selected location'}</span>
            </div>
            {currentHourData ? (
              <>
                <p className="text-xs font-semibold text-[#53645C]">{currentHourData.dateLabel}</p>
                <div className="flex items-baseline gap-3">
                  <span className="text-5xl font-serif-natural font-bold text-[#1A2922]">{currentHourData.aqi}</span>
                  <span className="text-xs font-bold uppercase text-[#A94A28]">US AQI · {getUsAqiCategory(currentHourData.aqi)}</span>
                </div>
                <p className="text-[11px] text-[#53645C]">PM2.5 forecast: {currentHourData.pm25 != null && Number.isFinite(Number(currentHourData.pm25)) ? `${currentHourData.pm25} µg/m³` : 'unavailable'}</p>
              </>
            ) : (
              <p className="text-sm font-semibold text-[#53645C]">Hourly forecast unavailable for this location.</p>
            )}
            <div className="pt-3 border-t border-[#DFD6CB] text-[11px] text-[#53645C] flex items-start gap-2">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{cityData.isLive ? 'Open-Meteo/CAMS model estimate. It is not a street-level monitor.' : cityData.isCached ? 'Showing a saved current reading only; hourly forecast data has been hidden because it may be out of date.' : 'No live hourly forecast is available for this location.'}</span>
            </div>
          </div>

          <div className="lg:col-span-8 bg-[#FAF7F2] p-5 rounded-2xl border border-[#DFD6CB] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#1A2922]">Next available forecast hours</span>
                <p className="text-[11px] text-[#53645C]">Scroll for more hours. Select a bar for activity guidance.</p>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-1 rounded bg-white border border-[#DFD6CB] text-[#53645C]">US AQI bands</span>
            </div>

            {hourly.length > 0 ? (
              <div className="grid grid-flow-col auto-cols-[calc((100%-1.5rem)/4)] sm:auto-cols-[calc((100%-3.5rem)/8)] gap-2 overflow-x-auto pb-2" role="group" aria-label="Hourly US AQI forecast">
                {hourly.map((hour, index) => {
                  const isSelected = selectedIndex === index;
                  const height = Math.min(100, Math.max(8, (hour.aqi / 350) * 100));
                  return (
                    <button key={hour.time} type="button" aria-label={`${hour.dateLabel}, US AQI ${hour.aqi}, ${hour.label}`} aria-pressed={isSelected} onClick={() => setSelectedHourIdx(index)} className={`flex flex-col items-center justify-end h-36 p-1 rounded-xl transition ${isSelected ? 'bg-white border-2 border-[#1A2922] shadow-sm' : 'hover:bg-white/60'}`}>
                      <span className="text-[10px] font-bold font-mono text-[#1A2922] mb-1">{hour.aqi}</span>
                      <div className="w-full h-24 bg-[#E8E2D8] rounded-lg overflow-hidden flex flex-col justify-end p-0.5">
                        <div className={`w-full rounded-md ${barColor(hour.aqi)}`} style={{ height: `${height}%` }} />
                      </div>
                      <span className="text-[10px] font-mono mt-2 font-bold text-[#56685F]">{hour.hour}</span>
                      {hour.label === 'Good' && <span className="text-[9px] text-[#3D6B56] leading-none">Good</span>}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl bg-white border border-[#E6DED6] p-5 text-sm text-[#53645C]">A forecast curve will appear when hourly data is available.</div>
            )}

            <div className="rounded-xl bg-white p-4 border border-[#E6DED6] space-y-3">
              <div className="flex items-start gap-3">
                <span className="w-9 h-9 rounded-full bg-[#1A2922] text-white flex items-center justify-center font-mono font-bold text-[10px] text-center">{currentHourData?.hour || '—'}</span>
                <div>
                  <h3 className="text-sm font-bold text-[#1A2922]">{guidance.phase}</h3>
                  <p className="text-xs text-[#53645C] mt-1 leading-relaxed">{guidance.summary}</p>
                </div>
              </div>
              <ul className="space-y-2 text-xs text-[#53645C]">
                {guidance.rules.map((rule, index) => <li key={index} className="flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-[#3D6B56] shrink-0 mt-0.5" /><span>{rule}</span></li>)}
              </ul>
              <div className="bg-[#FBF5EC] border border-[#F2E0C5] rounded-lg px-3 py-2 text-[11px] text-[#79500F] flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{guidance.impact}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
