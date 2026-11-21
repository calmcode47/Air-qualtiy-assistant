import { describe, it, expect } from 'vitest';
import {
  deriveActionPlan,
  deriveVulnerabilities,
  derivePriorityHacks,
  HOUSEHOLD_PERSONAS
} from './householdPersonas.js';

describe('Household Combinable Rules Engine', () => {
  it('contains the 5 standard persona presets', () => {
    expect(HOUSEHOLD_PERSONAS).toHaveLength(5);
    expect(HOUSEHOLD_PERSONAS.map((p) => p.id)).toEqual([
      'family',
      'commuter',
      'elderly',
      'apartment',
      'budget'
    ]);
  });

  it('tailors outdoor guidance when children and a two-wheeler commute are present', () => {
    const profile = {
      children: 2,
      adults: 2,
      elderly: 0,
      commute: 'two_wheeler',
      conditions: []
    };
    const actions = deriveActionPlan(profile, { cleanestWindow: '1:30 PM–3:30 PM', name: 'Delhi NCR', isLive: true, aqi: 180 });
    expect(actions).toHaveLength(3);
    expect(actions[0].title).toContain('Compare the lower forecast period');
    expect(actions[0].description).toContain('US AQI');
    expect(actions[0].description).not.toMatch(/\d+%/);
  });

  it('uses cautious language for older adults or asthma', () => {
    const profile = {
      children: 0,
      adults: 1,
      elderly: 1,
      conditions: ['asthma'],
      commute: 'walk'
    };
    const actions = deriveActionPlan(profile, { cleanestWindow: '1:00 PM – 3:00 PM', name: 'Delhi' });
    expect(actions[0].description).toContain('No live reading');
    expect(actions[1].description).toContain('Reduce indoor particle sources');
  });

  it('generates low-cost DIY recommendations when budget is low or purifier is none', () => {
    const profile = { children: 1, monthlyBudgetBand: 'low', purifierOwned: 'none' };
    const actions = deriveActionPlan(profile, {});
    expect(actions[1].title).toContain('source control');
    const priorityHacks = derivePriorityHacks(profile);
    expect(priorityHacks.some((h) => h.id === 'source-control')).toBe(true);
  });

  it('retains general cooking and travel guidance when profile details are incomplete', () => {
    const profile = {
      homeType: 'apartment',
      children: 0,
      elderly: 0,
      conditions: [],
      monthlyBudgetBand: 'medium',
      purifierOwned: 'portable'
    };
    const actions = deriveActionPlan(profile, {});
    expect(actions[2].title).toContain('Reduce indoor and travel sources');
    expect(actions[2].description).toContain('Use a kitchen hood vented outdoors');
  });

  it('returns specific vulnerability notes for profile attributes', () => {
    const profile = {
      children: 1,
      elderly: 1,
      conditions: ['asthma', 'heart'],
      commute: 'two_wheeler',
      homeType: 'apartment'
    };
    const notes = deriveVulnerabilities(profile);
    expect(notes.length).toBeGreaterThanOrEqual(4);
    expect(notes.some((n) => n.includes('Children are among'))).toBe(true);
    expect(notes.some((n) => n.includes('personal plan provided by a clinician'))).toBe(true);
    expect(notes.some((n) => n.includes('Walking, cycling'))).toBe(true);
  });
});
