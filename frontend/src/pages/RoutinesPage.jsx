import React from 'react';
import DiurnalRoutineTimeline from '../components/DiurnalRoutineTimeline';
import { useAir } from '../context/AirContext';
import { ChartSkeleton } from '../components/LoadingSkeleton';

export default function RoutinesPage() {
  const { airData, isLoading } = useAir();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl sm:text-3xl font-extrabold font-serif-natural text-[#18261F]">
        Air-quality Forecast and Routines
      </h1>
      {isLoading ? <ChartSkeleton /> : <DiurnalRoutineTimeline cityData={airData} />}
    </div>
  );
}
