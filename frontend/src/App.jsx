import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Atmospheric Data Provider Context & Profile Context
import { AirProvider, useAir } from './context/AirContext';
import { ProfileProvider, useProfile } from './store/profile';
import OnboardingModal from './components/OnboardingModal';
import MaskGuideModal from './components/MaskGuideModal';
import GlossaryModal from './components/GlossaryModal';
import ShareTodayModal from './components/ShareTodayModal';
import PwaInstallPrompt from './components/PwaInstallPrompt';
import ErrorBoundary from './components/ErrorBoundary';

// Full Pages
import OverviewPage from './pages/OverviewPage';
import AdvisorPage from './pages/AdvisorPage';
import RoutinesPage from './pages/RoutinesPage';
import HacksPage from './pages/HacksPage';
import CommunityPage from './pages/CommunityPage';
import ImpactPage from './pages/ImpactPage';
import SanctuaryPage from './pages/SanctuaryPage';
import NotFoundPage from './pages/NotFoundPage';

// Route Title Synchronizer (Prompt 8 Task 1)
function TitleWatcher() {
  const location = useLocation();

  useEffect(() => {
    const titles = {
      '/': 'Aura — Urban Air Quality & Winter Smog Companion',
      '/overview': 'Aura — Urban Air Quality & Winter Smog Companion',
      '/advisor': 'Aura • AI Smog Advisor',
      '/routines': 'Aura • Hourly Air Quality & Daily Routines',
      '/hacks': 'Aura • Indoor Air and Filtration Guide',
      '/community': 'Aura • Community Support Ideas',
      '/impact': 'Aura • Household Choices Ledger',
      '/home': 'Aura • Air-Quality Illustration',
      '/sanctuary': 'Aura • Air-Quality Illustration'
    };
    document.title = titles[location.pathname] || 'Aura — Winter Smog Companion';
  }, [location]);

  return null;
}

function MainApp() {
  const navigate = useNavigate();

  // Modal states for guides & sharing
  const [isMaskGuideOpen, setIsMaskGuideOpen] = useState(false);
  const [isGlossaryOpen, setIsGlossaryOpen] = useState(false);
  const [isShareTodayOpen, setIsShareTodayOpen] = useState(false);

  const {
    airData,
    outdoorAqi: liveOutdoorAqi,
    selectedLocation,
    selectLocation,
    isLoading
  } = useAir();

  // Atmospheric telemetry state
  const outdoorAqi = liveOutdoorAqi;
  const [fanSpeed, setFanSpeed] = useState('high'); // 'off' | 'low' | 'med' | 'high'
  const [isNightMode, setIsNightMode] = useState(false);
  const [isSoundActive, setIsSoundActive] = useState(false);

  // Household Persona state
  const [selectedPersonaId, setSelectedPersonaId] = useState('family');

  const handleNavigate = (page) => {
    const target =
      page === 'overview'
        ? '/'
        : page === 'sanctuary'
        ? '/home'
        : page.startsWith('/')
        ? page
        : `/${page}`;
    navigate(target);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#18261F] flex flex-col font-sans selection:bg-[#EAE1D5] selection:text-[#18261F]">
      {/* Route Title Updater */}
      <TitleWatcher />

      {/* Accessible Skip Link (Prompt 8 Task 1) */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* 1. Full-Width Responsive Navbar */}
      <Navbar
        selectedCity={selectedLocation?.id || 'delhi'}
        setSelectedCity={selectLocation}
        cityData={airData}
        outdoorAqi={outdoorAqi}
        openMaskGuide={() => setIsMaskGuideOpen(true)}
        openGlossary={() => setIsGlossaryOpen(true)}
        openShareToday={() => setIsShareTodayOpen(true)}
      />

      {/* 2. Full-Page Content Area with React Router */}
      <main id="main-content" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Routes>
          <Route
            path="/"
            element={
              <ErrorBoundary>
                <OverviewPage
                  cityData={airData}
                  outdoorAqi={outdoorAqi}
                  onNavigate={handleNavigate}
                  selectedPersonaId={selectedPersonaId}
                  setSelectedPersonaId={setSelectedPersonaId}
                  fanSpeed={fanSpeed}
                  setFanSpeed={setFanSpeed}
                  isNightMode={isNightMode}
                  setIsNightMode={setIsNightMode}
                />
              </ErrorBoundary>
            }
          />
          <Route path="/overview" element={<Navigate to="/" replace />} />
          <Route
            path="/advisor"
            element={
              <ErrorBoundary>
                <AdvisorPage cityData={airData} outdoorAqi={outdoorAqi} />
              </ErrorBoundary>
            }
          />
          <Route
            path="/routines"
            element={
              <ErrorBoundary>
                <RoutinesPage />
              </ErrorBoundary>
            }
          />
          <Route
            path="/hacks"
            element={
              <ErrorBoundary>
                <HacksPage />
              </ErrorBoundary>
            }
          />
          <Route
            path="/community"
            element={
              <ErrorBoundary>
                <CommunityPage />
              </ErrorBoundary>
            }
          />
          <Route
            path="/impact"
            element={
              <ErrorBoundary>
                <ImpactPage
                  outdoorAqi={outdoorAqi}
                  fanSpeed={fanSpeed}
                />
              </ErrorBoundary>
            }
          />
          <Route
            path="/home"
            element={
              <ErrorBoundary>
                <SanctuaryPage
                  cityData={airData}
                  outdoorAqi={outdoorAqi}
                  fanSpeed={fanSpeed}
                  setFanSpeed={setFanSpeed}
                  isNightMode={isNightMode}
                  setIsNightMode={setIsNightMode}
                  isSoundActive={isSoundActive}
                  setIsSoundActive={setIsSoundActive}
                />
              </ErrorBoundary>
            }
          />
          <Route path="/sanctuary" element={<Navigate to="/home" replace />} />
          <Route
            path="*"
            element={
              <ErrorBoundary>
                <NotFoundPage />
              </ErrorBoundary>
            }
          />
        </Routes>
      </main>

      {/* 3. Comprehensive Educational Footer */}
      <Footer
        onNavigate={handleNavigate}
        openMaskGuide={() => setIsMaskGuideOpen(true)}
        openGlossary={() => setIsGlossaryOpen(true)}
      />

      {/* 4. Modals */}
      <MaskGuideModal
        isOpen={isMaskGuideOpen}
        onClose={() => setIsMaskGuideOpen(false)}
      />
      <GlossaryModal
        isOpen={isGlossaryOpen}
        onClose={() => setIsGlossaryOpen(false)}
      />
      <ShareTodayModal
        isOpen={isShareTodayOpen}
        onClose={() => setIsShareTodayOpen(false)}
        cityData={airData}
        outdoorAqi={outdoorAqi}
      />

      {/* 5. PWA Install Prompt (after 2nd visit) */}
      <PwaInstallPrompt />
    </div>
  );
}

export default function App() {
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/health', { signal: controller.signal }).catch(() => {});
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
