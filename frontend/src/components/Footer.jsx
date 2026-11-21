import React from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldAlert, BookOpen } from 'lucide-react';

export default function Footer({ onNavigate, openMaskGuide, openGlossary }) {
  const { t } = useTranslation();

  return (
    <footer className="bg-[#18261F] text-[#FAF8F4] border-t border-[#2D3E33] mt-16 pt-12 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Safety Medical Notice */}
        <div className="bg-[#24372C] p-4 sm:p-5 rounded-2xl border border-[#3A4F42] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-[#F3C474] shrink-0 mt-0.5" />
            <div className="text-xs text-[#C8D6CE] leading-relaxed">
              <strong className="text-white block mb-0.5">
                {t('footer.safety_title', 'Educational Health & Community Advisory:')}
              </strong>
              {t(
                'footer.safety_text',
                'Aura is designed for exposure avoidance and environmental harm reduction. It is not a clinical diagnostic system. If you or a family member experiences severe breathlessness, chest tightness, or blue lips, seek emergency medical care immediately.'
              )}
            </div>
          </div>
          <div className="shrink-0 bg-[#A94A28] text-white text-[11px] font-bold px-3 py-1.5 rounded-xl font-mono-code">
            {t('footer.emergency_call', 'For emergencies, contact your local emergency service.')}
          </div>
        </div>

        {/* Links & Attribution Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pt-4 text-xs">
          {/* Brand Col */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-white text-[#18261F] flex items-center justify-center font-serif text-sm font-bold">
                e
              </div>
              <span className="font-extrabold text-base font-serif-natural text-white">Aura</span>
            </div>
            <p className="text-[#8E9F94] leading-relaxed text-[11px]">
              {t('app.tagline', 'Breathe Clean Indoors During Winter Smog')}
            </p>
          </div>

          {/* Core Tools */}
          <div className="space-y-2">
            <span className="font-mono-code uppercase font-bold text-white text-[11px] tracking-wider block">
              Core Assistant Tools
            </span>
            <ul className="space-y-1.5 text-[#A6B8AC]">
              <li><button onClick={() => onNavigate('advisor')} className="hover:text-white transition">GenAI Smog Advisor</button></li>
              <li><button onClick={() => onNavigate('routines')} className="hover:text-white transition">Hourly Forecast &amp; Routines</button></li>
              <li><button onClick={() => onNavigate('hacks')} className="hover:text-white transition">Indoor Filtration Guide</button></li>
              <li><button onClick={() => onNavigate('community')} className="hover:text-white transition">Community Action Ideas</button></li>
              <li><button onClick={() => onNavigate('impact')} className="hover:text-white transition">Household Choices Log</button></li>
            </ul>
          </div>

          {/* Guides & Plain Language Glossary */}
          <div className="space-y-2">
            <span className="font-mono-code uppercase font-bold text-white text-[11px] tracking-wider block">
              Guides &amp; Explanations
            </span>
            <ul className="space-y-1.5 text-[#A6B8AC]">
              {openMaskGuide && (
                <li>
                  <button onClick={openMaskGuide} className="hover:text-white text-[#F3C474] font-semibold transition flex items-center gap-1">
                    <span>😷</span>
                    <span>{t('mask_guide.nav_link', 'Mask Guide (N95 / FFP2)')}</span>
                  </button>
                </li>
              )}
              {openGlossary && (
                <li>
                  <button onClick={openGlossary} className="hover:text-white text-[#F3C474] font-semibold transition flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>{t('glossary.nav_link', 'Smog & Inversion Glossary')}</span>
                  </button>
                </li>
              )}
              <li><a className="hover:text-white underline" href="https://open-meteo.com/en/docs/air-quality-api" target="_blank" rel="noreferrer">Open-Meteo Air Quality API</a> (model data)</li>
              <li><a className="hover:text-white underline" href="https://atmosphere.copernicus.eu/" target="_blank" rel="noreferrer">Copernicus CAMS / CAMS ENSEMBLE</a> (forecast models)</li>
              <li><a className="hover:text-white underline" href="https://www.epa.gov/indoor-air-quality-iaq/guide-air-cleaners-home" target="_blank" rel="noreferrer">US EPA Guide to Air Cleaners in the Home</a></li>
            </ul>
          </div>

          {/* Project Details */}
          <div className="space-y-2">
            <span className="font-mono-code uppercase font-bold text-white text-[11px] tracking-wider block">
              Open Science &amp; Data
            </span>
            <p className="text-[#8E9F94] leading-relaxed text-[11px]">
              Location-based forecasts and practical steps for households planning around urban air pollution.
            </p>
            <div className="pt-1 text-[#8E9F94] text-[11px]">
              {t('footer.built_with', 'Built for urban clean air equity and scientific transparency.')}
            </div>
          </div>
        </div>

        {/* Bottom copyright line */}
        <div className="pt-6 border-t border-[#2D3E33] flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-[#7A8E82] font-mono-code">
          <div>© Aura — Natural Urban Air Quality &amp; Winter Smog Companion</div>
          <div>Indo-Gangetic Basin • Punjab Plain • Wasatch Bowl • Northern Plain</div>
        </div>

      </div>
    </footer>
  );
}
