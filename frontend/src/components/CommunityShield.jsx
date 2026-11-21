import React from 'react';
import { Bus, Filter, HandHeart, Leaf, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { isSensitiveHousehold } from '../../../shared/aqi.mjs';
import { useProfile } from '../store/profile';

const communityActions = [
  {
    id: 'trips',
    icon: Bus,
    title: 'Coordinate shared trips',
    description: 'Arrange school or work carpools, walking groups, or public-transit connections where they are practical and accessible.',
    nextStep: 'Ask a school, apartment group, or neighborhood chat to coordinate routes and pickup points.',
    note: 'Travel emissions depend on the vehicles, distances, occupancy, and local transit system.'
  },
  {
    id: 'waste',
    icon: Leaf,
    title: 'Keep leaves and waste out of fires',
    description: 'Share municipal collection, composting, or yard-waste options so neighbors have a workable alternative to burning.',
    nextStep: 'Check local waste rules and collection services before organizing a compost or pickup site.',
    note: 'Follow local fire, pest, and composting requirements.'
  },
  {
    id: 'filters',
    icon: Filter,
    title: 'Share clean-air equipment',
    description: 'Organize a filter replacement fund, equipment loan shelf, or build session using safe, correctly sized products.',
    nextStep: 'Start with a list of who can lend equipment and who needs help with purchase, setup, or filter changes.',
    note: 'A cleaner’s performance depends on its tested clean-air delivery, room size, placement, and maintenance.'
  },
  {
    id: 'check-in',
    icon: HandHeart,
    title: 'Check in during pollution alerts',
    description: 'Help neighbors who may need support accessing current alerts, changing plans, or obtaining a suitable respirator or cleaner.',
    nextStep: 'Share official local air-quality and emergency information in the languages used in your community.',
    note: 'Use current local public-health guidance for time-sensitive decisions.'
  }
];

export default function CommunityShield({ cityData }) {
  const { profile } = useProfile();
  const currentAqi = cityData.isLive ? cityData.aqi : null;
  const checkOnNeighbors = currentAqi > 150 || (currentAqi > 100 && isSensitiveHousehold(profile));
  const priority = checkOnNeighbors ? 'check-in' : profile.purifierOwned === 'none' ? 'filters' : 'trips';
  const orderedActions = [
    communityActions.find((item) => item.id === priority),
    ...communityActions.filter((item) => item.id !== priority)
  ];
  const path = '/advisor?topic=community';
  return (
    <section className="space-y-6" aria-labelledby="community-heading">
      <div className="bg-white rounded-3xl border border-[#E6DED6] p-6 sm:p-7 paper-shadow space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-[#E6DED6]">
          <div className="w-10 h-10 rounded-2xl bg-[#EAF2ED] text-[#3D6B56] border border-[#CCE0D4] flex items-center justify-center">
            <Users className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h1 id="community-heading" className="text-xl sm:text-2xl font-serif-natural font-bold text-[#18261F]">
              Community support and shared actions
            </h1>
            <p className="text-xs sm:text-sm text-[#53645C] mt-1">
              Practical ways neighbors can make lower-emission choices and help one another during poor air quality.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#FAF7F2] p-4 rounded-2xl border border-[#DFD6CB]">
          <p className="text-xs leading-relaxed text-[#53645C]">
            {currentAqi == null
              ? `No current estimate for ${cityData.name}. Check local alerts before planning an event.`
              : `${cityData.name} model estimate · US AQI ${currentAqi} (${cityData.category}). ${checkOnNeighbors ? 'Start by checking in on neighbors who may need support.' : 'Choose a practical step for your neighborhood.'}`}
          </p>
          <Link to={path} className="text-xs font-semibold underline text-[#315E48]">Plan with the advisor</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {orderedActions.map(({ icon: Icon, title, description, nextStep, note }) => (
          <article key={title} className="bg-white rounded-3xl border border-[#E6DED6] p-6 paper-shadow space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#EAF2ED] text-[#3D6B56] border border-[#CCE0D4] flex items-center justify-center">
                <Icon className="w-4 h-4" aria-hidden="true" />
              </div>
              <h2 className="text-base font-bold font-serif-natural text-[#18261F]">{title}</h2>
            </div>
            <p className="text-xs text-[#53645C] leading-relaxed">{description}</p>
            <div className="bg-[#FAF7F2] p-3 rounded-xl border border-[#DFD6CB] space-y-1">
              <h3 className="text-xs font-bold text-[#18261F]">A place to start</h3>
              <p className="text-xs text-[#53645C] leading-relaxed">{nextStep}</p>
            </div>
            <p className="text-[11px] text-[#56685F] leading-relaxed">{note}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
