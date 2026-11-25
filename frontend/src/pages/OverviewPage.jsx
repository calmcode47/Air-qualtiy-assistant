import React from 'react';
import GroundStationCard from '../components/GroundStationCard';
import { useAir } from '../context/AirContext';
import { deriveActionPlan } from '../data/householdPersonas';
import { useProfile } from '../store/profile';
import AirQualitySummary from './overview/AirQualitySummary';
import AssistantTools from './overview/AssistantTools';
import GreenerSwaps from './overview/GreenerSwaps';
import HouseholdGuidance from './overview/HouseholdGuidance';
import TodayActionPlan from './overview/TodayActionPlan';

export default function OverviewPage({ onShare }) {
  const { airData, groundStation } = useAir();
  const { profile, setIsOnboardingOpen } = useProfile();
  const actionPlan = deriveActionPlan(profile, airData);

  function editProfile() {
    setIsOnboardingOpen(true);
  }

  return (
    <div className="space-y-10">
      <AirQualitySummary />
      <GroundStationCard station={groundStation} />
      <TodayActionPlan actionPlan={actionPlan} onShare={onShare} onEditProfile={editProfile} />
      <HouseholdGuidance onEditProfile={editProfile} />
      <GreenerSwaps />
      <AssistantTools />
    </div>
  );
}
