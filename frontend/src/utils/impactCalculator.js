import { getSwapById } from '../data/swaps.js';

function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Summarize actions a household logged. This deliberately counts choices rather
 * than estimating personal PM exposure without indoor measurements.
 */
export function calculateLedgerTotals({ log = [], targetDate = new Date() } = {}) {
  const target = targetDate instanceof Date ? targetDate : new Date(targetDate);
  if (!Number.isFinite(target.getTime())) throw new TypeError('targetDate must be a valid date');
  const targetKey = dateKey(target);
  const targetMidnightUtc = Date.parse(`${targetKey}T00:00:00Z`);
  const seen = new Set();
  const entries = [];

  if (Array.isArray(log)) {
    for (const entry of log) {
      if (!entry || typeof entry.swapId !== 'string') continue;
      const swap = getSwapById(entry.swapId);
      if (!swap) continue;

      let day = typeof entry.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(entry.date)
        ? entry.date
        : null;
      if (!day && entry.timestamp != null) {
        const timestamp = new Date(entry.timestamp);
        if (Number.isFinite(timestamp.getTime())) day = dateKey(timestamp);
      }
      if (!day) day = targetKey;

      const key = `${entry.swapId}__${day}`;
      if (seen.has(key)) continue;
      seen.add(key);
      entries.push({ ...entry, date: day, swap });
    }
  }

  const todayEntries = entries.filter((entry) => entry.date === targetKey);
  const weekEntries = entries.filter((entry) => {
    const dayUtc = Date.parse(`${entry.date}T00:00:00Z`);
    const difference = targetMidnightUtc - dayUtc;
    return difference >= 0 && difference < 7 * 24 * 60 * 60 * 1000;
  });

  return {
    todayEntries,
    weekEntries,
    dailyChoiceCount: todayEntries.length,
    weeklyChoiceCount: weekEntries.length,
    dailyCategories: [...new Set(todayEntries.map((entry) => entry.swap.category))],
    weeklyCategories: [...new Set(weekEntries.map((entry) => entry.swap.category))]
  };
}
