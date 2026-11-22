import React, { useId } from 'react';
import Modal from './Modal';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';

export default function GlossaryModal({ isOpen, onClose }) {
  const titleId = useId();
  const { t } = useTranslation();
  if (!isOpen) return null;

  const glossaryItems = [
    {
      title: t('glossary.aqi_title', 'AQI (Air Quality Index)'),
      desc: t('glossary.aqi_desc', 'The US AQI is a 0–500 index with six health-concern categories, from Good through Hazardous.')
    },
    {
      title: t('glossary.pm25_title', 'PM2.5 (Fine Particulate Matter)'),
      desc: t('glossary.pm25_desc', 'Fine particles with an aerodynamic diameter of 2.5 micrometers or less. They can be inhaled into the respiratory system; health effects depend on exposure and individual factors.')
    },
    {
      title: t('glossary.inversion_title', 'Thermal Inversion'),
      desc: t('glossary.inversion_desc', 'A winter weather condition where a layer of warm air sits above cold ground air, trapping smoke, exhaust, and dust like a giant lid.')
    },
    {
      title: t('glossary.convective_mixing_title', 'Vertical Mixing'),
      desc: t('glossary.convective_mixing_desc', 'Sunlight can heat the ground and promote vertical mixing, but pollution varies by day and place. An hourly forecast may show relative changes; it cannot identify a guaranteed safe time or a street-level condition.')
    },
    {
      title: t('glossary.cadr_title', 'CADR (Clean Air Delivery Rate)'),
      desc: t('glossary.cadr_desc', 'The volume of filtered, clean air an air purifier delivers per hour, measured in cubic meters per hour (m³/h). Higher CADR cleans a room faster.')
    },
    {
      title: t('glossary.corsi_title', 'Corsi-Rosenthal Box'),
      desc: t('glossary.corsi_desc', 'A do-it-yourself air cleaner concept using a box fan and particle filters. Performance, safety, sound, and cost depend on the exact fan, filters, build, room, and local prices. Follow current safety guidance.')
    }
  ];

  return (
    <Modal labelledBy={titleId} onClose={onClose} overlayClassName="fixed inset-0 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
      <div className="bg-[#FAF7F2] rounded-3xl border border-[#DDD5C7] max-w-2xl w-full p-6 sm:p-8 paper-shadow max-h-[90vh] overflow-y-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-[#E6DED6] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#EAF2ED] text-[#3D6B56] border border-[#CCE0D4] flex items-center justify-center font-bold text-lg">
              📖
            </div>
            <div>
              <h2 id={titleId} className="text-xl font-bold font-serif-natural text-[#18261F]">
                {t('glossary.title', 'Air Quality & Inversion Glossary')}
              </h2>
              <p className="text-xs text-[#56685F]">
                {t('glossary.subtitle', 'Plain explanations of environmental and air purification science')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#EAE4D8] text-[#56685F] transition"
            data-initial-focus
            aria-label="Close glossary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Glossary items */}
        <div className="space-y-3">
          {glossaryItems.map((item, idx) => (
            <div key={idx} className="bg-white p-4 rounded-2xl border border-[#E6DED6] space-y-1">
              <h3 className="text-sm font-bold font-serif-natural text-[#18261F]">
                {item.title}
              </h3>
              <p className="text-xs text-[#56685F] leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        <div className="text-center pt-2">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#18261F] text-[#FAF8F4] font-semibold text-xs hover:bg-[#2C3E33] transition"
          >
            Close Glossary
          </button>
        </div>
      </div>
    </Modal>
  );
}
