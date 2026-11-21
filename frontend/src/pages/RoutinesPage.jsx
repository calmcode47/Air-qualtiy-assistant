import React from 'react';
import DiurnalRoutineTimeline from '../components/DiurnalRoutineTimeline';
import { useAir } from '../context/AirContext';
import { ChartSkeleton } from '../components/LoadingSkeleton';

export default function RoutinesPage({ cityData: propCityData }) {
  let airContext;
  try {
    airContext = useAir();
  } catch (e) {
    airContext = null;
  }

  const cityData = airContext?.airData || propCityData;
  const isLoading = airContext?.isLoading || false;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="bg-white rounded-3xl border border-[#E6DED6] p-6 sm:p-8 paper-shadow">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🕒</span>
              <h1 className="text-2xl sm:text-3xl font-extrabold font-serif-natural text-[#18261F]">
                Hourly Air-Quality Forecast &amp; Daily Routine Planner
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-[#56685F] mt-1 max-w-2xl">
              Compare hourly pollution estimates and adjust outdoor time when practical. Forecasts are modelled values, not street-level measurements or guaranteed safe periods.
            </p>
          </div>

          <div className="bg-[#EAF2ED] p-3 rounded-2xl border border-[#CCE0D4] shrink-0 text-xs">
            <span className="text-[10px] font-mono-code uppercase font-bold text-[#56685F] block">Lower forecast period</span>
            <span className="text-sm font-bold text-[#3D6B56] font-mono-code">{cityData.cleanestWindow || 'No lower-pollution period available'}</span>
          </div>
        </div>
      </div>

      {/* Main Component or Skeleton */}
      {isLoading ? (
        <ChartSkeleton />
      ) : (
        <DiurnalRoutineTimeline cityData={cityData} />
      )}
    </div>
  );
}
