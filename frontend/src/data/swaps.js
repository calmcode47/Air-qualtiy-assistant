import { isSensitiveHousehold } from '../../../shared/aqi.mjs';


/** Everyday actions with qualitative effects; no personal exposure is inferred. */
export const SWAPS = [
  {
    id: 'swap_metro_bus',
    label: 'Use public transit or share a trip when practical',
    category: 'travel',
    costBand: 'Varies',
    timeEffect: 'Route-dependent',
    impact: {
      value: 'Can reduce household private-vehicle use and associated traffic emissions.',
      confidence: 'low',
      assumptions: ['The choice replaces a trip that would otherwise be made in a private vehicle.', 'This log does not include vehicle, distance, occupancy, or transit energy data.'],
      source: 'Qualitative direction only; no emissions factor applied.'
    }
  },
  {
    id: 'swap_clean_cooking',
    label: 'Avoid unvented solid-fuel cooking where a safer option is available',
    category: 'cooking',
    costBand: 'Varies',
    timeEffect: 'Household-dependent',
    impact: {
      value: 'Can reduce smoke from indoor combustion. Gas also produces pollutants; use outdoor-vented exhaust when available.',
      confidence: 'med',
      assumptions: ['Fuel, stove, ventilation, and local electricity reliability affect the result.'],
      source: 'WHO household fuel guidance; US EPA indoor air quality resources.'
    }
  },
  {
    id: 'swap_bedroom_purifier',
    label: 'Run a correctly sized mechanical air cleaner in the occupied room',
    category: 'filtration',
    costBand: 'Varies',
    timeEffect: 'Run time and noise depend on the unit',
    impact: {
      value: 'Can reduce airborne particles in the room when sized, operated, and maintained for that space.',
      confidence: 'med',
      assumptions: ['No indoor monitor, room size, clean-air delivery rate, or run-time record is available.'],
      source: 'US EPA, Guide to Air Cleaners in the Home.'
    }
  },
  {
    id: 'swap_closed_windows_peak',
    label: 'Limit outdoor-air entry while outdoor particle pollution is high',
    category: 'ventilation',
    costBand: 'No purchase required',
    timeEffect: 'Check conditions through the day',
    impact: {
      value: 'May reduce outdoor particle entry in some buildings; ventilate when outdoor air improves and consider indoor heat and combustion sources.',
      confidence: 'low',
      assumptions: ['Building leakage and indoor sources vary; this choice does not replace source control or needed ventilation.'],
      source: 'US EPA, Guide to Air Cleaners in the Home.'
    }
  },
  {
    id: 'swap_afternoon_walk',
    label: 'Move strenuous outdoor activity to a lower forecast period when practical',
    category: 'schedule',
    costBand: 'No purchase required',
    timeEffect: 'Schedule-dependent',
    impact: {
      value: 'Can reduce time outdoors during higher forecast pollution; a lower period is not guaranteed to be safe.',
      confidence: 'low',
      assumptions: ['Use current local advice; forecast values are not street-level readings.'],
      source: 'US EPA and AirNow particle-pollution activity guidance.'
    }
  },
  {
    id: 'swap_wet_mopping',
    label: 'Use damp cleaning instead of dry sweeping when suitable',
    category: 'cleaning',
    costBand: 'No purchase required',
    timeEffect: 'Task-dependent',
    impact: {
      value: 'Can limit dust being stirred back into the air compared with dry sweeping.',
      confidence: 'low',
      assumptions: ['This addresses settled dust and does not remove particles already suspended in air.'],
      source: 'US EPA, Sources of Indoor Particulate Matter.'
    }
  },
  {
    id: 'swap_rear_burner',
    label: 'Use an outdoor-vented kitchen exhaust hood while cooking',
    category: 'cooking',
    costBand: 'No purchase required if installed',
    timeEffect: 'Use during cooking',
    impact: {
      value: 'Can remove some cooking pollutants from the home when the hood vents outdoors and is used correctly.',
      confidence: 'med',
      assumptions: ['A recirculating hood does not vent pollutants outdoors; no capture percentage is assumed.'],
      source: 'US EPA indoor air quality resources.'
    }
  },
  {
    id: 'swap_towel_door_seal',
    label: 'Reduce obvious door or window drafts without blocking required vents',
    category: 'draft control',
    costBand: 'Varies',
    timeEffect: 'Household-dependent',
    impact: {
      value: 'May reduce drafts at a specific gap; the change in indoor particle levels is unknown without measurement.',
      confidence: 'low',
      assumptions: ['Do not block combustion-air openings, ventilation grilles, or required egress.'],
      source: 'Qualitative household action; no measured reduction claimed.'
    }
  }
];

export function getSwapById(id) {
  return SWAPS.find((swap) => swap.id === id) || null;
}

export function getTailoredSwaps(profile) {
  const ids = [];
  if (['car', 'two_wheeler'].includes(profile.commute)) ids.push('swap_metro_bus');

  const usesSolidFuel = profile.cookingFuel === 'biomass_wood';
  if (usesSolidFuel && profile.monthlyBudgetBand !== 'low') {
    ids.push('swap_clean_cooking');
  } else if (!usesSolidFuel) {
    ids.push('swap_rear_burner');
  }

  if (isSensitiveHousehold(profile)) ids.push('swap_afternoon_walk');
  if (profile.monthlyBudgetBand === 'low') ids.push('swap_wet_mopping');
  if (['portable', 'diy'].includes(profile.purifierOwned)) ids.push('swap_bedroom_purifier');

  ids.push('swap_closed_windows_peak', 'swap_wet_mopping', 'swap_afternoon_walk');
  return [...new Set(ids)].slice(0, 3).map(getSwapById);
}
