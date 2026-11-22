// @ts-check

import { getUsAqiCategory, isSensitiveHousehold, normalizeAqi } from './aqi.mjs';
import { formatGroundMonitorNote } from './groundMonitor.mjs';
import { ADVICE_TEMPLATES, interpolate, localizeCategory, localizedOutdoorGuidance } from './adviceTemplates.mjs';

const URGENT_SYMPTOMS = new RegExp([
  String.raw`chest\s+(?:pain|tightness|pressure)`,
  String.raw`(?:severe|extreme)\s+(?:breathlessness|shortness of breath|short of breath|breathing (?:difficulty|trouble|problem))`,
  String.raw`(?:shortness of breath|short of breath|breathlessness)`,
  String.raw`(?:difficulty|trouble|hard|struggling|unable|difficult)\s+(?:to\s+)?breathe?`,
  String.raw`(?:difficulty|trouble)\s+breathing`,
  String.raw`(?:can['’]?t|cannot|couldn['’]?t)\s+(?:(?:catch|take)(?:\s+(?:my|a))?\s+)?breath(?:e)?`,
  String.raw`(?:blue|bluish|grey|gray)\s+(?:lips|face)|(?:lips|face)\s+(?:(?:look|are|seem|turn(?:ing)?)\s+)?(?:blue|bluish|grey|gray)`,
  String.raw`wheez(?:e|ing)?|gasp(?:ing)?(?:\s+for\s+breath)?|faint(?:ed|ing)?|passed out|acute asthma|asthma attack`,
  String.raw`सीने में\s*(?:दर्द|जकड़न|दबाव)|छाती में\s*(?:दर्द|जकड़न|दबाव)`,
  String.raw`(?:साँस|सांस)\s*(?:लेने में\s*)?(?:बहुत\s*)?(?:कठिनाई|दिक्कत|परेशानी|मुश्किल)|(?:साँस|सांस)\s+नहीं\s+(?:आ रही|ले पा रहा|ले पा रही)`,
  String.raw`(?:होंठ|चेहरा)\s+(?:नीले|नीला)\s+(?:पड़ रहे|पड़ रहा|हो रहे|हो रहा)`,
  String.raw`दम\s+घुट|घरघराहट|दमा\s+का\s+दौरा|बेहोश|होश\s+खो`,
  String.raw`saans\s+(?:nahi|nahin)\s+aa\s+rahi|saans\s+lene\s+mein\s+(?:takleef|dikkat)|seene\s+mein\s+(?:dard|jakdan)`,
  String.raw`ਛਾਤੀ ਵਿੱਚ\s*(?:ਦਰਦ|ਜਕੜਨ|ਦਬਾਅ)|ਸੀਨੇ ਵਿੱਚ\s*(?:ਦਰਦ|ਜਕੜਨ|ਦਬਾਅ)`,
  String.raw`ਸਾਹ\s*(?:ਲੈਣ ਵਿੱਚ\s*)?(?:ਬਹੁਤ\s*)?(?:ਔਖ|ਮੁਸ਼ਕਲ|ਦਿੱਕਤ)|ਸਾਹ\s+ਨਹੀਂ\s+(?:ਆ ਰਿਹਾ|ਲੈ ਹੋ ਰਿਹਾ)`,
  String.raw`(?:ਬੁੱਲ੍ਹ|ਚਿਹਰਾ)\s+(?:ਨੀਲੇ|ਨੀਲਾ)\s+(?:ਪੈ ਰਹੇ|ਪੈ ਰਿਹਾ|ਹੋ ਰਹੇ|ਹੋ ਰਿਹਾ)`,
  String.raw`ਘਰਘਰਾਹਟ|ਹੱਫ(?:ਣਾ|ਣ|ਦਾ|\s+ਰਿਹਾ|\s+ਰਹੀ)|ਦਮੇ\s+ਦਾ\s+ਦੌਰਾ|ਬੇਹੋਸ਼|ਹੋਸ਼\s+ਗੁਆ`,
  String.raw`saah\s+(?:nahi|nahin)\s+aa\s+reha|saah\s+chadh(?:di|da)\s+(?:hai|aa)`
].join('|'), 'iu');

/** @type {Array<['indoor' | 'community' | 'commute' | 'impact' | 'outdoor', RegExp]>} */
const TOPIC_PATTERNS = [
  ['indoor', /\b(?:plants?|houseplants?|filters?|purifiers?|indoors?|ventilat\w*|kitchens?|cook(?:ing)?|dust|incense|windows?)\b|घर के अंदर|अंदर की हवा|हवा साफ|खिड़की|रसोई|पौधे|घरेलू पौधे|फ़िल्टर|सफ़ाई|ਘਰ ਅੰਦਰ|ਘਰ ਦੀ ਹਵਾ|ਹਵਾ ਸਾਫ਼|ਖਿੜਕੀ|ਰਸੋਈ|ਬੂਟੇ|ਫ਼ਿਲਟਰ/iu],
  ['community', /\b(?:community|neighbou?rs?|idle|idling|carpool(?:ing)?|shared rides?|anti-idling)\b|सामुदायिक|समुदाय|पड़ोसी|साझा यात्रा|इंजन चालू|भाईचारा|ਭਾਈਚਾਰਾ|ਭਾਈਚਾਰਕ|ਗੁਆਂਢੀ|ਸਾਂਝੀ ਯਾਤਰਾ|ਇੰਜਣ ਚਾਲੂ/iu],
  ['commute', /\b(?:commut\w*|school run|traffic|transit|bus|metro|routes?)\b|यात्रा|आना-जाना|स्कूल जाना|ट्रैफ़िक|बस|मेट्रो|सफ़र|ਆਉਣਾ-ਜਾਣਾ|ਸਫ਼ਰ|ਸਕੂਲ ਜਾਣਾ|ਟ੍ਰੈਫ਼ਿਕ|ਬੱਸ|ਮੈਟਰੋ|ਰਸਤਾ/iu],
  ['impact', /\b(?:impact|benefit|percent(?:age)?|estimate|reduc\w+ exposure)\b|असर|लाभ|अनुमान|संपर्क कम|ਅਸਰ|ਲਾਭ|ਅੰਦਾਜ਼ਾ|ਸੰਪਰਕ ਘਟਾਉ/iu],
  ['outdoor', /\b(?:run(?:ning)?|walk(?:ing)?|exercis\w*|outdoors?|sports?|play(?:ing)?|mornings?|evenings?|aqi)\b|बाहर|व्यायाम|दौड़ना|चलना|खेलना|सुबह|शाम|ਬਾਹਰ|ਕਸਰਤ|ਦੌੜਨਾ|ਤੁਰਨਾ|ਖੇਡਣਾ|ਸਵੇਰ|ਸ਼ਾਮ/iu]
];

const PRIORITIES = {
  indoor: ['plants-and-filtration', 'cleaner-indoor-air', 'cooking-source-control', 'plan-outdoor-time'],
  community: ['coordinate-community-action', 'lower-emission-routine', 'plan-outdoor-time'],
  commute: ['lower-emission-routine', 'plan-outdoor-time', 'cleaner-indoor-air'],
  outdoor: ['plan-outdoor-time', 'cleaner-indoor-air', 'lower-emission-routine'],
  impact: ['lower-emission-routine', 'cleaner-indoor-air', 'plan-outdoor-time']
};

/** @param {string} language @returns {'en' | 'hi' | 'pa'} */
function resolveLanguage(language) {
  if (language === 'en' || language === 'hi' || language === 'pa') return language;
  return 'en';
}

/**
 * @param {string} id
 * @param {'en' | 'hi' | 'pa'} language
 * @param {Record<string, string | number>} [values]
 * @param {{ action?: string, actionVariant?: string, assumptionVariant?: string, effort?: number }} [options]
 */
function recommendation(id, language, values = {}, options = {}) {
  const template = ADVICE_TEMPLATES[language].recommendations[id];
  const actionTemplate = options.action || (typeof template.action === 'string'
    ? template.action
    : template.action[options.actionVariant]);
  const impact = template.impact;
  return {
    id,
    title: interpolate(template.title, values),
    action: interpolate(actionTemplate, values),
    why: interpolate(template.why, values),
    impact: {
      metric: interpolate(impact.metric, values),
      value: interpolate(impact.value, values),
      unit: interpolate(impact.unit, values),
      confidence: 'low'
    },
    assumptions: (Array.isArray(template.assumptions) ? template.assumptions : [template.assumptions[options.assumptionVariant]])
      .map((assumption) => interpolate(assumption, values)),
    effort: options.effort ?? 1
  };
}

/** @param {unknown} message */
export function isUrgentQuestion(message) {
  return URGENT_SYMPTOMS.test(typeof message === 'string' ? message : '');
}

/** @param {unknown} message @returns {'indoor' | 'community' | 'commute' | 'impact' | 'outdoor' | null} */
export function questionTopic(message) {
  const text = typeof message === 'string' ? message : String(message ?? '');
  return TOPIC_PATTERNS.find(([, pattern]) => pattern.test(text))?.[0] ?? null;
}

/**
 * @typedef {{ adults?: number, children?: number, elderly?: number, conditions?: string[], commute?: string,
 *   cookingFuel?: string, homeType?: string, purifierOwned?: string, monthlyBudgetBand?: string }} AdviceProfile
 * @typedef {{ name?: string, aqi?: number | null, pm25?: number | null, isLive?: boolean, isCached?: boolean,
 *   staleHours?: number, cleanestWindow?: string | null, cleanestWindowPeakAqi?: number | null }} AdviceAirData
 * @typedef {{ role: 'user' | 'assistant', content: string }} AdviceHistoryTurn
 * @typedef {{ message?: string, airData?: AdviceAirData, profile?: AdviceProfile | null, language?: 'en' | 'hi' | 'pa',
 *   history?: AdviceHistoryTurn[], groundMonitor?: unknown }} AdviceInput
 */
/** Deterministic offline guidance. It intentionally avoids unmeasured numeric benefits.
 * @param {AdviceInput} [input]
 */
export function generateRuleBasedAdvice({ message = '', airData = {}, profile = {}, language = 'en', history = [], groundMonitor = null } = {}) {
  const locale = resolveLanguage(language);
  const copy = ADVICE_TEMPLATES[locale];
  const query = String(message).toLocaleLowerCase(locale);
  profile = profile && typeof profile === 'object' && !Array.isArray(profile) ? profile : {};
  airData = airData && typeof airData === 'object' && !Array.isArray(airData) ? airData : {};
  const city = typeof airData.name === 'string' ? airData.name : 'your area';
  const aqi = airData.isLive && !airData.isCached ? normalizeAqi(airData.aqi) : null;
  const hasCurrentReading = aqi !== null;
  const category = getUsAqiCategory(aqi);
  const localizedCategory = localizeCategory(category, locale);
  const conditions = Array.isArray(profile.conditions) ? profile.conditions : [];
  const hasSensitiveHouseholdMember = isSensitiveHousehold(profile);

  if (isUrgentQuestion(message)) {
    return {
      summary: copy.messages.urgentSummary,
      recommendations: [recommendation('urgent-help', locale)],
      followUp: null
    };
  }

  const recommendations = [];
  if (/\b(?:plants?|houseplants?)\b|घरेलू पौधे|पौधे|ਘਰੇਲੂ ਬੂਟੇ|ਬੂਟੇ/iu.test(query)) {
    recommendations.push(recommendation('plants-and-filtration', locale, {}, { effort: 2 }));
  }

  const hasCleaner = ['portable', 'diy'].includes(profile.purifierOwned);
  recommendations.push(recommendation(
    'cleaner-indoor-air',
    locale,
    {},
    { actionVariant: hasCleaner ? 'withEquipment' : 'withoutEquipment', effort: hasCleaner ? 2 : 1 }
  ));

  const forecastPeak = normalizeAqi(airData.cleanestWindowPeakAqi);
  const currentWindow = hasCurrentReading && forecastPeak !== null && forecastPeak < aqi
    && typeof airData.cleanestWindow === 'string' && airData.cleanestWindow
    ? airData.cleanestWindow
    : null;
  let outdoorAction = localizedOutdoorGuidance(aqi, hasSensitiveHouseholdMember, locale);
  if (currentWindow) {
    outdoorAction += interpolate(copy.messages.lowerWindow, {
      window: currentWindow,
      peak: forecastPeak,
      category: localizeCategory(getUsAqiCategory(forecastPeak), locale),
      guidance: localizedOutdoorGuidance(forecastPeak, hasSensitiveHouseholdMember, locale)
    });
  }
  recommendations.push(recommendation('plan-outdoor-time', locale, {}, {
    action: outdoorAction,
    assumptionVariant: hasCurrentReading ? 'live' : 'unavailable',
    effort: 1
  }));

  const activeCommute = ['two_wheeler', 'walk', 'cycle'].includes(profile.commute);
  recommendations.push(recommendation(
    'lower-emission-routine',
    locale,
    {},
    { actionVariant: activeCommute ? 'activeCommute' : 'otherCommute', effort: 1 }
  ));

  if (profile.cookingFuel && profile.cookingFuel !== 'electric_induction') {
    recommendations.push(recommendation('cooking-source-control', locale, {}, { effort: 1 }));
  }

  const priorQuestion = history.findLast((turn) => turn.role === 'user');
  const topic = questionTopic(message) || questionTopic(priorQuestion?.content || '');
  if (topic === 'community') {
    recommendations.push(recommendation('coordinate-community-action', locale));
  }

  const priorities = PRIORITIES[topic];
  const prioritized = priorities
    ? [...priorities.map((id) => recommendations.find((item) => item.id === id)).filter(Boolean),
      ...recommendations.filter((item) => !priorities.includes(item.id))]
    : recommendations;
  const outdoor = recommendations.find((item) => item.id === 'plan-outdoor-time');
  const ordered = aqi > 300 ? [outdoor, ...prioritized.filter((item) => item !== outdoor)] : prioritized;

  const pm25 = airData.pm25 != null && Number.isFinite(Number(airData.pm25))
    ? interpolate(copy.messages.pm25, { value: Number(airData.pm25).toFixed(1) })
    : '';
  const dataNote = hasCurrentReading
    ? interpolate(copy.messages.liveData, { city, aqi, category: localizedCategory, pm25 })
    : airData.isCached
      ? interpolate(copy.messages.cachedData, { city, age: airData.staleHours || 'an unknown number of' })
      : interpolate(copy.messages.unavailableData, { city });
  const groundMonitorNote = formatGroundMonitorNote(groundMonitor, locale);
  const summary = [groundMonitorNote, dataNote, copy.messages[hasSensitiveHouseholdMember ? 'sensitiveHousehold' : 'generalHousehold']]
    .filter(Boolean).join(' ').slice(0, 500);

  return {
    summary,
    recommendations: ordered.slice(0, 4),
    followUp: conditions.some((condition) => condition === 'asthma' || condition === 'heart')
      ? copy.messages.knownConditionFollowUp
      : copy.messages.generalFollowUp
  };
}
