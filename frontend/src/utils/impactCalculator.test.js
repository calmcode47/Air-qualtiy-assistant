import { describe, it, expect } from 'vitest';
import { calculateLedgerTotals } from './impactCalculator';

describe('calculateLedgerTotals', () => {
  const targetDate = new Date('2026-11-21T12:00:00Z');

  it('returns empty counts for an empty log', () => {
    const result = calculateLedgerTotals({ log: [], targetDate });
    expect(result.dailyChoiceCount).toBe(0);
    expect(result.weeklyChoiceCount).toBe(0);
    expect(result.todayEntries).toHaveLength(0);
    expect(result.weekEntries).toHaveLength(0);
  });

  it('counts logged choices without inferring a personal exposure reduction', () => {
    const result = calculateLedgerTotals({
      log: [
        { swapId: 'swap_metro_bus', date: '2026-11-21' },
        { swapId: 'swap_clean_cooking', date: '2026-11-21' }
      ],
      targetDate
    });
    expect(result.dailyChoiceCount).toBe(2);
    expect(result.weeklyChoiceCount).toBe(2);
    expect(result.todayEntries.map((entry) => entry.swap.category)).toEqual(['travel', 'cooking']);
    expect(result).not.toHaveProperty('dailyPmAvoided');
  });

  it('deduplicates repeated records for the same choice on a date', () => {
    const result = calculateLedgerTotals({
      log: [
        { swapId: 'swap_metro_bus', date: '2026-11-21' },
        { swapId: 'swap_metro_bus', date: '2026-11-21' },
        { swapId: 'swap_clean_cooking', date: '2026-11-21' }
      ],
      targetDate
    });
    expect(result.dailyChoiceCount).toBe(2);
    expect(result.todayEntries).toHaveLength(2);
  });

  it('counts distinct logged choices in the seven-day window only', () => {
    const result = calculateLedgerTotals({
      log: [
        { swapId: 'swap_clean_cooking', date: '2026-11-21' },
        { swapId: 'swap_clean_cooking', date: '2026-11-20' },
        { swapId: 'swap_bedroom_purifier', date: '2026-11-16' },
        { swapId: 'swap_metro_bus', date: '2026-11-10' }
      ],
      targetDate
    });
    expect(result.dailyChoiceCount).toBe(1);
    expect(result.weeklyChoiceCount).toBe(3);
    expect(result.todayEntries).toHaveLength(1);
    expect(result.weekEntries).toHaveLength(3);
  });

  it('ignores unknown swap identifiers and future dates', () => {
    const result = calculateLedgerTotals({
      log: [
        { swapId: 'unknown', date: '2026-11-21' },
        { swapId: 'swap_metro_bus', date: '2026-11-22' }
      ],
      targetDate
    });
    expect(result.dailyChoiceCount).toBe(0);
    expect(result.weeklyChoiceCount).toBe(0);
  });
});
