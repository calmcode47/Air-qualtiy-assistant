import { describe, it, expect, beforeEach } from 'vitest';
import i18n from './i18n';
import enTranslation from './locales/en/translation.json';
import hiTranslation from './locales/hi/translation.json';
import paTranslation from './locales/pa/translation.json';

describe('i18n internationalization and locale bundle tests', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
  });

  it('loads English translation by default and retrieves expected hero values', () => {
    expect(i18n.t('app.title')).toBe('Aura');
    expect(i18n.t('hero.outdoor_aqi')).toBe('Outdoor Air');
    expect(i18n.t('simple_terms.sanctuary_twin')).toBe('Your home');
  });

  it('switches cleanly to Hindi and resolves localized phrases', async () => {
    await i18n.changeLanguage('hi');
    expect(i18n.language).toMatch(/^hi/);
    expect(i18n.t('app.title')).toBe('ऑरा');
    expect(i18n.t('hero.outdoor_aqi')).toBe('बाहर की हवा');
    expect(i18n.t('simple_terms.sanctuary_twin')).toBe('आपका घर');
    expect(i18n.t('mask_guide.nav_link')).toContain('रेस्पिरेटर');
  });

  it('switches cleanly to Punjabi and resolves localized phrases', async () => {
    await i18n.changeLanguage('pa');
    expect(i18n.language).toMatch(/^pa/);
    expect(i18n.t('app.title')).toBe('ਔਰਾ');
    expect(i18n.t('hero.outdoor_aqi')).toBe('ਬਾਹਰਲੀ ਹਵਾ');
    expect(i18n.t('simple_terms.sanctuary_twin')).toBe('ਤੁਹਾਡਾ ਘਰ');
    expect(i18n.t('mask_guide.nav_link')).toContain('ਰੈਸਪੀਰੇਟਰ');
  });

  it('verifies essential parity between EN, HI, and PA locale keys', () => {
    const enKeys = Object.keys(enTranslation);
    const hiKeys = Object.keys(hiTranslation);
    const paKeys = Object.keys(paTranslation);

    expect(hiKeys).toEqual(expect.arrayContaining(enKeys));
    expect(paKeys).toEqual(expect.arrayContaining(enKeys));

    // Check specific subkeys
    expect(Object.keys(hiTranslation.hero)).toEqual(Object.keys(enTranslation.hero));
    expect(Object.keys(paTranslation.hero)).toEqual(Object.keys(enTranslation.hero));
    expect(Object.keys(hiTranslation.mask_guide)).toEqual(Object.keys(enTranslation.mask_guide));
    expect(Object.keys(paTranslation.glossary)).toEqual(Object.keys(enTranslation.glossary));
    expect(Object.keys(hiTranslation.ledger)).toEqual(Object.keys(enTranslation.ledger));
    expect(Object.keys(paTranslation.ledger)).toEqual(Object.keys(enTranslation.ledger));
  });

  it('interpolates dynamic variables in all languages', async () => {
    // English
    await i18n.changeLanguage('en');
    expect(i18n.t('hero.status_summary', { category: 'Very Poor', city: 'Delhi' })).toBe(
      'The reported air-quality category is Very Poor for Delhi.'
    );

    // Hindi
    await i18n.changeLanguage('hi');
    expect(i18n.t('hero.status_summary', { category: 'बहुत खराब', city: 'दिल्ली' })).toBe(
      'दिल्ली के लिए रिपोर्ट की गई वायु गुणवत्ता श्रेणी बहुत खराब है।'
    );

    // Punjabi
    await i18n.changeLanguage('pa');
    expect(i18n.t('hero.status_summary', { category: 'ਬਹੁਤ ਖ਼ਰਾਬ', city: 'ਦਿੱਲੀ' })).toBe(
      'ਦਿੱਲੀ ਲਈ ਰਿਪੋਰਟ ਕੀਤੀ ਹਵਾ ਗੁਣਵੱਤਾ ਸ਼੍ਰੇਣੀ ਬਹੁਤ ਖ਼ਰਾਬ ਹੈ।'
    );
  });
});
