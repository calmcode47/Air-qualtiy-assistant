import { generateRuleBasedAdvice, isUrgentQuestion } from '../../../shared/advice.mjs';

export const ADVICE_QUESTION_LIMIT = 600;
const ADVICE_TIMEOUT_MS = 35000;
const HISTORY_LIMIT = 6;
const TURN_LENGTH_LIMIT = 1200;
const ADVICE_MODES = new Set(['local-guidance', 'safety-guidance', 'gemini-guidance']);

function toHistoryTurn(item) {
  const isUser = item.sender === 'user';
  const content = isUser ? item.text : [
    item.advice.summary,
    ...item.advice.recommendations.map(({ action }) => action)
  ].join(' ');
  return { role: isUser ? 'user' : 'assistant', content: content.slice(0, TURN_LENGTH_LIMIT) };
}

export function createAdviceInput({ message, householdProfile, cityData, groundMonitor, language, chatHistory }) {
  const { adults, children, elderly, conditions, commute, cookingFuel, homeType, purifierOwned, monthlyBudgetBand } = householdProfile;
  const { name, aqi, pm25, isLive, isCached, staleHours, cleanestWindow, cleanestWindowPeakAqi } = cityData ?? {};

  return {
    message,
    profile: { adults, children, elderly, conditions, commute, cookingFuel, homeType, purifierOwned, monthlyBudgetBand },
    airData: { name, aqi, pm25, isLive, isCached, staleHours, cleanestWindow, cleanestWindowPeakAqi },
    groundMonitor: groundMonitor?.status === 'available' ? groundMonitor : undefined,
    language,
    history: chatHistory.slice(-HISTORY_LIMIT).map(toHistoryTurn)
  };
}

function isRenderableRecommendation(item) {
  const { id, title, action, why, impact, assumptions } = item ?? {};
  return [id, title, action, why, impact?.value, impact?.unit].every((value) => typeof value === 'string')
    && impact?.confidence === 'low'
    && Array.isArray(assumptions) && assumptions.every((value) => typeof value === 'string');
}

function parseResponse(result) {
  const { mode, ...advice } = result ?? {};
  if (!ADVICE_MODES.has(mode) || typeof advice.summary !== 'string'
    || !Array.isArray(advice.recommendations) || advice.recommendations.length < 1
    || !advice.recommendations.every(isRenderableRecommendation)
    || (advice.followUp != null && typeof advice.followUp !== 'string')) {
    throw new Error('The assistant returned an invalid response.');
  }
  return { advice, mode };
}

export async function requestAdvice(input, signal) {
  if (signal.aborted) return null;
  if (isUrgentQuestion(input.message)) {
    return { advice: generateRuleBasedAdvice(input), mode: 'safety-guidance' };
  }

  try {
    const response = await fetch('/api/advice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.any([signal, AbortSignal.timeout(ADVICE_TIMEOUT_MS)]),
      body: JSON.stringify(input)
    });
    if (!response.ok) throw new Error('Advice service unavailable.');
    const result = await response.json();
    return signal.aborted ? null : parseResponse(result);
  } catch {
    if (signal.aborted) return null;
    return { advice: generateRuleBasedAdvice(input), mode: 'local-guidance' };
  }
}
