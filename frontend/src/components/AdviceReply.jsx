import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import i18n from '../i18n';
import HowWeWorkedThisOut from './HowWeWorkedThisOut';

const MODE_LABEL_KEYS = {
  'local-guidance': 'advisor.mode_local',
  'safety-guidance': 'advisor.mode_safety',
  'gemini-guidance': 'advisor.mode_gemini'
};

export default function AdviceReply({ advice, mode, language }) {
  const t = i18n.getFixedT(language);
  const responseMode = t(MODE_LABEL_KEYS[mode]);
  return (
    <div className="space-y-3.5 text-xs">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-full border border-[#CCE0D4] bg-[#EAF2ED] px-2 py-1 text-[10px] font-bold text-[#315E48]">
          <CheckCircle2 className="w-3 h-3" />
          {responseMode}
        </span>
        <span className="text-[10px] text-[#56685F]">{t('advisor.educational_notice')}</span>
      </div>

      {mode === 'local-guidance' && language !== 'en' && (
        <p className="rounded-lg border border-[#DFD6CB] bg-[#FAF7F2] px-3 py-2 text-[11px] text-[#53645C]" role="status">
          {t('advisor_notice.local_language')}
        </p>
      )}

      <p className="font-semibold text-sm font-serif-natural text-[#1A2922] leading-relaxed">{advice.summary}</p>

      <div className="space-y-2.5">
        {advice.recommendations.map((recommendation) => (
          <article key={recommendation.id} className="bg-white p-4 rounded-2xl border border-[#E6DED6] space-y-2.5 shadow-2xs">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#3D6B56] shrink-0 mt-0.5" />
              <h3 className="font-bold text-xs text-[#1A2922]">{recommendation.title}</h3>
            </div>
            <p className="text-[#1A2922] font-medium leading-relaxed">{recommendation.action}</p>
            <p className="text-[#53645C] text-[11px] leading-relaxed"><strong className="text-[#1A2922]">{t('advisor.why')}</strong> {recommendation.why}</p>
            <div className="bg-[#FAF7F2] p-2.5 rounded-xl border border-[#DFD6CB] text-xs">
              <strong className="text-[#315E48]">{t('advisor.direct_impact')}</strong>{' '}
              <span className="text-[#1A2922]">{recommendation.impact?.value} — {recommendation.impact?.unit}</span>
            </div>
            {recommendation.assumptions?.length > 0 && (
              <HowWeWorkedThisOut
                title={recommendation.title}
                formula={t('advisor.formula')}
                assumptions={recommendation.assumptions}
                confidence={recommendation.impact?.confidence || 'low'}
                source={t('advisor.source')}
                buttonLabel={t('advisor.limits')}
              />
            )}
          </article>
        ))}
      </div>

      {advice.followUp && (
        <p className="bg-[#FAF7F2] p-3 rounded-xl border border-[#DFD6CB] text-[#53645C] text-xs leading-relaxed">{advice.followUp}</p>
      )}
    </div>
  );
}
