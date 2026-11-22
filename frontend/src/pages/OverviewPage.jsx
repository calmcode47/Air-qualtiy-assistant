import React, { useState } from 'react';
import ShareTodayModal from '../components/ShareTodayModal';
import GroundStationCard from '../components/GroundStationCard';
import { useAir } from '../context/AirContext';
import { deriveActionPlan } from '../data/householdPersonas';
import { useProfile } from '../store/profile';
import AirQualitySummary from './overview/AirQualitySummary';
import AssistantTools from './overview/AssistantTools';
import GreenerSwaps from './overview/GreenerSwaps';
import HouseholdGuidance from './overview/HouseholdGuidance';
import TodayActionPlan from './overview/TodayActionPlan';

export default function OverviewPage({ onNavigate }) {
  const { airData, outdoorAqi, groundStation } = useAir();
  const { profile, setIsOnboardingOpen } = useProfile();
  const [showShareModal, setShowShareModal] = useState(false);
  const actionPlan = deriveActionPlan(profile, airData);

  function editProfile() {
    setIsOnboardingOpen(true);
  }

  return (
    <div className="space-y-10">
      <AirQualitySummary onNavigate={onNavigate} />
      <GroundStationCard station={groundStation} />
      <TodayActionPlan actionPlan={actionPlan} onShare={() => setShowShareModal(true)} onEditProfile={editProfile} />
      <HouseholdGuidance onEditProfile={editProfile} onNavigate={onNavigate} />
      <GreenerSwaps onNavigate={onNavigate} />
      <AssistantTools />
      <ShareTodayModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        cityData={airData}
        outdoorAqi={outdoorAqi}
        actionPlan={actionPlan}
      />
    </div>
  );
}
