import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Track visit count (Prompt 8 Task 2: show only after 2nd+ visit)
    let count = 0;
    try {
      count = Number(localStorage.getItem('aura_visit_count') || 0) + 1;
      localStorage.setItem('aura_visit_count', String(count));
    } catch (e) {
      count = 2; // fallback if localStorage blocked
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (count >= 2) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  if (!showPrompt || !deferredPrompt) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 max-w-sm w-full bg-[#18261F] text-[#FAF8F4] p-4 rounded-2xl border border-[#3A4F42] shadow-xl flex items-center justify-between gap-3 animate-in slide-in-from-bottom-2">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#24372C] flex items-center justify-center text-[#688A72] shrink-0 border border-[#3A4F42]">
          <Smartphone className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xs font-bold text-white">Install Aura App</div>
          <div className="text-[11px] text-[#A6BCB0] leading-tight">
            Fast offline access during winter smog
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleInstall}
          className="bg-[#FAF7F2] text-[#18261F] hover:bg-white text-xs font-bold px-3 py-1.5 rounded-xl transition shadow-xs"
        >
          Install
        </button>
        <button
          type="button"
          onClick={() => setShowPrompt(false)}
          className="text-[#A6BCB0] hover:text-white p-1 rounded transition"
          aria-label="Dismiss install prompt"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
