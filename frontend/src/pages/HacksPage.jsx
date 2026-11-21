import React from 'react';
import IndoorHacksLab from '../components/IndoorHacksLab';

export default function HacksPage() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="bg-white rounded-3xl border border-[#E6DED6] p-6 sm:p-8 paper-shadow">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🛠️</span>
              <h1 className="text-2xl sm:text-3xl font-extrabold font-serif-natural text-[#18261F]">
                Indoor Air Quality and Filtration Guide
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-[#56685F] mt-1 max-w-2xl">
              Compare practical source-control and filtration steps. DIY performance and costs vary by fan, filters, room, and local prices, so this guide does not promise a CADR or exposure reduction.
            </p>
          </div>

          <div className="bg-[#FAF7F2] p-3 rounded-2xl border border-[#DFD6CB] shrink-0 text-xs">
            <span className="text-[10px] font-mono-code uppercase font-bold text-[#56685F] block">Approach</span>
            <span className="text-sm font-bold text-[#3D6B56] font-mono-code">Source control + filtration</span>
          </div>
        </div>
      </div>

      {/* Main Component */}
      <IndoorHacksLab />
    </div>
  );
}
