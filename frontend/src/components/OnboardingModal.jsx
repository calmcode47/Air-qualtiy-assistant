import React, { useId, useLayoutEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useProfile } from '../store/profile';
import Modal from './Modal';

const steps = ['people', 'home', 'equipment'];
const people = [['adults', 1], ['children', 0], ['elderly', 0]];
const conditions = ['asthma', 'heart', 'pregnancy'];
const fieldsByStep = {
  home: {
    homeType: ['apartment', 'independent_house', 'floor', 'informal'],
    commute: ['two_wheeler', 'bus_metro', 'car', 'walk', 'cycle', 'wfh'],
    cookingFuel: ['lpg', 'piped_gas', 'electric_induction', 'biomass_wood']
  },
  equipment: {
    purifierOwned: ['none', 'diy', 'portable'],
    monthlyBudgetBand: ['low', 'medium', 'high'],
    preferredLanguage: ['en', 'hi', 'pa']
  }
};

function MemberCount({ label, count, min, onChange, t }) {
  return (
    <div className="min-w-0 rounded-2xl border border-[#E6DED6] bg-white p-2 sm:p-3.5 text-center space-y-1">
      <span className="block text-xs font-bold text-[#56685F]">{label}</span>
      <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2">
        <button
          type="button"
          aria-label={t('onboarding.remove', { label })}
          aria-disabled={count <= min}
          onClick={() => { if (count > min) onChange(count - 1); }}
          className="h-7 w-7 shrink-0 rounded-full border border-[#DFD6CB] bg-[#FAF7F2] text-sm font-bold aria-disabled:opacity-60"
        >
          −
        </button>
        <output className="font-mono font-bold text-[#18261F]">{count}</output>
        <button
          type="button"
          aria-label={t('onboarding.add', { label })}
          aria-disabled={count >= 20}
          onClick={() => { if (count < 20) onChange(count + 1); }}
          className="h-7 w-7 shrink-0 rounded-full border border-[#DFD6CB] bg-[#FAF7F2] text-sm font-bold aria-disabled:opacity-60"
        >
          +
        </button>
      </div>
    </div>
  );
}

function HouseholdForm({ profile, onSave, onClose }) {
  const { t } = useTranslation();
  const titleId = useId();
  const titleRef = useRef(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [draft, setDraft] = useState(profile);
  const step = steps[stepIndex];
  const isLastStep = stepIndex === steps.length - 1;

  useLayoutEffect(() => {
    titleRef.current.focus();
  }, [stepIndex]);

  function changeField(field, value) {
    setDraft((previous) => ({ ...previous, [field]: value }));
  }

  function toggleCondition(condition) {
    setDraft((previous) => {
      const selected = previous.conditions || [];
      return {
        ...previous,
        conditions: selected.includes(condition)
          ? selected.filter((item) => item !== condition)
          : [...selected, condition]
      };
    });
  }

  return (
    <Modal labelledBy={titleId} onClose={onClose} overlayClassName="fixed inset-0 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-lg max-h-[90dvh] overflow-y-auto rounded-3xl border border-[#DFD6CB] bg-[#FAF7F2] p-5 sm:p-7 paper-shadow space-y-6">
        <div className="flex items-start justify-between gap-3 border-b border-[#E6DED6] pb-4">
          <div>
            <p className="font-mono text-xs font-bold text-[#56685F]">
              {t('onboarding.progress', { current: stepIndex + 1, total: steps.length })}
            </p>
            <h2 id={titleId} ref={titleRef} data-initial-focus tabIndex={-1} className="mt-1 text-xl font-serif-natural font-bold text-[#18261F]">
              {t(`onboarding.steps.${step}`)}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="shrink-0 p-1 text-xs text-[#56685F] underline hover:text-[#18261F]">
            {t('onboarding.skip')}
          </button>
        </div>

        {step === 'people' ? (
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-2">
              {people.map(([field, min]) => (
                <MemberCount
                  key={field}
                  label={t(`onboarding.people.${field}`)}
                  count={draft[field]}
                  min={min}
                  onChange={(count) => changeField(field, count)}
                  t={t}
                />
              ))}
            </div>
            <fieldset className="space-y-2">
              <legend className="text-xs font-bold text-[#18261F]">{t('onboarding.conditionsLabel')}</legend>
              <div className="flex flex-wrap gap-2">
                {conditions.map((condition) => (
                  <button
                    key={condition}
                    type="button"
                    aria-pressed={Boolean(draft.conditions?.includes(condition))}
                    onClick={() => toggleCondition(condition)}
                    className="rounded-xl border border-[#E6DED6] bg-white px-3.5 py-2 text-xs font-medium text-[#56685F] aria-pressed:border-[#18261F] aria-pressed:bg-[#18261F] aria-pressed:text-[#FAF7F2]"
                  >
                    {t(`onboarding.conditions.${condition}`)}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(fieldsByStep[step]).map(([field, values]) => (
              <label key={field} className="block space-y-1.5 text-xs font-bold text-[#18261F]">
                <span>{t(`onboarding.fields.${field}.label`)}</span>
                <select
                  value={draft[field]}
                  onChange={(event) => changeField(field, event.target.value)}
                  className="w-full rounded-xl border border-[#DFD6CB] bg-white p-2.5 font-semibold text-[#18261F]"
                >
                  {values.map((value) => (
                    <option key={value} value={value}>{t(`onboarding.fields.${field}.${value}`)}</option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between gap-2 border-t border-[#E6DED6] pt-3">
          {stepIndex > 0 && (
            <button
              type="button"
              onClick={() => setStepIndex(stepIndex - 1)}
              className="flex items-center gap-1.5 rounded-xl border border-[#DFD6CB] px-4 py-2 text-xs font-semibold text-[#18261F]"
            >
              <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
              {t('onboarding.back')}
            </button>
          )}
          <button
            type="button"
            onClick={() => isLastStep ? onSave(draft) : setStepIndex(stepIndex + 1)}
            className="ml-auto flex items-center gap-2 rounded-xl bg-[#18261F] px-5 py-2.5 text-xs font-bold text-[#FAF7F2] shadow-sm hover:bg-[#2B3F35]"
          >
            {t(isLastStep ? 'onboarding.save' : 'onboarding.continue')}
            <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function OnboardingModal() {
  const { i18n } = useTranslation();
  const { profile, updateProfile, isOnboardingOpen, completeOnboarding } = useProfile();
  if (!isOnboardingOpen) return null;

  function saveProfile(draft) {
    updateProfile(draft);
    void i18n.changeLanguage(draft.preferredLanguage);
    completeOnboarding();
  }

  return (
    <HouseholdForm
      profile={{ ...profile, preferredLanguage: i18n.resolvedLanguage || profile.preferredLanguage }}
      onSave={saveProfile}
      onClose={completeOnboarding}
    />
  );
}
