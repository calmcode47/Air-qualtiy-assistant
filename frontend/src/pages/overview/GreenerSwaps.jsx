import React from 'react';
import { ArrowRight, Leaf } from 'lucide-react';
import HowWeWorkedThisOut from '../../components/HowWeWorkedThisOut';
import { getTailoredSwaps } from '../../data/swaps';
import { useProfile } from '../../store/profile';

export default function GreenerSwaps({ onNavigate }) {
  const { profile } = useProfile();
  const tailoredSwaps = getTailoredSwaps(profile);

  return (
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
        {tailoredSwaps.map((swap) => (
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
        ))}
      </div>
    </section>
  );
}
