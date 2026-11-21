export const INDOOR_HACKS = [
  {
    id: 'corsi-rosenthal',
    title: 'DIY Box-Fan Filter',
    category: 'Mechanical filtration',
    tag: 'Check fit and fan safety',
    cost: 'Prices vary by location',
    description: 'A box fan with compatible particle filters can move room air through filter media. Performance depends on the fan, filter, assembly, room, and how long it runs.',
    steps: [
      'Use a fan and filter arrangement that fits securely and follows the design instructions; keep the fan intake and outlet unobstructed.',
      'Match filter arrows to the direction of airflow and seal gaps where air could bypass the filter media.',
      'Place the unit where people spend time, with clear space around it; adjust speed for comfort and noise.',
      'Inspect filters and replace them as directed or when visibly dirty. Do not operate damaged electrical equipment.',
      'For a box fan, use an intact unit with a recognized safety listing and follow its manufacturer instructions. EPA recommends newer box fans with a UL or ETL mark for DIY air cleaners.'
    ],
    whyItWorks: 'The fan draws air through particle-filter media. Clean-air delivery depends on the complete tested assembly; this guide does not estimate a CADR or a room-level reduction.',
    assumptions: ['No particular fan, filter model, room dimensions, or indoor monitor reading is supplied.'],
    source: 'US EPA, Guide to Air Cleaners in the Home; EPA Research on DIY Air Cleaners.'
  },
  {
    id: 'damp-dusting',
    title: 'Damp Dusting and Cleaning',
    category: 'Housekeeping',
    tag: 'Low-cost source control',
    cost: 'Depends on supplies',
    description: 'Use a damp cloth or mop where suitable to collect settled dust instead of stirring it into the air.',
    steps: [
      'Dampen a cloth or mop with water and clean surfaces that collect dust.',
      'Avoid dry sweeping when it visibly stirs dust; if vacuuming is needed, use a well-maintained vacuum with an appropriate filter.',
      'Keep people with asthma or allergies away from the immediate cleaning area if dust is disturbed.'
    ],
    whyItWorks: 'Cleaning methods that collect settled dust can reduce how much dust is stirred into indoor air. This does not remove particles already suspended in the room.',
    assumptions: ['Effect depends on surface, cleaning method, and particle source.'],
    source: 'US EPA, Sources of Indoor Particulate Matter.'
  },
  {
    id: 'kitchen-exhaust',
    title: 'Cooking Source Control and Exhaust',
    category: 'Source control',
    tag: 'Use ventilation as designed',
    cost: 'No cost if a hood is installed',
    description: 'Cooking can add particles and gases indoors. An exhaust hood that vents outdoors can remove some pollutants when used as designed.',
    steps: [
      'Use a kitchen exhaust hood that vents outdoors when cooking, if available.',
      'Use rear burners when they sit under the hood capture area and the cookware is stable.',
      'Keep the hood on during cooking and briefly afterward, following its manual.',
      'Avoid burning incense or candles indoors, especially when windows are closed.'
    ],
    whyItWorks: 'Source control and outdoor-vented exhaust can reduce the amount of cooking pollution that remains indoors. A recirculating hood does not vent pollutants outdoors, and capture varies by hood and use.',
    assumptions: ['No capture percentage is claimed; ventilation and cooking equipment differ between homes.'],
    source: 'US EPA, Guide to Air Cleaners in the Home; Sources of Indoor Particulate Matter.'
  },
  {
    id: 'window-sealing',
    title: 'Draft Reduction and Ventilation Checks',
    category: 'Home maintenance',
    tag: 'Do not block required vents',
    cost: 'Depends on materials',
    description: 'Weather-stripping may reduce drafts at a specific gap, but does not filter air or replace necessary ventilation.',
    steps: [
      'Identify obvious gaps around doors or windows and use suitable weather-stripping where safe.',
      'Do not cover combustion-air openings, required ventilation grilles, or emergency exits.',
      'When outdoor air quality improves, ventilate as practical to remove indoor pollutants and moisture.'
    ],
    whyItWorks: 'Reducing an unwanted draft can change air entry at that opening. The effect on indoor particles depends on the whole building and indoor sources.',
    assumptions: ['No infiltration percentage is estimated; sealing can be unsafe if it blocks required ventilation.'],
    source: 'US EPA, Guide to Air Cleaners in the Home.'
  },
  {
    id: 'aromatherapy-warning',
    title: 'Avoid Indoor Smoke Sources',
    category: 'Source control',
    tag: 'No-cost first step',
    cost: 'Can avoid purchase',
    description: 'Incense, candles, smoking, and some cooking or heating activities add pollutants to indoor air.',
    steps: [
      'Avoid indoor smoking and vaping.',
      'Avoid burning incense and candles during poor outdoor-air periods.',
      'Do not use unvented combustion heaters or boiling water as an air-cleaning method.'
    ],
    whyItWorks: 'Reducing a particle source prevents that activity from adding its emissions to the room. It does not address pollution entering from outdoors.',
    assumptions: ['The amount and type of pollution vary by product and room ventilation.'],
    source: 'US EPA, Wildfires and Indoor Air Quality; Sources of Indoor Particulate Matter.'
  }
];
