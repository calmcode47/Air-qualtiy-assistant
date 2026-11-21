import React from 'react';
import GenAIAssistant from '../components/GenAIAssistant';
import { useAir } from '../context/AirContext';

export default function AdvisorPage({ cityData: propCityData, outdoorAqi: propOutdoorAqi }) {
  let airContext;
  try {
    airContext = useAir();
  } catch (e) {
    airContext = null;
  }
  const cityData = airContext?.airData || propCityData;
  const outdoorAqi = airContext?.outdoorAqi ?? propOutdoorAqi;
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="bg-white rounded-3xl border border-[#E6DED6] p-6 sm:p-8 paper-shadow">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🤖</span>
              <h1 className="text-2xl sm:text-3xl font-extrabold font-serif-natural text-[#18261F]">
                GenAI Urban Smog Advisor
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-[#56685F] mt-1 max-w-2xl">
              Personalized low-emission daily routines, indoor filtration hacks, and sustainable community alternatives tailored to {cityData.name} and your lifestyle profile.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-[#FAF7F2] p-2.5 rounded-2xl border border-[#DFD6CB] shrink-0 font-mono-code text-xs">
            <span className="text-[#56685F] font-bold">Location</span>
            <span className="font-bold text-[#18261F]">{cityData.name}</span>
            <span className="text-[#A94A28] font-bold">US AQI {outdoorAqi ?? "—"}</span>
          </div>
        </div>
      </div>

      {/* Main GenAI Component */}
      <GenAIAssistant key={cityData?.id} cityData={cityData} outdoorAqi={outdoorAqi} />
    </div>
  );
}
