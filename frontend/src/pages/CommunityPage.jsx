import React from 'react';
import CommunityShield from '../components/CommunityShield';
import { useAir } from '../context/AirContext';

export default function CommunityPage() {
  const { airData } = useAir();
  return <CommunityShield cityData={airData} />;
}
