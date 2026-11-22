import { describe, expect, it } from 'vitest';
import { generateRuleBasedAdvice, isUrgentQuestion, questionTopic } from '../../../shared/advice.mjs';
import { localizeCategory, localizedOutdoorGuidance } from '../../../shared/adviceTemplates.mjs';

const urgentPhrases = {
  en: [
    'difficulty breathing', 'hard to breathe', 'short of breath', 'shortness of breath',
    'wheezing', 'I fainted', 'gasping for breath', 'chest pressure', 'I cannot catch my breath',
    'gray face', 'asthma attack'
  ],
  hi: [
    'सीने में दर्द', 'छाती में जकड़न', 'साँस लेने में कठिनाई', 'सांस लेने में दिक्कत',
    'सांस नहीं आ रही', 'होंठ नीले पड़ रहे हैं', 'दमा का दौरा', 'बेहोश हो गया'
  ],
  pa: [
    'ਛਾਤੀ ਵਿੱਚ ਦਰਦ', 'ਸੀਨੇ ਵਿੱਚ ਜਕੜਨ', 'ਸਾਹ ਲੈਣ ਵਿੱਚ ਮੁਸ਼ਕਲ', 'ਸਾਹ ਨਹੀਂ ਆ ਰਿਹਾ',
    'ਬੁੱਲ੍ਹ ਨੀਲੇ ਪੈ ਰਹੇ ਹਨ', 'ਘਰਘਰਾਹਟ', 'ਹੱਫ ਰਿਹਾ', 'ਦਮੇ ਦਾ ਦੌਰਾ', 'ਬੇਹੋਸ਼ ਹੋ ਗਿਆ'
  ]
};

describe('shared/advice.mjs urgent symptoms', () => {
  it.each(Object.entries(urgentPhrases))('recognizes urgent phrasings in %s', (language, phrases) => {
    for (const phrase of phrases) {
      expect(isUrgentQuestion(phrase), phrase).toBe(true);
      const advice = generateRuleBasedAdvice({ message: phrase, language });
      expect(advice.recommendations[0].id).toBe('urgent-help');
      expect(advice.followUp).toBeNull();
    }
  });

  it('accepts alternate spelling and ignores unrelated messages', () => {
    expect(isUrgentQuestion('My lips look gray')).toBe(true);
    expect(isUrgentQuestion('Couldn’t catch my breath')).toBe(true);
    expect(isUrgentQuestion('Cannot catch breath')).toBe(true);
    expect(isUrgentQuestion('The air feels bad today')).toBe(false);
  });
});

describe('shared/advice.mjs topic detection', () => {
  it('uses English word boundaries to avoid substring matches', () => {
    expect(questionTopic('I am going for a run')).toBe('outdoor');
    expect(questionTopic('I have a brunch meeting')).toBeNull();
    expect(questionTopic('Will taking the bus help?')).toBe('commute');
    expect(questionTopic('I work in a business district')).toBeNull();
  });

  it('recognizes Hindi and Punjabi topic terms', () => {
    expect(questionTopic('घर के अंदर हवा साफ़ कैसे रखें?')).toBe('indoor');
    expect(questionTopic('क्या मैं बाहर व्यायाम करूँ?')).toBe('outdoor');
    expect(questionTopic('ਸਾਂਝੀ ਯਾਤਰਾ ਨਾਲ ਟ੍ਰੈਫ਼ਿਕ ਘਟੇਗਾ?')).toBe('community');
    expect(questionTopic('ਬਾਹਰ ਕਸਰਤ ਕਰਨੀ ਠੀਕ ਹੈ?')).toBe('outdoor');
  });
});

describe('shared/advice.mjs localized rules', () => {
  it.each(['hi', 'pa'])('returns localized recommendation fields for %s', (language) => {
    const advice = generateRuleBasedAdvice({
      language,
      message: language === 'hi' ? 'घर के अंदर हवा के बारे में क्या करें?' : 'ਘਰ ਅੰਦਰ ਹਵਾ ਲਈ ਕੀ ਕਰੀਏ?',
      profile: { children: 1, purifierOwned: 'none', cookingFuel: 'lpg' },
      airData: {
        name: 'Delhi', aqi: 180, isLive: true, pm25: 42.3,
        cleanestWindow: '2:00–4:00 PM', cleanestWindowPeakAqi: 150
      }
    });
    expect(advice.summary).toContain('Delhi');
    expect(advice.recommendations.length).toBeGreaterThan(0);
    expect(advice.recommendations.every((item) => item.title && item.action && item.why && item.impact.value)).toBe(true);
    expect(advice.recommendations.every((item) => item.impact.confidence === 'low')).toBe(true);
    expect(advice.recommendations.map((item) => item.impact.value).join(' ')).not.toMatch(/[\d%‰٪]/u);
  });

  it('localizes health categories and outdoor guidance across AQI bands', () => {
    expect(localizeCategory('Hazardous', 'hi')).toBe('खतरनाक');
    expect(localizeCategory('Unavailable', 'pa')).toBe('ਉਪਲਬਧ ਨਹੀਂ');
    expect(localizedOutdoorGuidance(null, false, 'hi')).toMatch(/स्थानीय/u);
    expect(localizedOutdoorGuidance(305, true, 'pa')).toMatch(/ਬਾਹਰ ਕਸਰਤ ਨਾ ਕਰੋ/u);
    expect(localizedOutdoorGuidance(220, true, 'hi')).toMatch(/संवेदनशील/u);
    expect(localizedOutdoorGuidance(220, false, 'pa')).toMatch(/ਲੰਮੇ ਸਮੇਂ/u);
    expect(localizedOutdoorGuidance(180, true, 'hi')).toMatch(/ਵਿਰਾਮ|विराम/u);
    expect(localizedOutdoorGuidance(130, true, 'pa')).toMatch(/ਸੰਵੇਦਨਸ਼ੀਲ/u);
    expect(localizedOutdoorGuidance(80, false, 'pa')).toMatch(/ਸਥਾਨਕ/u);
    expect(localizedOutdoorGuidance(80, false, 'en')).toMatch(/Use current local guidance/u);
  });

  it('falls back to English for an unsupported language and keeps forecast periods comparative', () => {
    const advice = generateRuleBasedAdvice({
      language: 'fr', message: 'When should I go out?',
      airData: { isLive: true, aqi: 190, cleanestWindow: '3–5 PM', cleanestWindowPeakAqi: 140 }
    });
    expect(advice.summary).toMatch(/Live model estimate/u);
    const outdoor = advice.recommendations.find((item) => item.id === 'plan-outdoor-time');
    expect(outdoor.action).toMatch(/comparatively lower period/u);
    expect(outdoor.action).not.toMatch(/safe window/u);
  });

  it('uses localized ground-station context and safely omits invalid monitors', () => {
    const monitor = {
      status: 'available', locationName: 'Anand Vihar', distanceKm: 1.2,
      measurements: [{ parameter: 'PM2.5', value: 42.3, observedAt: '2026-11-22T11:00:00Z' }]
    };
    const hindi = generateRuleBasedAdvice({ language: 'hi', message: 'क्या करें?', groundMonitor: monitor });
    expect(hindi.summary).toMatch(/CPCB स्टेशन/u);
    expect(hindi.summary).toMatch(/आपके स्थान की रीडिंग नहीं/u);
    const withoutMonitor = generateRuleBasedAdvice({ message: 'What should I do?', groundMonitor: { status: 'unavailable' } });
    expect(withoutMonitor.summary).not.toMatch(/Nearby CPCB/u);
  });
});
