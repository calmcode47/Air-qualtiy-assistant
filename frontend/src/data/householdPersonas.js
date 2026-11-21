import { getUsAqiCategory, isSensitiveHousehold, normalizeAqi, outdoorGuidance } from '../../../shared/aqi.mjs';

export const HOUSEHOLD_PERSONAS = [
  {
    id: 'family',
    title: 'Family with Young Children',
    subtitle: 'Plan school travel and indoor time around current local guidance.',
    icon: '👨‍👩‍👧‍👦',
    tag: 'Children in household',
    recommendedActions: [{ id: 'school-route', label: 'Plan school travel' }]
  },
  {
    id: 'commuter',
    title: 'Daily Commuter',
    subtitle: 'Compare practical routes and lower-emission travel options.',
    icon: '🛵',
    tag: 'Commute planning',
    recommendedActions: [{ id: 'travel-choice', label: 'Compare travel options' }]
  },
  {
    id: 'elderly',
    title: 'Older Adult or Respiratory Condition',
    subtitle: 'Use current local advice and any personal care plan.',
    icon: '🫁',
    tag: 'Extra caution',
    recommendedActions: [{ id: 'activity-plan', label: 'Adjust outdoor activity' }]
  },
  {
    id: 'apartment',
    title: 'Apartment Resident',
    subtitle: 'Focus on indoor sources, ventilation, and room-level filtration.',
    icon: '🏢',
    tag: 'Indoor air',
    recommendedActions: [{ id: 'room-air', label: 'Review room air' }]
  },
  {
    id: 'budget',
    title: 'Budget-Conscious Household',
    subtitle: 'Start with practical no-cost source-control steps.',
    icon: '🌱',
    tag: 'Lower-cost options',
    recommendedActions: [{ id: 'source-control', label: 'Reduce indoor sources' }]
  }
];

export function deriveActionPlan(profile = {}, airData = {}) {
  const city = airData.name || 'your area';
  const aqi = airData.isLive ? normalizeAqi(airData.aqi) : null;
  const sensitive = isSensitiveHousehold(profile);
  const commute = typeof profile.commute === 'object' ? profile.commute?.mode : profile.commute;
  const cookingFuel = profile.cookingFuel;
  const hasCleaner = ['portable', 'diy'].includes(profile.purifierOwned);
  const lowerWindow = aqi !== null ? airData.cleanestWindow : null;
  const peak = normalizeAqi(airData.cleanestWindowPeakAqi);
  const activityDescription = aqi === null
    ? `${outdoorGuidance(aqi, sensitive)} No live reading is available for this location.`
    : `Current US AQI in ${city} is ${aqi} (${getUsAqiCategory(aqi)}). ${outdoorGuidance(aqi, sensitive)}`;
  const forecastDescription = lowerWindow && peak !== null
    ? ` Forecast peak US AQI for that period is ${peak}. ${outdoorGuidance(peak, sensitive)}`
    : '';

  const indoorDescription = hasCleaner
    ? 'Run the mechanical air cleaner in the room where people spend the most time, sized for that space and maintained as directed. It can reduce particles; no indoor reading is available to quantify the change.'
    : 'Reduce indoor particle sources such as smoking, incense, and candles. If buying equipment is feasible, compare room size and clean-air delivery rate when choosing a mechanical air cleaner.';

  const travelDescription = ['walk', 'cycle', 'two_wheeler'].includes(commute)
    ? 'When practical, choose routes away from busy roads or compare public transit and shared trips. Reduce time near traffic during high-pollution periods.'
    : 'When practical, combine errands, avoid idling, or share a trip. The change in emissions depends on the vehicle, route, and distance.';

  const cookingDescription = cookingFuel && cookingFuel !== 'electric_induction'
    ? 'Use an outdoor-vented kitchen hood when available and avoid unnecessary indoor burning. A recirculating hood does not vent pollutants outdoors.'
    : 'Use a kitchen hood vented outdoors when cooking creates particles; reduce other indoor combustion sources.';

  const activityTitle = aqi > 300
    ? 'Avoid outdoor physical activity'
    : lowerWindow
    ? `Compare the lower forecast period (${lowerWindow})`
    : sensitive
      ? 'Plan outdoor activity for a sensitive household'
      : 'Check current local air-quality guidance';

  return [
    {
      step: '01',
      phase: 'Outdoor activity',
      badgeClass: 'bg-[#FAF0EC] text-[#A94A28]',
      numClass: 'bg-[#FAF0EC] text-[#A94A28]',
      title: activityTitle,
      description: `${activityDescription}${forecastDescription}`,
      impact: 'Less time and exertion outdoors during higher pollution can reduce exposure; no personal dose is calculated.'
    },
    {
      step: '02',
      phase: 'Indoor particles',
      badgeClass: 'bg-[#EAF2ED] text-[#3D6B56]',
      numClass: 'bg-[#EAF2ED] text-[#3D6B56]',
      title: hasCleaner ? 'Use the room air cleaner well' : 'Start with indoor source control',
      description: indoorDescription,
      impact: 'May lower airborne particles in the served room; effect depends on room, filter, run time, and leakage.'
    },
    {
      step: '03',
      phase: 'Daily choices',
      badgeClass: 'bg-[#FBF5EC] text-[#8C5311]',
      numClass: 'bg-[#FBF5EC] text-[#8C5311]',
      title: ['walk', 'cycle', 'two_wheeler', 'car'].includes(commute) ? 'Plan one lower-emission trip' : 'Reduce indoor and travel sources',
      description: `${travelDescription} ${cookingDescription}`,
      impact: 'Can reduce household vehicle use or indoor sources; amounts depend on household conditions and are not estimated here.'
    }
  ];
}

export function deriveVulnerabilities(profile = {}) {
  const notes = [];
  if (Number(profile.children || 0) > 0) notes.push('Children are among the groups identified in public air-quality guidance for added caution during particle pollution.');
  if (Number(profile.elderly || 0) > 0) notes.push('Older adults may be more sensitive to particle pollution; use current local guidance.');
  if (profile.conditions?.some((condition) => ['asthma', 'heart', 'pregnancy'].includes(condition))) {
    notes.push('For a known heart or lung condition, follow the personal plan provided by a clinician and do not change treatment based on this app.');
  }
  if (profile.commute === 'two_wheeler' || profile.commute === 'cycle' || profile.commute === 'walk') {
    notes.push('Walking, cycling, and riding near traffic can increase time spent close to roadside pollution; street-level conditions vary.');
  }
  if (profile.cookingFuel === 'biomass_wood') notes.push('Combustion used for cooking can add particles indoors; ventilation and safer fuel options depend on the home.');
  if (notes.length === 0) notes.push('Personal sensitivity varies. Use current local air-quality information and adjust activity based on how you feel.');
  return notes;
}

export function derivePriorityHacks(profile = {}) {
  const hacks = [];
  if (profile.monthlyBudgetBand === 'low' || profile.purifierOwned === 'none') {
    hacks.push({
      id: 'source-control',
      title: 'Reduce indoor particle sources',
      priority: 'No-cost first step',
      reason: 'Avoid indoor smoking, incense, and candles; avoid dry sweeping when damp cleaning is practical.'
    });
  }
  hacks.push({
    id: 'targeted-sanctuary',
    title: 'Choose one occupied room',
    priority: 'Room-level planning',
    reason: 'Place a correctly sized mechanical air cleaner where people spend the most time, if one is available.'
  });
  if (profile.homeType === 'apartment') {
    hacks.push({
      id: 'ventilation-check',
      title: 'Check ventilation paths',
      priority: 'Building-aware step',
      reason: 'Do not block required vents; use kitchen or bathroom exhaust as intended.'
    });
  }
  return hacks;
}
