import React, { useId } from 'react';
import Modal from './Modal';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Check, AlertTriangle, X, Info, ExternalLink } from 'lucide-react';

export default function MaskGuideModal({ isOpen, onClose }) {
  const titleId = useId();
  const { t } = useTranslation();
  if (!isOpen) return null;

  const fitTips = [
    t('mask_guide.fit_tips.0', 'Choose a genuine particulate respirator certified by the authority in your country.'),
    t('mask_guide.fit_tips.1', 'Follow the manufacturer instructions for putting it on and positioning the nosepiece and straps.'),
    t('mask_guide.fit_tips.2', 'Check the fit each time using the instructions supplied with the respirator; gaps let unfiltered air in.'),
    t('mask_guide.fit_tips.3', 'Facial hair or anything else crossing the sealing surface can interfere with the seal.')
  ];

  return (
    <Modal labelledBy={titleId} onClose={onClose} overlayClassName="fixed inset-0 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
      <div className="bg-[#FAF7F2] rounded-3xl border border-[#DDD5C7] max-w-2xl w-full p-6 sm:p-8 paper-shadow max-h-[90vh] overflow-y-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-[#E6DED6] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#EAF2ED] text-[#3D6B56] border border-[#CCE0D4] flex items-center justify-center font-bold text-lg">
              😷
            </div>
            <div>
              <h2 id={titleId} className="text-xl font-bold font-serif-natural text-[#18261F]">
                {t('mask_guide.title', 'Respirator guide for particle pollution')}
              </h2>
              <p className="text-xs text-[#56685F]">
                {t('mask_guide.subtitle', 'Fit, limits, and local certification matter when choosing a particulate respirator.')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#EAE4D8] text-[#56685F] transition"
            data-initial-focus
            aria-label="Close mask guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section 1: Which Mask */}
        <div className="bg-white p-5 rounded-2xl border border-[#E6DED6] space-y-2">
          <h3 className="text-sm font-bold font-serif-natural text-[#18261F] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#3D6B56]" />
            <span>{t('mask_guide.which_mask', 'Choosing a respirator')}</span>
          </h3>
          <p className="text-xs text-[#56685F] leading-relaxed">
            {t('mask_guide.which_mask_desc', 'A properly fitting particulate respirator certified by a recognized authority can reduce exposure to particles. Choose one that fits closely and follow its instructions; masks and respirators differ by model and certification.')}
          </p>
        </div>

        {/* Section 2: Fit Tips */}
        <div className="bg-white p-5 rounded-2xl border border-[#E6DED6] space-y-3">
          <h3 className="text-sm font-bold font-serif-natural text-[#18261F] flex items-center gap-2">
            <Check className="w-4 h-4 text-[#3D6B56]" />
            <span>{t('mask_guide.fit_title', 'Fit and use')}</span>
          </h3>
          <ul className="text-xs text-[#56685F] space-y-2">
            {fitTips.map((tip, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-[#EAF2ED] text-[#3D6B56] flex items-center justify-center font-mono-code text-[10px] shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Section 3: Honest Limits */}
        <div className="bg-[#FAF0EC] p-4 rounded-2xl border border-[#F2D1C5] space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-[#A94A28]">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{t('mask_guide.limits_title', 'Important limits')}</span>
          </div>
          <p className="text-xs text-[#56685F] leading-relaxed">
            {t('mask_guide.limits_desc', 'Particulate respirators filter particles, not gases, and do not supply oxygen. Wearing one can make breathing harder. People with heart or lung conditions should seek advice from a healthcare professional. Reduce outdoor exposure and follow local public-health guidance.')}
          </p>
        </div>

        {/* Section 4: Pediatric sizing */}
        <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#DFD6CB] space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-[#18261F]">
            <Info className="w-4 h-4 text-[#3D6B56] shrink-0" />
            <span>{t('mask_guide.pediatric_title', 'Children and fit')}</span>
          </div>
          <p className="text-xs text-[#56685F] leading-relaxed">
            {t('mask_guide.pediatric_desc', 'Fit and suitability depend on the child, product, and local guidance. A poorly fitting or uncomfortable respirator may not be worn correctly. Check current advice for children; do not assume an adult size will fit.')}
          </p>
        </div>

        <a className="inline-flex items-center gap-1.5 text-xs text-[#315E48] underline" href="https://www.cdc.gov/niosh/ppe/php/community-respirators-masks/" target="_blank" rel="noreferrer">
          {t('mask_guide.source_link', 'CDC / NIOSH community respirator guidance')} <ExternalLink className="w-3 h-3" aria-hidden="true" />
        </a>

        <div className="text-center pt-2">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#18261F] text-[#FAF8F4] font-semibold text-xs hover:bg-[#2C3E33] transition"
          >
            Got it, close guide
          </button>
        </div>
      </div>
    </Modal>
  );
}
