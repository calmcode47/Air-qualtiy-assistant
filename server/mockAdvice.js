import { generateRuleBasedAdvice } from '../shared/advice.mjs';

/** Safe deterministic guidance used when Gemini is disabled or unavailable. */
export function generateMockAdvice(input = {}) {
  return generateRuleBasedAdvice(input);
}
