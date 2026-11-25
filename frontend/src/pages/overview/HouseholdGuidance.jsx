import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Compass, Sliders } from 'lucide-react';
import { HOUSEHOLD_PERSONAS, deriveVulnerabilities } from '../../data/householdPersonas';
import { findMatchingPreset, useProfile } from '../../store/profile';

export default function HouseholdGuidance({ onEditProfile }) {
  const { t } = useTranslation();
  const { profile, applyPreset } = useProfile();
  const selectedPersonaId = findMatchingPreset(profile);
  const currentPersona = HOUSEHOLD_PERSONAS.find((persona) => persona.id === selectedPersonaId);
  const vulnerabilities = deriveVulnerabilities(profile);

  return (
    <section className="bg-white rounded-3xl border border-[#E6DED6] p-6 sm:p-8 paper-shadow space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#E6DED6]">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-[#3D6B56]" />
            <h2 className="text-xl font-bold font-serif-natural text-[#18261F]">
              Tailored Guidance for Your Household
            </h2>
          </div>
          <p className="text-xs text-[#56685F] mt-0.5">
            Click a preset to quickly apply, or customize full profile details
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={onEditProfile}
            className="px-3 py-1 text-xs font-semibold rounded-full bg-[#18261F] text-[#FAF7F2] hover:bg-[#2C3E33] transition"
          >
            Edit Full Profile
          </button>
        </div>
      </div>

      {/* Persona Selectors */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {HOUSEHOLD_PERSONAS.map((p) => {
          const isSelected = selectedPersonaId === p.id;
          return (
            <button
              key={p.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => applyPreset(p.id)}
              className={`p-3.5 text-left rounded-2xl transition border flex flex-col justify-between h-full ${
                isSelected
                  ? 'bg-[#FAF7F2] border-2 border-[#18261F] shadow-sm'
                  : 'bg-white border-[#E6DED6] hover:bg-[#FAF7F2]'
              }`}
            >
              <div>
                <div className="text-xl">{p.icon}</div>
                <div className="text-xs font-bold text-[#18261F] mt-2 line-clamp-2 leading-snug">
                  {p.title}
                </div>
              </div>
              <div className="text-[10px] text-[#56685F] mt-1.5 line-clamp-2 leading-relaxed">
                {p.subtitle}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Persona Detail Box */}
      <div className="bg-[#FAF7F2] p-5 rounded-2xl border border-[#DFD6CB] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-2 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-sm text-[#18261F] font-serif-natural">
              {currentPersona?.title || 'Your household'}
            </span>
            <span className="text-[10px] font-mono-code font-bold px-2 py-0.5 rounded-full bg-[#EAF2ED] text-[#3D6B56]">
              {profile.adults} adults, {profile.children} children, {profile.elderly} older adults
            </span>
            <span className="text-[10px] font-mono-code font-bold px-2 py-0.5 rounded-full bg-[#FAF0EC] text-[#A94A28]">
              Commute: {t(`onboarding.fields.commute.${profile.commute}`)}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-semibold text-[#18261F] block">
              Targeted Household Vulnerabilities:
            </span>
            <ul className="text-xs text-[#56685F] space-y-1 list-disc list-inside">
              {vulnerabilities.slice(0, 3).map((v, i) => (
                <li key={i}>{v}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 shrink-0 self-start md:self-center">
          <button
            onClick={onEditProfile}
            className="bg-white border border-[#DDD5C7] text-[#18261F] px-3.5 py-2 rounded-xl text-xs font-semibold hover:bg-[#FAF7F2] transition flex items-center gap-1.5"
          >
            <Sliders className="w-3.5 h-3.5 text-[#3D6B56]" />
            <span>Fine-Tune</span>
          </button>
          <Link
            to="/advisor"
            className="bg-[#18261F] text-[#FAF8F4] px-4 py-2 rounded-xl text-xs font-semibold hover:bg-[#2C3E33] transition flex items-center gap-2"
          >
            <span>Ask Advisor</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
