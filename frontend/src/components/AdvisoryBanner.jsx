import React, { useState } from 'react';
import { Clock, WifiOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function AdvisoryBanner({ isOffline, isCached, isStale, staleHours, cityData }) {
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);
  const { t } = useTranslation();

  return (
    <>
      {!isBannerDismissed && (
        <div className="bg-[#18261F] text-[#F4F2EC] px-4 py-1.5 text-xs font-medium">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1.5">
            <div className="flex items-center gap-2">
              {isOffline && isCached ? (
                <span className="flex items-center gap-1.5 text-[#F3C474] font-semibold text-[11px]">
                  <WifiOff className="w-3.5 h-3.5 fill-[#D18820] text-[#18261F]" />
                  {t('advisory_banner.offline_saved')}
                </span>
              ) : (isStale || isCached) ? (
                <span className="flex items-center gap-1.5 text-[#F3C474] font-semibold text-[11px]">
                  <Clock className="w-3.5 h-3.5 fill-[#D18820] text-[#18261F]" />
                  {isStale
                    ? t('advisory_banner.stale_cached', { hours: staleHours })
                    : t('advisory_banner.cached')}
                </span>
              ) : isOffline ? (
                <span className="flex items-center gap-1.5 text-[#F3C474] font-semibold text-[11px]">
                  <WifiOff className="w-3.5 h-3.5" />
                  {t('advisory_banner.offline_no_reading')}
                </span>
              ) : (
                <span className="text-[11px] text-[#D8E4DC]">
                  {cityData.isLive
                    ? t('advisory_banner.model_estimate')
                    : t('advisory_banner.unavailable')}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-[11px] text-[#A6BCB0] font-mono-code">
              <span>
                {t('hero.cleanest_window')}: <strong className="text-[#8AB394]">
                  {cityData.cleanestWindow || t('advisory_banner.unavailable_value')}
                </strong>
              </span>
              <span className="hidden md:inline">•</span>
              <span className="hidden md:inline">{t('advisory_banner.educational_health_tool')}</span>
              <button
                type="button"
                onClick={() => setIsBannerDismissed(true)}
                className="ml-2 text-[#A6BCB0] hover:text-white p-0.5 rounded transition"
                title={t('advisory_banner.dismiss')}
                aria-label={t('advisory_banner.dismiss')}
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
