import React from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Radio } from 'lucide-react';

function formatObservedAt(value, language) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return value;
  return new Intl.DateTimeFormat(language, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function safeAttributionUrl(value) {
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

export default function GroundStationCard({ station }) {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage || 'en';

  return (
    <section
      aria-labelledby="ground-station-title"
      className="rounded-3xl border border-[#D9E2DA] bg-[#F2F6F2] p-5 sm:p-6"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#CCE0D4] bg-white text-[#315E48]">
          <Radio className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <h2 id="ground-station-title" className="font-serif-natural text-lg font-bold text-[#18261F]">
              {t('ground_station.title')}
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-[#53645C]">
              {t('ground_station.description')}
            </p>
          </div>

          {station?.status === 'loading' && (
            <p role="status" className="text-sm text-[#53645C]">{t('ground_station.loading')}</p>
          )}
          {station?.status === 'unsupported_region' && (
            <p className="rounded-xl border border-[#DFD6CB] bg-white px-3 py-2 text-sm text-[#53645C]">
              {t('ground_station.unsupported_region')}
            </p>
          )}
          {station?.status === 'no_station' && (
            <p className="rounded-xl border border-[#DFD6CB] bg-white px-3 py-2 text-sm text-[#53645C]">
              {t('ground_station.no_station', { radius: station.radiusKm })}
            </p>
          )}
          {station?.status === 'no_recent_measurements' && (
            <p className="rounded-xl border border-[#DFD6CB] bg-white px-3 py-2 text-sm text-[#53645C]">
              {t('ground_station.no_measurements')}
            </p>
          )}
          {station?.status === 'unavailable' && (
            <p className="rounded-xl border border-[#DFD6CB] bg-white px-3 py-2 text-sm text-[#53645C]">
              {t('ground_station.unavailable')}
            </p>
          )}

          {station?.status === 'available' && (
            <div className="space-y-3 rounded-2xl border border-[#DFD6CB] bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-sm text-[#18261F]">{station.locationName}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-[11px] text-[#56685F]">
                    <MapPin className="h-3 w-3" aria-hidden="true" />
                    {t('ground_station.distance', { distance: station.distanceKm })}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 text-right">
                  <a
                    className="text-xs font-semibold text-[#315E48] underline"
                    href={safeAttributionUrl(station.sourceUrl) || 'https://www.data.gov.in/resource/real-time-air-quality-index-various-locations'}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t('ground_station.cpcb_source')}
                  </a>
                  {safeAttributionUrl(station.mirrorUrl) && (
                    <a className="text-[10px] text-[#53645C] underline" href={safeAttributionUrl(station.mirrorUrl)} target="_blank" rel="noreferrer">
                      {t('ground_station.feed_mirror')}
                    </a>
                  )}
                </div>
              </div>

              <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {station.measurements.map((measurement) => (
                  <div key={measurement.parameter} className="rounded-xl bg-[#F2F6F2] px-3 py-2">
                    <dt className="text-[10px] font-bold uppercase tracking-wide text-[#56685F]">
                      {t('ground_station.reported_average', { parameter: measurement.parameter })}
                    </dt>
                    <dd className="mt-0.5 font-mono-code text-xl font-bold text-[#18261F]">
                      {measurement.value}{measurement.unit ? ` ${measurement.unit}` : ''}
                    </dd>
                    <dd className="text-[10px] text-[#56685F]">
                      {t('ground_station.reported', { time: formatObservedAt(measurement.observedAt, language) })}
                    </dd>
                  </div>
                ))}
              </dl>

              <p className="text-[10px] text-[#56685F]">
                {t('ground_station.source_credit')} {station.source || 'CPCB via data.gov.in'} · {station.license || t('ground_station.license')}
              </p>
            </div>
          )}

          <p className="text-[11px] leading-relaxed text-[#53645C]">
            {t('ground_station.caution')}
          </p>
        </div>
      </div>
    </section>
  );
}
