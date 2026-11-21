import React, { useRef, useState, useEffect } from 'react';
import { Share2, Download, Check, X, Copy, Image as ImageIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function ShareTodayModal({
  isOpen,
  onClose,
  cityData = {},
  outdoorAqi = null,
  actionPlan = []
}) {
  const { t, i18n } = useTranslation();
  const canvasRef = useRef(null);
  const [dataUrl, setDataUrl] = useState('');
  const [isCopied, setIsCopied] = useState(false);
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

  const defaultActions = [
    'Check local air-quality advice before strenuous outdoor activity',
    'Reduce indoor particle sources and use suitable mechanical filtration if available',
    'Combine errands or share trips when practical; avoid idling'
  ];

  const actions = actionPlan?.length > 0
    ? actionPlan.slice(0, 3).map((a) => a.title || a.instruction || a)
    : defaultActions;

  // Render canvas card when opened or aspect ratio toggled
  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = 1080;
    const isStory = aspectRatio === '9:16';
    const height = isStory ? 1920 : 1440;

    canvas.width = width;
    canvas.height = height;

    // 1. Background
    ctx.fillStyle = '#18261F';
    ctx.fillRect(0, 0, width, height);

    // Subtle atmospheric ambient radial gradients
    const grad1 = ctx.createRadialGradient(width / 2, isStory ? 340 : 260, 50, width / 2, isStory ? 340 : 260, isStory ? 600 : 480);
    grad1.addColorStop(0, 'rgba(169, 74, 40, 0.22)');
    grad1.addColorStop(1, 'rgba(24, 38, 31, 0)');
    ctx.fillStyle = grad1;
    ctx.fillRect(0, 0, width, height);

    // 2. Top Header Brand
    ctx.fillStyle = '#FAF8F4';
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('AURA • AIR QUALITY UPDATE', 80, isStory ? 130 : 110);

    const todayStr = new Date().toLocaleDateString(i18n.language || 'en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    ctx.fillStyle = '#A6BCB0';
    ctx.font = '26px sans-serif';
    ctx.fillText(`${cityName} • ${todayStr}`, 80, isStory ? 180 : 155);

    // 3. AQI Hero Card
    const heroY = isStory ? 230 : 200;
    const heroH = isStory ? 310 : 280;
    ctx.fillStyle = '#22332A';
    roundRect(ctx, 80, heroY, width - 160, heroH, 24);
    ctx.fill();
    ctx.strokeStyle = '#32473B';
    ctx.lineWidth = 3;
    ctx.stroke();

    // AQI Number
    ctx.fillStyle = '#F3C474';
    ctx.font = 'bold 120px monospace';
    ctx.fillText(outdoorAqi == null ? '—' : String(outdoorAqi), 130, heroY + 160);

    // Index scale and data currency
    ctx.fillStyle = '#FAF8F4';
    ctx.font = 'bold 34px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans Devanagari", "Noto Sans Gurmukhi", sans-serif';
    wrapText(ctx, `${aqiSystem}: ${category}`, 420, heroY + 100, width - 560, 38, 2);

    ctx.fillStyle = '#D8E4DC';
    ctx.font = '26px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans Devanagari", "Noto Sans Gurmukhi", sans-serif';
    ctx.fillText(readingNote, 420, heroY + 160);
    ctx.fillText(`Lower forecast period: ${lowerWindow}`, 420, heroY + 210);

    // 4. Action Plan Section
    const actionsHeadingY = isStory ? 600 : 540;
    ctx.fillStyle = '#FAF8F4';
    ctx.font = 'bold 36px serif';
    ctx.fillText('Practical actions to consider:', 80, actionsHeadingY);

    // Action Items
    const cardSpacing = isStory ? 320 : 230;
    const cardHeight = isStory ? 280 : 195;
    const cardStartY = actionsHeadingY + 40;

    actions.forEach((act, idx) => {
      const cardY = cardStartY + idx * cardSpacing;

      // Card Background
      ctx.fillStyle = '#FAF7F2';
      roundRect(ctx, 80, cardY, width - 160, cardHeight, 20);
      ctx.fill();

      // Number Badge
      ctx.fillStyle = '#18261F';
      roundRect(ctx, 115, cardY + 35, 50, 50, 12);
      ctx.fill();
      ctx.fillStyle = '#FAF8F4';
      ctx.font = 'bold 28px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(String(idx + 1), 140, cardY + 70);

      // Text Action with multilingual safe word wrap
      ctx.textAlign = 'left';
      ctx.fillStyle = '#18261F';
      ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans Devanagari", "Noto Sans Gurmukhi", sans-serif';
      wrapText(ctx, act, 195, cardY + 65, width - 340, 42, isStory ? 4 : 3);
    });

    // 5. Footer Branding & Disclaimer
    const footerY1 = isStory ? 1800 : 1340;
    const footerY2 = isStory ? 1845 : 1380;
    ctx.fillStyle = '#A6BCB0';
    ctx.font = '24px sans-serif';
    ctx.fillText('Generated by Aura — Open Science Winter Smog Companion', 80, footerY1);
    ctx.fillStyle = '#8AB394';
    ctx.font = '20px sans-serif';
    ctx.fillText('Educational information · check current local guidance', 80, footerY2);

    try {
      setDataUrl(canvas.toDataURL('image/png'));
    } catch (e) {}
  }, [isOpen, cityName, outdoorAqi, category, aqiSystem, readingNote, lowerWindow, actions, aspectRatio, i18n.language]);

  if (!isOpen) return null;

  const handleShare = async () => {
    setIsSharing(true);
    const summaryText = `Air-quality update for ${cityName}: ${aqiSystem} ${outdoorAqi == null ? 'unavailable' : outdoorAqi} (${category}). ${readingNote}. Lower forecast period: ${lowerWindow}. Check current local advice before making time-sensitive decisions.`;

    try {
      const canvas = canvasRef.current;
      if (canvas && navigator.share && navigator.canShare) {
        canvas.toBlob(async (blob) => {
          if (!blob) return;
          const file = new File([blob], `aura-air-status-${cityName.toLowerCase().replace(/\s+/g, '-')}.png`, {
            type: 'image/png'
          });

          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: `Aura — Air Quality Status for ${cityName}`,
              text: summaryText,
              files: [file]
            });
            return;
          }
        });
      } else if (navigator.share) {
        await navigator.share({
          title: `Aura — Air Quality Status for ${cityName}`,
          text: summaryText
        });
      } else {
        handleDownload();
      }
    } catch (e) {
      handleDownload();
    } finally {
      setIsSharing(false);
    }
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement('a');
    a.download = `aura-air-status-${cityName.toLowerCase().replace(/\s+/g, '-')}.png`;
    a.href = canvas.toDataURL('image/png');
    a.click();
  };

  const handleCopyText = () => {
    const text = `Air-quality update for ${cityName}: ${aqiSystem} ${outdoorAqi == null ? 'unavailable' : outdoorAqi} (${category}).\n${readingNote}.\nLower forecast period: ${lowerWindow}.\n1. ${actions[0]}\n2. ${actions[1]}\n3. ${actions[2]}\nEducational information from Aura; check current local advice.`;
    navigator.clipboard?.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-[#FAF7F2] rounded-3xl border border-[#DDD5C7] max-w-lg w-full p-6 paper-shadow max-h-[92vh] overflow-y-auto space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between gap-4 border-b border-[#E6DED6] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#18261F] text-[#FAF8F4] flex items-center justify-center font-bold">
              <Share2 className="w-4 h-4 text-[#8AB394]" />
            </div>
            <div>
              <h3 className="text-base font-bold font-serif-natural text-[#18261F]">
                Share Today's Air Status
              </h3>
              <p className="text-[11px] text-[#56685F]">
                Story and WhatsApp status card with today's action plan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-[#EAE4D8] text-[#56685F] transition"
            aria-label="Close share dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Aspect Ratio Switcher (Prompt 14 Task 1) */}
        <div className="flex items-center justify-between gap-2 bg-[#EFECE3] p-1 rounded-2xl border border-[#DFD8CC] text-xs">
          <button
            type="button"
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
            {isCopied ? <Check className="w-3.5 h-3.5 text-[#3D6B56]" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{isCopied ? 'Summary copied to clipboard!' : 'Copy text summary'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}

// Canvas helper functions
function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 3) {
  if (!text) return;
  const words = String(text).split(/\s+/);
  let line = "";
  let lineCount = 0;

  for (let n = 0; n < words.length; n++) {
    const testLine = line ? line + " " + words[n] : words[n];
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && line) {
      ctx.fillText(line, x, y);
      line = words[n];
      y += lineHeight;
      lineCount++;
      if (lineCount >= maxLines - 1 && n < words.length - 1) {
        let remaining = line;
        while (n + 1 < words.length && ctx.measureText(remaining + " " + words[n + 1] + "...").width <= maxWidth) {
          n++;
          remaining += " " + words[n];
        }
        ctx.fillText(remaining + "...", x, y);
        return;
      }
    } else {
      line = testLine;
    }
  }
  if (line) {
    ctx.fillText(line, x, y);
  }
}
