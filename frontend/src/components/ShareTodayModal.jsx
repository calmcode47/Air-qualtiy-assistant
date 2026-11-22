import React, { useId, useRef, useState, useEffect, useMemo } from 'react';
import Modal from './Modal';
import { Share2, Download, X, Copy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { drawShareCard } from '../utils/drawShareCard';

const EMPTY_PLAN = [];
const DEFAULT_ACTIONS = [
  'Check local air-quality advice before strenuous outdoor activity',
  'Reduce indoor particle sources and use suitable mechanical filtration if available',
  'Combine errands or share trips when practical; avoid idling'
];

export default function ShareTodayModal({
  isOpen,
  onClose,
  cityData = {},
  outdoorAqi = null,
  actionPlan = EMPTY_PLAN
}) {
  const titleId = useId();
  const { i18n } = useTranslation();
  const canvasRef = useRef(null);
  const [feedback, setFeedback] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [aspectRatio, setAspectRatio] = useState('3:4'); // '3:4' (1080x1440) or '9:16' (1080x1920)

  const cityName = cityData?.name || 'Local Area';
  const category = cityData?.category || 'Unavailable';
  const aqiSystem = cityData?.aqiSystem || 'US AQI';
  const readingNote = cityData?.isLive
    ? 'Open-Meteo model estimate · not street-level'
    : cityData?.isCached
      ? `Cached estimate · ${cityData.staleHours || 'unknown'}h old`
      : 'Air-quality reading unavailable';
  const lowerWindow = cityData?.isLive && cityData?.cleanestWindow
    ? cityData.cleanestWindow
    : 'No live lower-pollution forecast available';

  const actions = useMemo(() => {
    const titles = actionPlan.slice(0, 3).map((action) => action.title || action.instruction || action);
    return titles.length ? titles : DEFAULT_ACTIONS;
  }, [actionPlan]);

  // Render canvas card when opened or aspect ratio toggled
  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    drawShareCard(canvas, {
      cityName, outdoorAqi, category, aqiSystem, readingNote, lowerWindow, actions, aspectRatio,
      language: i18n.resolvedLanguage
    });
  }, [isOpen, cityName, outdoorAqi, category, aqiSystem, readingNote, lowerWindow, actions, aspectRatio, i18n.resolvedLanguage]);

  if (!isOpen) return null;

  const title = `Aura air-quality update for ${cityName}`;
  const filename = `aura-air-status-${cityName.toLowerCase().replace(/[^\p{Letter}\p{Number}]+/gu, '-')}.png`;
  const summary = [
    `${title}. ${aqiSystem} ${outdoorAqi ?? 'unavailable'} (${category}).`,
    readingNote,
    `Lower forecast period: ${lowerWindow}.`,
    ...actions.map((action, index) => `${index + 1}. ${action}`),
    'Educational information from Aura. Check current local guidance for time-sensitive decisions.'
  ].join('\n');

  function close() {
    setFeedback('');
    onClose();
  }

  function download() {
    const image = canvasRef.current.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = filename;
    link.href = image;
    link.click();
  }

  function handleDownload() {
    try {
      download();
      setFeedback('');
    } catch {
      setFeedback('The image could not be saved. Try copying the text summary.');
    }
  }

  async function handleShare() {
    if (!navigator.share) {
      handleDownload();
      return;
    }
    setIsSharing(true);
    setFeedback('');
    try {
      const data = { title, text: summary };
      if (navigator.canShare) {
        const encoded = canvasRef.current.toDataURL('image/png').split(',')[1];
        const bytes = Uint8Array.from(atob(encoded), (character) => character.charCodeAt(0));
        const file = new File([bytes], filename, { type: 'image/png' });
        if (navigator.canShare({ files: [file] })) data.files = [file];
      }
      await navigator.share(data);
    } catch (error) {
      if (error?.name !== 'AbortError') {
        setFeedback('Sharing is unavailable. You can save the image or copy the text summary.');
      }
    } finally {
      setIsSharing(false);
    }
  }

  async function handleCopyText() {
    try {
      await navigator.clipboard.writeText(summary);
      setFeedback('Summary copied to clipboard.');
    } catch {
      setFeedback('Clipboard access is unavailable. You can save the image instead.');
    }
  }

  return (
    <Modal labelledBy={titleId} onClose={close} overlayClassName="fixed inset-0 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-[#FAF7F2] rounded-3xl border border-[#DDD5C7] max-w-lg w-full p-6 paper-shadow max-h-[92vh] overflow-y-auto space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between gap-4 border-b border-[#E6DED6] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#18261F] text-[#FAF8F4] flex items-center justify-center font-bold">
              <Share2 className="w-4 h-4 text-[#8AB394]" />
            </div>
            <div>
              <h3 id={titleId} className="text-base font-bold font-serif-natural text-[#18261F]">
                Share Today's Air Status
              </h3>
              <p className="text-[11px] text-[#56685F]">
                Story and WhatsApp status card with today's action plan
              </p>
            </div>
          </div>
          <button
            onClick={close}
            className="p-1 rounded-full hover:bg-[#EAE4D8] text-[#56685F] transition"
            data-initial-focus
            aria-label="Close share dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Aspect Ratio Switcher (Prompt 14 Task 1) */}
        <div className="flex items-center justify-between gap-2 bg-[#EFECE3] p-1 rounded-2xl border border-[#DFD8CC] text-xs">
          <button
            type="button"
            aria-pressed={aspectRatio === '3:4'}
            data-testid="share-ratio-3-4"
            onClick={() => setAspectRatio('3:4')}
            className={`flex-1 py-1.5 px-3 rounded-xl font-bold transition flex items-center justify-center gap-1.5 ${
              aspectRatio === '3:4'
                ? 'bg-[#18261F] text-[#FAF8F4] shadow-xs'
                : 'text-[#56685F] hover:text-[#18261F]'
            }`}
          >
            <span>3:4 Standard (1080 × 1440)</span>
          </button>
          <button
            type="button"
            aria-pressed={aspectRatio === '9:16'}
            data-testid="share-ratio-9-16"
            onClick={() => setAspectRatio('9:16')}
            className={`flex-1 py-1.5 px-3 rounded-xl font-bold transition flex items-center justify-center gap-1.5 ${
              aspectRatio === '9:16'
                ? 'bg-[#18261F] text-[#FAF8F4] shadow-xs'
                : 'text-[#56685F] hover:text-[#18261F]'
            }`}
          >
            <span>9:16 Story / Status (1080 × 1920)</span>
          </button>
        </div>

        {/* Canvas Card Preview */}
        <div className="relative rounded-2xl overflow-hidden border border-[#DFD8CC] shadow-inner bg-[#18261F] flex items-center justify-center">
          <canvas
            aria-label={title}
            role="img"
            ref={canvasRef}
            className="w-full h-auto max-h-[420px] object-contain rounded-2xl block"
          />
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleShare}
              disabled={isSharing}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-[#18261F] text-[#FAF8F4] hover:bg-[#2C3E33] transition shadow-xs"
            >
              <Share2 className="w-3.5 h-3.5 text-[#F3C474]" />
              <span>Share to Apps</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-white border border-[#DDD5C7] text-[#18261F] hover:bg-[#FAF7F2] transition shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-[#3D6B56]" />
              <span>Save Image</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopyText}
            className="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-[#EFECE3] hover:bg-[#E4DFD3] text-[#56685F] transition flex items-center justify-center gap-1.5"
          >
            <Copy aria-hidden="true" className="w-3.5 h-3.5" />
            <span>Copy text summary</span>
          </button>
          <p role="status" className="text-xs text-[#56685F]">{feedback}</p>
        </div>
      </div>
    </Modal>
  );
}
