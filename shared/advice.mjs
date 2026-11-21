import { getUsAqiCategory, isSensitiveHousehold, normalizeAqi, outdoorGuidance } from './aqi.mjs';

const URGENT_SYMPTOMS = /chest (?:pain|tightness)|severe (?:breathlessness|shortness of breath|breathing difficulty)|(?:can['’]?t|cannot) breathe|(?:blue|bluish) lips|acute asthma|सीने में दर्द|सांस नहीं|साँस नहीं|नीले होंठ|ਛਾਤੀ ਵਿੱਚ ਦਰਦ|ਸਾਹ ਨਹੀਂ|ਨੀਲੇ ਬੁੱਲ੍ਹ/iu;

export function isUrgentQuestion(message) {
  return URGENT_SYMPTOMS.test(message);
}

export function questionTopic(message) {
  if (/plant|houseplant|filter|purifier|indoors?|ventilat|kitchen|cook|dust|incense|window|घर के अंदर|हवा साफ|ਘਰ ਅੰਦਰ/iu.test(message)) return 'indoor';
  if (/community|neighbou?r|idle|idling|carpool|shared ride|anti-idling|सामुदायिक|ਭਾਈਚਾਰ/iu.test(message)) return 'community';
  if (/commut|school run|traffic|transit|bus|metro|route|यात्रा|ਸਫ਼ਰ/iu.test(message)) return 'commute';
  if (/impact|benefit|percent|percentage|estimate|reduc.*exposure|असर|ਅਸਰ/iu.test(message)) return 'impact';
  if (/run|walk|exercis|outdoor|sport|play|morning|evening|aqi|बाहर|ਬਾਹਰ/iu.test(message)) return 'outdoor';
  return null;
}

function recommendation(id, title, action, why, impact, assumptions, effort = 1) {
  return {
    id,
    title,
    action,
    why,
    impact: {
      metric: 'Expected effect',
      value: impact,
      unit: 'Qualitative guidance',
      confidence: 'low'
    },
    assumptions,
    effort
  };
}

/** Deterministic offline guidance. It intentionally avoids unmeasured numeric benefits. */
export function generateRuleBasedAdvice({ message = '', airData = {}, profile = {}, language = 'en', history = [] } = {}) {
  const query = String(message).toLowerCase();
  profile = profile && typeof profile === 'object' && !Array.isArray(profile) ? profile : {};
  airData = airData && typeof airData === 'object' && !Array.isArray(airData) ? airData : {};
  const city = typeof airData.name === 'string' ? airData.name : 'your area';
  const aqi = airData.isLive && !airData.isCached ? normalizeAqi(airData.aqi) : null;
  const hasCurrentReading = aqi !== null;
  const category = getUsAqiCategory(aqi);
  const conditions = Array.isArray(profile.conditions) ? profile.conditions : [];
  const hasSensitiveHouseholdMember = isSensitiveHousehold(profile);
  if (isUrgentQuestion(message)) {
    const urgentSummary = {
      en: 'If someone has severe breathing difficulty, chest pain, or bluish lips, contact local emergency services now.',
      hi: 'अगर किसी को साँस लेने में बहुत कठिनाई, सीने में दर्द या होंठ नीले पड़ रहे हैं, तो तुरंत स्थानीय आपातकालीन सेवाओं से संपर्क करें।',
      pa: 'ਜੇ ਕਿਸੇ ਨੂੰ ਸਾਹ ਲੈਣ ਵਿੱਚ ਬਹੁਤ ਔਖ, ਛਾਤੀ ਵਿੱਚ ਦਰਦ ਜਾਂ ਬੁੱਲ੍ਹ ਨੀਲੇ ਹੋ ਰਹੇ ਹਨ, ਤਾਂ ਤੁਰੰਤ ਸਥਾਨਕ ਐਮਰਜੈਂਸੀ ਸੇਵਾਵਾਂ ਨਾਲ ਸੰਪਰਕ ਕਰੋ।'
    };
    return {
      summary: urgentSummary[language] || urgentSummary.en,
      recommendations: [
        recommendation(
          'urgent-help',
          'Get urgent medical help',
          'Contact your local emergency service now. Follow any existing clinician-provided emergency plan while help is on the way.',
          'These symptoms can require urgent in-person assessment; an air-quality assistant cannot determine their cause.',
          'No health outcome can be estimated by this assistant.',
          ['This is general safety guidance, not a diagnosis.']
        )
      ],
      followUp: null
    };
  }

  const recommendations = [];
  if (query.includes('plant') || query.includes('houseplant')) {
    recommendations.push(
      recommendation(
        'plants-and-filtration',
        'Do not rely on houseplants as an air cleaner',
        'Do not rely on houseplants as a particle cleaner. Prioritize reducing indoor sources and, when practical, use a properly sized mechanical air cleaner or HVAC filter. Keep filters maintained and avoid devices that intentionally produce ozone.',
        'A room air cleaner moves air through filter media; ordinary potted plants are not a substitute for source control, ventilation when outdoor air is cleaner, or filtration.',
        'Mechanical filtration can reduce airborne particles in the served space; the amount depends on room size, clean-air delivery, run time, and leakage.',
        ['No indoor particle monitor reading or room dimensions were supplied.'],
        2
      )
    );
  }

  const hasCleaner = ['portable', 'diy'].includes(profile.purifierOwned);
  const indoorAction = !hasCleaner
    ? 'If buying equipment is not feasible, start with no-cost source control: avoid indoor smoking, incense, and candles; avoid dry sweeping; and close windows while outdoor particle pollution is high when temperature and other conditions make that safe. When outdoor air improves, ventilate briefly.'
    : 'Run a particle air cleaner in the room where people spend the most time. Choose a unit sized for that room, keep its airflow clear, and replace filters as directed. Avoid devices that intentionally produce ozone.';

  if (!recommendations.some((item) => item.id === 'plants-and-filtration')) {
    recommendations.push(
      recommendation(
        'cleaner-indoor-air',
        'Make one room easier to keep clean',
        indoorAction,
        'Source control and particle filtration can reduce indoor particle levels. No single air cleaner removes every pollutant, and outdoor-air ventilation is useful when outdoor air is cleaner.',
        'Can lower airborne particles in the room when source control and a suitable filter are used; no personal reduction is measured here.',
        ['Actual indoor benefit depends on room size, filter performance, use, maintenance, and outdoor-air leakage.'],
        hasCleaner ? 2 : 1
      )
    );
  }

  const forecastPeak = normalizeAqi(airData.cleanestWindowPeakAqi);
  const currentWindow = hasCurrentReading && forecastPeak !== null && forecastPeak < aqi
    && typeof airData.cleanestWindow === 'string' && airData.cleanestWindow
    ? airData.cleanestWindow
    : null;
  let outdoorAction = outdoorGuidance(aqi, hasSensitiveHouseholdMember);
  if (currentWindow) {
    outdoorAction += ` The comparatively lower period is ${currentWindow}, with a forecast peak US AQI of ${forecastPeak} (${getUsAqiCategory(forecastPeak)}). Recheck local guidance before leaving. ${outdoorGuidance(forecastPeak, hasSensitiveHouseholdMember)}`;
  }

  recommendations.push(
    recommendation(
      'plan-outdoor-time',
      'Plan around current air-quality guidance',
      outdoorAction,
      'Reducing the time or intensity of outdoor exertion during higher particle pollution reduces the amount of polluted air inhaled. A forecast is not a street-level measurement.',
      'Less time outdoors during a higher-pollution period means less opportunity for exposure; this app cannot calculate a personal dose.',
      [hasCurrentReading ? 'AQI and hourly values are model estimates for the selected location.' : 'No current live AQI was available; check an official local advisory.'],
      1
    )
  );

  const commute = profile.commute;
  const commuteAction = ['two_wheeler', 'walk', 'cycle'].includes(commute)
    ? 'When practical, choose a route away from busy roads or shift to public transit or a shared trip. During high pollution, reduce outdoor exertion and time near traffic.'
    : 'Combine errands or share a trip when practical. Avoid idling and choose public transit for trips where it is a workable alternative.';
  recommendations.push(
    recommendation(
      'lower-emission-routine',
      'Make one trip produce less traffic pollution',
      commuteAction,
      'Replacing or combining private-vehicle trips can reduce household vehicle use and traffic emissions. Personal exposure depends on route, vehicle, ventilation, and time spent outside.',
      'Can reduce private-vehicle trips and their emissions; the amount depends on the vehicle and trip distance.',
      ['Vehicle details, route, and trip distance affect the result.'],
      1
    )
  );

  if (profile.cookingFuel && profile.cookingFuel !== 'electric_induction') {
    recommendations.push(
      recommendation(
        'cooking-source-control',
        'Limit particles from cooking',
        'Use a kitchen exhaust hood vented outdoors if available, and avoid burning incense or candles indoors. Do not use an unvented combustion heater as an air-cleaning measure.',
        'Cooking and indoor combustion can add particles. Exhaust ventilation and avoiding unnecessary indoor burning reduce indoor sources.',
        'Reduces avoidable indoor particle sources; no home measurement was supplied.',
        ['The advice assumes an outdoor-vented hood is available; recirculating hoods do not vent outdoors.'],
        1
      )
    );
  }

  const priorQuestion = history.findLast((turn) => turn.role === 'user');
  const topic = questionTopic(query) || questionTopic(priorQuestion?.content || '');
  if (topic === 'community') {
    recommendations.push(recommendation(
      'coordinate-community-action',
      'Coordinate a shared commute or no-idling pickup',
      'Ask your building group, workplace, or school to pilot a no-idling pickup area or coordinate shared trips. Share the latest official advisory with your group when conditions change.',
      'Group coordination makes it easier for people to change pickup and travel habits.',
      'Can reduce idling or the number of separate vehicle trips.',
      ['Local rules, accessibility needs, and travel patterns vary.']
    ));
  }

  const priorities = {
    indoor: ['plants-and-filtration', 'cleaner-indoor-air', 'cooking-source-control', 'plan-outdoor-time'],
    community: ['coordinate-community-action', 'lower-emission-routine', 'plan-outdoor-time'],
    commute: ['lower-emission-routine', 'plan-outdoor-time', 'cleaner-indoor-air'],
    outdoor: ['plan-outdoor-time', 'cleaner-indoor-air', 'lower-emission-routine'],
    impact: ['lower-emission-routine', 'cleaner-indoor-air', 'plan-outdoor-time']
  }[topic];
  const prioritized = priorities
    ? [...priorities.map((id) => recommendations.find((item) => item.id === id)).filter(Boolean),
      ...recommendations.filter((item) => !priorities.includes(item.id))]
    : recommendations;
  const outdoor = recommendations.find((item) => item.id === 'plan-outdoor-time');
  const ordered = aqi > 300 ? [outdoor, ...prioritized.filter((item) => item !== outdoor)] : prioritized;

  const dataNote = hasCurrentReading
    ? `Live model estimate for ${city}: US AQI ${aqi} (${category})${airData.pm25 != null && Number.isFinite(Number(airData.pm25)) ? ` and PM2.5 ${Number(airData.pm25).toFixed(1)} µg/m³` : ''}.`
    : airData.isCached
      ? `No live reading is available for ${city}; the cached estimate is ${airData.staleHours || 'an unknown number of'} hours old, so use a current local advisory for decisions.`
      : `No live reading is available for ${city}. Check a current local advisory before making time-sensitive decisions.`;

  return {
    summary: `${dataNote} ${hasSensitiveHouseholdMember ? 'Because this household includes people who may be more sensitive to particle pollution, use extra caution and follow any personal care plan.' : 'Use current local guidance and adjust activity based on conditions and how you feel.'}`,
    recommendations: ordered.slice(0, 4),
    followUp: conditions.some((condition) => condition === 'asthma' || condition === 'heart')
      ? 'For a known heart or lung condition, follow your clinician-provided action plan.'
      : 'Would you like suggestions focused on commuting, cooking, or setting up a cleaner-air room?'
  };
}
