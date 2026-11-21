import React, { useState } from 'react';
import { useProfile } from '../store/profile';
import {
  Users,
  Home,
  ShieldCheck,
  Check,
  ArrowRight,
  ArrowLeft,
  X,
  HeartPulse,
  Baby,
  Activity,
  DollarSign,
  Languages
} from 'lucide-react';

export default function OnboardingModal() {
  const {
    profile,
    updateProfile,
    isOnboardingOpen,
    setIsOnboardingOpen,
    completeOnboarding
  } = useProfile();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ ...profile });

  if (!isOnboardingOpen) return null;

  const toggleCondition = (cond) => {
    setFormData((prev) => {
      const exists = prev.conditions?.includes(cond);
      const next = exists
        ? prev.conditions.filter((c) => c !== cond)
        : [...(prev.conditions || []), cond];
      return { ...prev, conditions: next };
    });
  };

  const handleNext = () => {
    updateProfile(formData);
    if (step < 3) {
      setStep(step + 1);
    } else {
      completeOnboarding();
    }
  };

  const handleSkip = () => {
    completeOnboarding();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
      <div
        className="bg-[#FAF7F2] w-full max-w-lg rounded-3xl border border-[#DFD6CB] p-6 sm:p-7 paper-shadow space-y-6 max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
      >
        {/* Header & Steps Indicator */}
        <div className="flex items-start justify-between border-b border-[#E6DED6] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#18261F] text-[#FAF7F2] text-xs font-bold flex items-center justify-center">
                {step}
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#56685F] font-bold">
                Step {step} of 3 • Household Tailoring
              </span>
            </div>
            <h2 className="text-xl font-serif-natural font-bold text-[#18261F] mt-1">
              {step === 1 && 'Who Lives In Your Home?'}
              {step === 2 && 'Home Structure & Daily Commute'}
              {step === 3 && 'Clean Air Equipment & Budget'}
            </h2>
          </div>
          <button
            type="button"
            onClick={handleSkip}
            className="text-xs text-[#56685F] hover:text-[#18261F] underline p-1"
          >
            Skip for now
          </button>
        </div>

        {/* STEP 1: Demographics & Conditions */}
        {step === 1 && (
          <div className="space-y-5">
            <p className="text-xs text-[#56685F] leading-relaxed">
              Winter smog affects developing pediatric lungs and seniors differently. Tell us who you're protecting.
            </p>

            {/* Counts: Adults, Children, Elderly */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white p-3.5 rounded-2xl border border-[#E6DED6] text-center space-y-1">
                <span className="text-[10px] font-bold uppercase text-[#56685F] block">Adults</span>
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, adults: Math.max(1, p.adults - 1) }))}
                    className="w-6 h-6 rounded-full bg-[#FAF7F2] border border-[#DFD6CB] text-xs font-bold"
                  >
                    -
                  </button>
                  <span className="text-lg font-bold font-mono text-[#18261F]">{formData.adults}</span>
                  <button
                    type="button"
                    disabled={formData.adults >= 20}
                    onClick={() => setFormData((p) => ({ ...p, adults: Math.min(20, p.adults + 1) }))}
                    className="w-6 h-6 rounded-full bg-[#FAF7F2] border border-[#DFD6CB] text-xs font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-[#E6DED6] text-center space-y-1">
                <span className="text-[10px] font-bold uppercase text-[#56685F] block">Children</span>
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, children: Math.max(0, p.children - 1) }))}
                    className="w-6 h-6 rounded-full bg-[#FAF7F2] border border-[#DFD6CB] text-xs font-bold"
                  >
                    -
                  </button>
                  <span className="text-lg font-bold font-mono text-[#18261F]">{formData.children}</span>
                  <button
                    type="button"
                    disabled={formData.children >= 20}
                    onClick={() => setFormData((p) => ({ ...p, children: Math.min(20, p.children + 1) }))}
                    className="w-6 h-6 rounded-full bg-[#FAF7F2] border border-[#DFD6CB] text-xs font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-[#E6DED6] text-center space-y-1">
                <span className="text-[10px] font-bold uppercase text-[#56685F] block">Elderly</span>
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, elderly: Math.max(0, p.elderly - 1) }))}
                    className="w-6 h-6 rounded-full bg-[#FAF7F2] border border-[#DFD6CB] text-xs font-bold"
                  >
                    -
                  </button>
                  <span className="text-lg font-bold font-mono text-[#18261F]">{formData.elderly}</span>
                  <button
                    type="button"
                    disabled={formData.elderly >= 20}
                    onClick={() => setFormData((p) => ({ ...p, elderly: Math.min(20, p.elderly + 1) }))}
                    className="w-6 h-6 rounded-full bg-[#FAF7F2] border border-[#DFD6CB] text-xs font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Health Conditions Multi-Select */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#18261F] block">
                Sensitive Conditions in Household (select all that apply):
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'asthma', label: '🫁 Asthma / Chronic Bronchitis' },
                  { id: 'heart', label: '❤️ Cardiovascular Condition' },
                  { id: 'pregnancy', label: '🤰 Expectant Mother' }
                ].map((cond) => {
                  const active = formData.conditions?.includes(cond.id);
                  return (
                    <button
                      key={cond.id}
                      type="button"
                      onClick={() => toggleCondition(cond.id)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition ${
                        active
                          ? 'bg-[#18261F] text-[#FAF7F2] border-[#18261F] shadow-xs'
                          : 'bg-white text-[#56685F] border-[#E6DED6] hover:bg-[#FAF7F2]'
                      }`}
                    >
                      {cond.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Home Type, Commute, Cooking Fuel */}
        {step === 2 && (
          <div className="space-y-4">
            {/* Home Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#18261F] block">
                Home Architecture:
              </label>
              <select
                value={formData.homeType}
                onChange={(e) => setFormData((p) => ({ ...p, homeType: e.target.value }))}
                className="w-full text-xs font-semibold bg-white border border-[#DFD6CB] rounded-xl p-2.5 text-[#18261F] focus:outline-none"
              >
                <option value="apartment">Multi-story Apartment (Stack effect / shafts)</option>
                <option value="independent_house">Independent House / Villa</option>
                <option value="floor">Builder Floor / Ground Level</option>
                <option value="informal">Informal / High draft dwelling</option>
              </select>
            </div>

            {/* Commute */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#18261F] block">
                Primary Commute Method:
              </label>
              <select
                value={formData.commute}
                onChange={(e) => setFormData((p) => ({ ...p, commute: e.target.value }))}
                className="w-full text-xs font-semibold bg-white border border-[#DFD6CB] rounded-xl p-2.5 text-[#18261F] focus:outline-none"
              >
                <option value="two_wheeler">🛵 Two-Wheeler (Motorcycle / Scooter)</option>
                <option value="bus_metro">🚇 Underground Metro / Electric Bus</option>
                <option value="car">🚗 Personal Car (Combustion)</option>
                <option value="walk">🚶 Walk / Bicycle</option>
                <option value="wfh">💻 Work From Home (Strict Indoor)</option>
              </select>
            </div>

            {/* Cooking Fuel */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#18261F] block">
                Kitchen Cooking Fuel:
              </label>
              <select
                value={formData.cookingFuel}
                onChange={(e) => setFormData((p) => ({ ...p, cookingFuel: e.target.value }))}
                className="w-full text-xs font-semibold bg-white border border-[#DFD6CB] rounded-xl p-2.5 text-[#18261F] focus:outline-none"
              >
                <option value="lpg">LPG Cylinder with Range Hood</option>
                <option value="piped_gas">Piped Natural Gas (PNG)</option>
                <option value="electric_induction">Electric / Induction (Zero indoor combustion)</option>
                <option value="biomass_wood">Wood / Coal / Kerosene (High Indoor Soot)</option>
              </select>
            </div>
          </div>
        )}

        {/* STEP 3: Purifier, Budget, Language */}
        {step === 3 && (
          <div className="space-y-4">
            {/* Purifier Owned */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#18261F] block">
                Clean Air Hardware at Home:
              </label>
              <select
                value={formData.purifierOwned}
                onChange={(e) => setFormData((p) => ({ ...p, purifierOwned: e.target.value }))}
                className="w-full text-xs font-semibold bg-white border border-[#DFD6CB] rounded-xl p-2.5 text-[#18261F] focus:outline-none"
              >
                <option value="none">No air purifier currently owned</option>
                <option value="diy">$35 DIY Corsi-Rosenthal Box Fan</option>
                <option value="portable">Brand-Name Commercial HEPA Purifier</option>
              </select>
            </div>

            {/* Monthly Budget Band */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#18261F] block">
                Monthly Clean Air Budget Preference:
              </label>
              <select
                value={formData.monthlyBudgetBand}
                onChange={(e) => setFormData((p) => ({ ...p, monthlyBudgetBand: e.target.value }))}
                className="w-full text-xs font-semibold bg-white border border-[#DFD6CB] rounded-xl p-2.5 text-[#18261F] focus:outline-none"
              >
                <option value="low">Low Budget (Under $40 total — DIY &amp; textiles)</option>
                <option value="medium">Moderate Budget ($50 - $150 USD)</option>
                <option value="high">Flexible Budget ($200+ commercial appliances)</option>
              </select>
            </div>

            {/* Preferred Language */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#18261F] block">
                Preferred Interface Language:
              </label>
              <select
                value={formData.preferredLanguage}
                onChange={(e) => setFormData((p) => ({ ...p, preferredLanguage: e.target.value }))}
                className="w-full text-xs font-semibold bg-white border border-[#DFD6CB] rounded-xl p-2.5 text-[#18261F] focus:outline-none"
              >
                <option value="en">English</option>
                <option value="hi">हिंदी (Hindi)</option>
                <option value="pa">ਪੰਜਾਬੀ (Punjabi)</option>
              </select>
            </div>
          </div>
        )}

        {/* Modal Controls */}
        <div className="flex items-center justify-between pt-3 border-t border-[#E6DED6]">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-[#DFD6CB] hover:bg-[#FAF7F2] text-[#18261F] flex items-center gap-1.5 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <div></div>
          )}

          <button
            type="button"
            onClick={handleNext}
            className="px-5 py-2.5 rounded-xl bg-[#18261F] text-[#FAF7F2] text-xs font-bold hover:bg-[#2B3F35] transition flex items-center gap-2 shadow-sm"
          >
            <span>{step === 3 ? 'Save My Household Profile' : 'Continue'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
