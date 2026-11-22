import React, { useId, useState } from 'react';
import Modal from './Modal';
import { HelpCircle, X, ShieldAlert, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function HowWeWorkedThisOut({
  title,
  claim,
  formula,
  assumptions = [],
  confidence,
  source,
  buttonLabel = 'How we worked this out',
  className = ''
}) {
  const titleId = useId();
  const [isOpen, setIsOpen] = useState(false);

  // If a claim object is passed, extract properties
  const resolvedAssumptions = claim?.assumptions || assumptions;
  const resolvedConfidence = claim?.confidence || confidence || 'med';
  const resolvedSource = claim?.source !== undefined ? claim.source : source;
  const resolvedFormula = formula || (claim?.value ? `${claim.value} ${claim.unit || ''}` : null);

  const confidenceBadge = {
    high: {
      text: 'High Confidence',
      desc: 'Based on published environmental health literature or standard testing protocols.',
      color: 'bg-[#EAF2ED] text-[#3D6B56] border-[#CCE0D4]',
      icon: CheckCircle2
    },
    med: {
      text: 'Moderate Confidence',
      desc: 'Based on agency emission factors and engineering approximations.',
      color: 'bg-[#FBF5EC] text-[#8C5311] border-[#F2E0C5]',
      icon: AlertTriangle
    },
    low: {
      text: 'Rough Estimate',
      desc: 'Illustrative rule of thumb; requires local sensor validation.',
      color: 'bg-[#FAF0EC] text-[#A94A28] border-[#F2D1C5]',
      icon: ShieldAlert
    }
  }[resolvedConfidence] || {
    text: 'Estimate',
    desc: 'Engineering approximation.',
    color: 'bg-[#FAF7F2] text-[#53645C] border-[#DFD6CB]',
    icon: HelpCircle
  };

  const ConfidenceIcon = confidenceBadge.icon;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center gap-1.5 text-[11px] font-medium text-[#53645C] hover:text-[#1A2922] transition underline decoration-dotted underline-offset-2 ${className}`}
        title="View methodology, formulas, confidence level, and scientific sources"
      >
        <HelpCircle className="w-3.5 h-3.5 text-[#56685F]" />
        <span>{buttonLabel}</span>
      </button>

      {isOpen && (
        <Modal labelledBy={titleId} onClose={() => setIsOpen(false)} overlayClassName="fixed inset-0 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div
            className="bg-[#FAF7F2] w-full max-w-lg rounded-3xl border border-[#DFD6CB] p-6 paper-shadow space-y-4 max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#DFD6CB]">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#56685F] font-bold">
                  Calculation Transparency
                </span>
                <h3 id={titleId} className="text-base font-bold font-serif-natural text-[#1A2922]">
                  {title || 'How We Worked This Out'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-full text-[#56685F] hover:text-[#1A2922] hover:bg-black/5 transition"
                data-initial-focus
                aria-label="Close calculation details"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Confidence Banner */}
            <div className={`p-3.5 rounded-2xl border flex items-start gap-3 ${confidenceBadge.color}`}>
              <ConfidenceIcon className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold font-mono">{confidenceBadge.text}</div>
                <div className="text-[11px] leading-snug mt-0.5 opacity-90">
                  {confidenceBadge.desc}
                </div>
              </div>
            </div>

            {/* Formula / Model */}
            {resolvedFormula && (
              <div className="bg-white p-4 rounded-2xl border border-[#E6DED6] space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#56685F] font-bold block">
                  Formula / Core Metric
                </span>
                <code className="text-xs font-mono font-bold text-[#1A2922] block break-words">
                  {resolvedFormula}
                </code>
              </div>
            )}

            {/* Assumptions */}
            {resolvedAssumptions && resolvedAssumptions.length > 0 && (
              <div className="bg-white p-4 rounded-2xl border border-[#E6DED6] space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#56685F] font-bold block">
                  Underlying Assumptions
                </span>
                <ul className="space-y-1.5 text-xs text-[#53645C]">
                  {resolvedAssumptions.map((assump, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-[#3D6B56] font-bold">•</span>
                      <span>{assump}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Scientific Source / Literature */}
            <div className="bg-white p-4 rounded-2xl border border-[#E6DED6] space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#56685F] font-bold block">
                Source &amp; Verification
              </span>
              {resolvedSource ? (
                <div className="text-xs font-semibold text-[#1A2922] flex items-center gap-1.5">
                  <span>{resolvedSource}</span>
                </div>
              ) : (
                <div className="text-xs text-[#A94A28] font-semibold">
                  Rough estimate — illustrative model without direct published citation.
                </div>
              )}
            </div>

            {/* Dismiss Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-full py-2.5 rounded-xl bg-[#1A2922] text-[#FAF7F2] text-xs font-bold hover:bg-[#2C3E35] transition"
              >
                Close Explanation
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
