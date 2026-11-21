import React, { useState } from 'react';
import { INDOOR_HACKS } from '../data/indoorHacks';
import { useProfile } from '../store/profile';
import HowWeWorkedThisOut from './HowWeWorkedThisOut';
import { Check, Info, ShieldCheck, Wrench } from 'lucide-react';

export default function IndoorHacksLab() {
  const [selectedHackId, setSelectedHackId] = useState('corsi-rosenthal');
  const [fanType, setFanType] = useState('box20');
  const [filterCount, setFilterCount] = useState(4);
  const [filterGrade, setFilterGrade] = useState('merv13');
  let profile = {};
  try {
    profile = useProfile().profile;
  } catch {
    profile = {};
  }
  const activeHack = INDOOR_HACKS.find((hack) => hack.id === selectedHackId) || INDOOR_HACKS[0];
  const isProfileMatch = (hackId) => (
    (hackId === 'corsi-rosenthal' && (profile.monthlyBudgetBand === 'low' || profile.purifierOwned === 'none'))
    || (hackId === 'kitchen-exhaust' && ['biomass_wood', 'lpg'].includes(profile.cookingFuel))
  );
  const selectedConfiguration = `${fanType === 'box20' ? '20-inch box fan' : fanType === 'pedestal' ? 'pedestal fan' : 'utility blower'}, ${filterCount} filter${filterCount === 1 ? '' : 's'}, ${filterGrade.toUpperCase()} media`;

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-3xl border border-[#E6DED6] p-6 sm:p-7 paper-shadow space-y-5">
        <div className="flex items-start gap-3 pb-4 border-b border-[#E6DED6]">
          <div className="w-10 h-10 rounded-2xl bg-[#EAF2ED] text-[#3D6B56] border border-[#CCE0D4] flex items-center justify-center"><Wrench className="w-5 h-5" /></div>
          <div>
            <h2 className="text-xl font-serif-natural font-bold text-[#1A2922]">Indoor air choices and filter planning</h2>
            <p className="text-xs text-[#53645C] mt-1">Reduce indoor sources first. Mechanical filtration can help with particles, but no filter removes every pollutant.</p>
          </div>
        </div>

        <div className="bg-[#FAF7F2] p-5 rounded-2xl border border-[#DFD6CB] space-y-4">
          <div>
            <h3 className="text-base font-bold font-serif-natural text-[#1A2922]">DIY filter setup planner</h3>
            <p className="text-xs text-[#53645C] mt-1">Describe a possible build. This planner does not calculate CADR, room cleaning time, or cost because those depend on the exact tested equipment and local prices.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-3.5 rounded-xl border border-[#E6DED6] space-y-1.5">
              <label htmlFor="fan-architecture-select" className="text-[11px] font-bold uppercase tracking-wider text-[#53645C] block">Fan type</label>
              <select id="fan-architecture-select" value={fanType} onChange={(event) => setFanType(event.target.value)} className="w-full text-xs font-semibold bg-[#FAF7F2] border border-[#DFD6CB] rounded-lg p-2 text-[#1A2922] focus:outline-none focus:ring-2 focus:ring-[#1A2922]">
                <option value="box20">20-inch box fan</option>
                <option value="pedestal">Pedestal fan</option>
                <option value="blower">Utility blower</option>
              </select>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-[#E6DED6] space-y-1.5">
              <label htmlFor="filter-geometry-select" className="text-[11px] font-bold uppercase tracking-wider text-[#53645C] block">Filter count</label>
              <select id="filter-geometry-select" value={filterCount} onChange={(event) => setFilterCount(Number(event.target.value))} className="w-full text-xs font-semibold bg-[#FAF7F2] border border-[#DFD6CB] rounded-lg p-2 text-[#1A2922] focus:outline-none focus:ring-2 focus:ring-[#1A2922]">
                {[1, 2, 4, 5].map((count) => <option key={count} value={count}>{count} filter{count === 1 ? '' : 's'}</option>)}
              </select>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-[#E6DED6] space-y-1.5">
              <label htmlFor="filtration-media-select" className="text-[11px] font-bold uppercase tracking-wider text-[#53645C] block">Filter rating</label>
              <select id="filtration-media-select" value={filterGrade} onChange={(event) => setFilterGrade(event.target.value)} className="w-full text-xs font-semibold bg-[#FAF7F2] border border-[#DFD6CB] rounded-lg p-2 text-[#1A2922] focus:outline-none focus:ring-2 focus:ring-[#1A2922]">
                <option value="merv13">MERV 13</option>
                <option value="merv14">MERV 14</option>
              </select>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-[#E6DED6] space-y-2">
            <div className="text-xs font-bold text-[#1A2922]">Selected setup: {selectedConfiguration}</div>
            <p className="text-xs leading-relaxed text-[#53645C]">Use filters that fit the design and do not overload the fan. The filter rating alone cannot predict airflow or clean-air delivery. For a purchased cleaner, compare its published smoke CADR with the room size.</p>
            <HowWeWorkedThisOut
              title="Filter selection and performance limits"
              formula="No CADR, cost, or room-level reduction is estimated by this planner."
              assumptions={['The exact fan and filter model are not specified.', 'Room size, leakage, fan speed, and maintenance affect performance.']}
              confidence="low"
              source="US EPA, Guide to Air Cleaners in the Home; EPA Research on DIY Air Cleaners."
              buttonLabel="Sources and limits"
            />
          </div>
          <div className="bg-[#FBF5EC] p-3.5 rounded-xl border border-[#F2E0C5] text-xs text-[#79500F] flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Fan safety matters. Use an intact fan, follow its manual, keep intake and exhaust clear, and avoid damaged wiring. EPA recommends newer box fans with a UL or ETL mark for DIY cleaners.</span>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 space-y-2.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#53645F] px-1">Practical interventions</h2>
          {INDOOR_HACKS.map((hack) => (
            <button
              key={hack.id}
              type="button"
              aria-pressed={selectedHackId === hack.id}
              onClick={() => setSelectedHackId(hack.id)}
              className={`w-full p-4 text-left rounded-2xl border transition flex items-start justify-between gap-3 ${selectedHackId === hack.id ? 'bg-[#FAF7F2] border-2 border-[#1A2922] shadow-sm' : 'bg-white border-[#E6DED6] hover:bg-[#FAF7F2]'}`}
            >
              <span>
                <span className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#1A2922]">{hack.title}</span>
                  {isProfileMatch(hack.id) && <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#EAF2ED] text-[#3D6B56]">Profile match</span>}
                </span>
                <span className="block text-[11px] text-[#53645C] mt-1">{hack.description}</span>
              </span>
              <span className="text-[9px] text-[#56685F] shrink-0">{hack.cost}</span>
            </button>
          ))}
        </div>

        <article className="lg:col-span-7 bg-white p-6 sm:p-7 rounded-3xl border border-[#E6DED6] paper-shadow space-y-5">
          <header className="pb-3 border-b border-[#E6DED6]">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#56685F] font-bold">{activeHack.category}</span>
            <h2 className="text-base font-bold font-serif-natural text-[#1A2922]">{activeHack.title}</h2>
            <p className="text-xs text-[#53645C] mt-2">{activeHack.description}</p>
          </header>

          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#1A2922] flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-[#3D6B56]" />Practical steps</h3>
            {activeHack.steps.map((step, index) => (
              <div key={index} className="flex items-start gap-2.5 text-xs text-[#1A2922] bg-[#FAF7F2] p-3 rounded-xl border border-[#DFD6CB]">
                <span className="w-5 h-5 rounded-full bg-[#1A2922] text-[#FAF7F2] flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">{index + 1}</span>
                <span className="leading-relaxed">{step}</span>
              </div>
            ))}
          </div>

          <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#DFD6CB] space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#1A2922]"><Info className="w-3.5 h-3.5 text-[#8C5311]" />Why this can help</div>
            <p className="text-xs text-[#53645C] leading-relaxed">{activeHack.whyItWorks}</p>
            <HowWeWorkedThisOut
              title={`${activeHack.title}: evidence and limits`}
              formula="Qualitative guidance; no personal exposure reduction is calculated."
              assumptions={activeHack.assumptions}
              confidence="low"
              source={activeHack.source}
              buttonLabel="Sources and limits"
            />
          </div>
        </article>
      </section>
    </div>
  );
}
