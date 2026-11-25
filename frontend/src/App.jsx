import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Atmospheric Data Provider Context & Profile Context
import { AirProvider } from './context/AirContext';
import { ProfileProvider } from './store/profile';
import OnboardingModal from './components/OnboardingModal';
import MaskGuideModal from './components/MaskGuideModal';
import PwaInstallPrompt from './components/PwaInstallPrompt';
import ErrorBoundary from './components/ErrorBoundary';
import { useTranslation } from 'react-i18next';

import OverviewPage from './pages/OverviewPage';

const GlossaryModal = lazy(() => import('./components/GlossaryModal'));
const ShareTodayModal = lazy(() => import('./components/ShareTodayModal'));
const AdvisorPage = lazy(() => import('./pages/AdvisorPage'));
const RoutinesPage = lazy(() => import('./pages/RoutinesPage'));
const HacksPage = lazy(() => import('./pages/HacksPage'));
const CommunityPage = lazy(() => import('./pages/CommunityPage'));
const ImpactPage = lazy(() => import('./pages/ImpactPage'));
const SanctuaryPage = lazy(() => import('./pages/SanctuaryPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

function RouteLoading() {
  const { t } = useTranslation();
  return <div role="status" aria-live="polite" className="py-8 text-center text-sm text-[#56685F]">{t('app.loading_page')}</div>;
}

function TitleWatcher() {
  const { pathname } = useLocation();
  const previousPath = useRef(pathname);

  useEffect(() => {
    const titles = {
      '/': 'Aura — Urban Air Quality & Winter Smog Companion',
      '/overview': 'Aura — Urban Air Quality & Winter Smog Companion',
      '/advisor': 'Aura • Air Quality Advisor',
      '/routines': 'Aura • Hourly Air Quality & Daily Routines',
      '/hacks': 'Aura • Indoor Air and Filtration Guide',
      '/community': 'Aura • Community Support Ideas',
      '/impact': 'Aura • Household Choices Ledger',
      '/home': 'Aura • Air-Quality Illustration',
      '/sanctuary': 'Aura • Air-Quality Illustration'
    };
    document.title = titles[pathname] || 'Aura — Winter Smog Companion';
    if (previousPath.current !== pathname) {
      previousPath.current = pathname;
      document.getElementById('main-content')?.focus({ preventScroll: true });
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  return null;
}

function MainApp() {
  const { pathname } = useLocation();

  // Modal states for guides & sharing
  const [isMaskGuideOpen, setIsMaskGuideOpen] = useState(false);
  const [isGlossaryOpen, setIsGlossaryOpen] = useState(false);
  const [isShareTodayOpen, setIsShareTodayOpen] = useState(false);

  const [fanSpeed, setFanSpeed] = useState('high'); // 'off' | 'low' | 'med' | 'high'
  const [isNightMode, setIsNightMode] = useState(false);
  const [isSoundActive, setIsSoundActive] = useState(false);

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#18261F] flex flex-col font-sans selection:bg-[#EAE1D5] selection:text-[#18261F]">

      <TitleWatcher />

      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <Navbar
        openMaskGuide={() => setIsMaskGuideOpen(true)}
        openGlossary={() => setIsGlossaryOpen(true)}
        openShareToday={() => setIsShareTodayOpen(true)}
      />

      <main id="main-content" tabIndex={-1} className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <ErrorBoundary key={pathname}>
          <Suspense fallback={<RouteLoading />}>
            <Routes>
              <Route path="/" element={<OverviewPage onShare={() => setIsShareTodayOpen(true)} />} />
              <Route path="/overview" element={<Navigate to="/" replace />} />
              <Route path="/advisor" element={<AdvisorPage />} />
              <Route path="/routines" element={<RoutinesPage />} />
              <Route path="/hacks" element={<HacksPage />} />
              <Route path="/community" element={<CommunityPage />} />
              <Route path="/impact" element={<ImpactPage />} />
              <Route path="/home" element={
                <SanctuaryPage
                  fanSpeed={fanSpeed}
                  setFanSpeed={setFanSpeed}
                  isNightMode={isNightMode}
                  setIsNightMode={setIsNightMode}
                  isSoundActive={isSoundActive}
                  setIsSoundActive={setIsSoundActive}
                />
              } />
              <Route path="/sanctuary" element={<Navigate to="/home" replace />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>

      <Footer
        openMaskGuide={() => setIsMaskGuideOpen(true)}
        openGlossary={() => setIsGlossaryOpen(true)}
      />

      <MaskGuideModal
        isOpen={isMaskGuideOpen}
        onClose={() => setIsMaskGuideOpen(false)}
      />
      {isGlossaryOpen && (
        <Suspense fallback={null}>
          <GlossaryModal isOpen onClose={() => setIsGlossaryOpen(false)} />
        </Suspense>
      )}
      {isShareTodayOpen && (
        <Suspense fallback={null}>
          <ShareTodayModal onClose={() => setIsShareTodayOpen(false)} />
        </Suspense>
      )}

      <PwaInstallPrompt />
    </div>
  );
}

export default function App() {
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/health', { signal: controller.signal, cache: 'no-store' }).catch(() => {});
    return () => controller.abort();
  }, []);

  return (
    <BrowserRouter>
      <AirProvider>
        <ProfileProvider>
          <MainApp />
          <OnboardingModal />
        </ProfileProvider>
      </AirProvider>
    </BrowserRouter>
  );
}
