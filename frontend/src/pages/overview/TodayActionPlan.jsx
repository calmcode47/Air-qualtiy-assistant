import React from 'react';
import { useTranslation } from 'react-i18next';
import { Share2, Sliders } from 'lucide-react';

export default function TodayActionPlan({ actionPlan, onShare, onEditProfile }) {
  const { t } = useTranslation();

  return (
    <section className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-serif-natural text-[#18261F]">
            {t('actions.plan_heading', 'Immediate 3-Point Action Plan for Today')}
          </h2>
          <p className="text-xs text-[#56685F]">
            {t('actions.plan_subtitle', 'Practical suggestions based on your household profile and available air-quality data')}
          </p>
        </div>
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={onShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#18261F] text-[#FAF8F4] hover:bg-[#2C3E33] text-xs font-semibold transition shadow-2xs"
            title="Share Today's Air Status Card"
          >
            <Share2 className="w-3.5 h-3.5 text-[#F3C474]" />
            <span>Share Status</span>
          </button>
          <button
            type="button"
            onClick={onEditProfile}
            className="text-xs text-[#3D6B56] hover:underline font-semibold flex items-center gap-1"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Customize Household</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {actionPlan.map((act) => (
          <div
            key={act.step}
            data-testid={`action-step-${act.step}`}
            className="bg-white rounded-3xl border border-[#E6DED6] p-6 paper-shadow flex flex-col justify-between space-y-4 h-full"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span
                  className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono-code font-bold text-xs ${act.numClass}`}
                >
                  {act.step}
                </span>
                <span
                  className={`text-[10px] font-mono-code font-bold px-2 py-0.5 rounded-full ${act.badgeClass}`}
                >
                  {act.phase}
                </span>
              </div>
              <h3
                data-testid={`action-step-title-${act.step}`}
                className="text-base font-bold font-serif-natural text-[#18261F]"
              >
                {act.title}
              </h3>
              <p className="text-xs text-[#56685F] leading-relaxed">
                {act.description}
              </p>
            </div>
            <div className="mt-auto pt-3 border-t border-[#E6DED6] text-[11px] text-[#3D6B56] font-semibold">
              {act.impact}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
