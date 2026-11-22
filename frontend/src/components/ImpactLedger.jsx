import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, CheckSquare, Info, Square } from 'lucide-react';
import { calculateLedgerTotals, ledgerEntryDate, localDateKey } from '../utils/impactCalculator';
import { SWAPS } from '../data/swaps';
import HowWeWorkedThisOut from './HowWeWorkedThisOut';

export default function ImpactLedger() {
  const [today, setToday] = useState(() => new Date());
  const todayDateStr = localDateKey(today);

  useEffect(() => {
    function refreshDay() {
      const now = new Date();
      setToday((previous) => localDateKey(previous) === localDateKey(now) ? previous : now);
    }

    const timer = setInterval(refreshDay, 60_000);
    document.addEventListener('visibilitychange', refreshDay);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', refreshDay);
    };
  }, []);

  const [choicesLog, setChoicesLog] = useState(() => {
    try {
      const saved = localStorage.getItem('aura_choices_log');
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed.filter((entry) => typeof entry?.swapId === 'string').slice(-2000) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('aura_choices_log', JSON.stringify(choicesLog.slice(-2000)));
    } catch {
      // Keep the current session usable if browser storage is unavailable.
    }
  }, [choicesLog]);

  const totals = useMemo(() => calculateLedgerTotals({ log: choicesLog, targetDate: today }), [choicesLog, today]);
  const loggedToday = new Set(totals.todayEntries.map((entry) => entry.swapId));

  function toggleChoice(swapId) {
    const now = new Date();
    const day = localDateKey(now);
    setToday(now);
    setChoicesLog((previous) => {
      const matches = (entry) => entry.swapId === swapId && ledgerEntryDate(entry, day) === day;
      if (previous.some(matches)) return previous.filter((entry) => !matches(entry));
      return [...previous, { swapId, date: day, timestamp: now.getTime() }].slice(-2000);
    });
  }

  function clearToday() {
    const now = new Date();
    const day = localDateKey(now);
    setToday(now);
    setChoicesLog((previous) => previous.filter((entry) => ledgerEntryDate(entry, day) !== day));
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <section className="bg-white p-5 rounded-3xl border border-[#E6DED6] paper-shadow">
          <h2 className="text-xs font-semibold text-[#53645C]">Choices logged today</h2>
          <div className="flex items-baseline gap-2 mt-2">
            <span data-testid="choices-logged-count" className="text-3xl font-serif-natural font-bold text-[#1A2922]">{totals.dailyChoiceCount}</span>
            <span className="text-xs text-[#53645C]">of {SWAPS.length} options</span>
          </div>
          <p className="text-[11px] text-[#53645C] mt-2">This is a record of actions, not a measurement of pollution avoided.</p>
        </section>

        <section className="bg-white p-5 rounded-3xl border border-[#E6DED6] paper-shadow">
          <h2 className="text-xs font-semibold text-[#53645C]">Past seven days</h2>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-serif-natural font-bold text-[#3D6B56]">{totals.weeklyChoiceCount}</span>
            <span className="text-xs text-[#53645C]">logged actions</span>
          </div>
          <p className="text-[11px] text-[#53645C] mt-2">Repeated actions on separate days count separately.</p>
        </section>

        <section className="bg-white p-5 rounded-3xl border border-[#E6DED6] paper-shadow">
          <h2 className="text-xs font-semibold text-[#53645C]">Direct impact</h2>
          <p className="text-sm font-bold text-[#1A2922] mt-2">What each action can change</p>
          <p className="text-[11px] text-[#53645C] mt-2">Indoor effects depend on the home, equipment, ventilation, and how the choice is used.</p>
        </section>

        <section className="bg-white p-5 rounded-3xl border border-[#E6DED6] paper-shadow flex flex-col justify-between">
          <div>
            <h2 className="text-xs font-semibold text-[#53645C]">Your activity log</h2>
            <p className="text-[11px] text-[#53645C] mt-2">Stored on this device. It is not sent to the advice service.</p>
          </div>
          <div className="flex items-center gap-3 mt-3 text-[11px]">
            <button type="button" onClick={clearToday} className="font-semibold text-[#A94A28] hover:underline">Clear today</button>
          </div>
        </section>
      </div>

      <section className="bg-white rounded-3xl border border-[#E6DED6] p-6 sm:p-7 paper-shadow space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E6DED6]">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-serif-natural font-bold text-[#1A2922]">Log household choices</h2>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#EAF2ED] text-[#3D6B56] border border-[#CCE0D4]">Saved on this device</span>
            </div>
            <p className="text-xs text-[#53645C] mt-1">Choose actions completed today. Each card describes a likely effect and its limits.</p>
          </div>
          <div className="text-xs font-semibold text-[#53645C] flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-[#3D6B56]" />{todayDateStr}</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {SWAPS.map((swap) => {
            const isLogged = loggedToday.has(swap.id);
            return (
              <article key={swap.id} data-testid={`swap-card-${swap.id}`} className={`p-4 rounded-2xl border space-y-3 ${isLogged ? 'bg-[#F4F8F5] border-[#3D6B56]' : 'bg-white border-[#E6DED6]'}`}>
                <button
                  type="button"
                  aria-pressed={isLogged}
                  onClick={() => toggleChoice(swap.id)}
                  className="w-full text-left flex items-start gap-2.5 focus:outline-none focus:ring-2 focus:ring-[#1A2922] rounded-lg"
                >
                  {isLogged ? <CheckSquare className="w-5 h-5 text-[#3D6B56] shrink-0 mt-0.5" /> : <Square className="w-5 h-5 text-[#A9B8AF] shrink-0 mt-0.5" />}
                  <span className="flex-1">
                    <span className="block font-bold text-xs text-[#1A2922] leading-snug">{swap.label}</span>
                    <span className="flex flex-wrap items-center gap-1.5 mt-1.5">
                      <span className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-[#FAF7F2] text-[#56685F] border border-[#DFD6CB]">{swap.category}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#FAF7F2] text-[#53645C] border border-[#DFD6CB]">{swap.costBand}</span>
                      <span className="text-[9px] text-[#56685F]">{swap.timeEffect}</span>
                    </span>
                  </span>
                </button>
                <p className="text-[11px] leading-relaxed text-[#53645C] border-t border-[#E6DED6] pt-2">{swap.impact.value}</p>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] font-semibold text-[#8C5311]">{swap.impact.confidence === 'med' ? 'Evidence varies by setup' : 'Qualitative guidance'}</span>
                  <HowWeWorkedThisOut
                    title={swap.label}
                    formula="No personal exposure or emissions total is calculated."
                    assumptions={swap.impact.assumptions}
                    confidence={swap.impact.confidence}
                    source={swap.impact.source}
                    buttonLabel="Sources and limits"
                  />
                </div>
              </article>
            );
          })}
        </div>

        {totals.todayEntries.length > 0 && (
          <div className="bg-[#FAF7F2] rounded-2xl border border-[#DFD6CB] p-4 space-y-2">
            <h3 className="text-xs font-bold text-[#1A2922] flex items-center gap-2"><Info className="w-4 h-4 text-[#3D6B56]" />Logged choices and their likely effects</h3>
            <ul className="list-disc pl-5 space-y-1 text-xs text-[#53645C]">
              {totals.todayEntries.map((entry) => <li key={entry.swapId}>{entry.swap.label}: {entry.swap.impact.value}</li>)}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
