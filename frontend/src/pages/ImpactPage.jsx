import React from 'react';
import ImpactLedger from '../components/ImpactLedger';

export default function ImpactPage() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="bg-white rounded-3xl border border-[#E6DED6] p-6 sm:p-8 paper-shadow">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">📊</span>
              <h1 className="text-2xl sm:text-3xl font-extrabold font-serif-natural text-[#18261F]">
                Household Choices &amp; Direct Impact Ledger
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-[#56685F] mt-1 max-w-2xl">
              Log actions your household actually completed and review their likely effects. The ledger explains assumptions without inventing personal exposure reductions or emissions totals.
            </p>
          </div>

          <div className="bg-[#EAF2ED] p-3 rounded-2xl border border-[#CCE0D4] shrink-0 text-xs">
            <span className="text-[10px] font-mono-code uppercase font-bold text-[#56685F] block">Impact method</span>
            <span className="text-sm font-bold text-[#3D6B56] font-mono-code">Qualitative with limits</span>
          </div>
        </div>
      </div>

      {/* Main Component */}
      <ImpactLedger
      />
    </div>
  );
}
