import { AdviceResponseSchema } from './schema.js';
import { groundAirContext } from './airContext.js';
import { structuredLog } from './logging.js';
import { generateRuleBasedAdvice, isUrgentQuestion } from '../shared/advice.mjs';

/**
 * @typedef {import('zod').output<typeof import('./schema.js').AdviceRequestSchema>} AdviceRequest
 * @typedef {AdviceRequest & { airData: ReturnType<typeof groundAirContext> }} GroundedAdviceRequest
 * @typedef {((input: GroundedAdviceRequest, options?: { signal?: AbortSignal }) => Promise<unknown>) & {
 *   model?: string, checkModel?: () => Promise<unknown>
 * }} Advisor
 * @typedef {Partial<Pick<Console, 'info' | 'warn' | 'error' | 'log'>>} Logger
 */

export const DEFAULT_GEMINI_DAILY_LIMIT = 10;

export function parseGeminiDailyLimit(value) {
  if (value === undefined || value.trim() === '') return DEFAULT_GEMINI_DAILY_LIMIT;
  const limit = Number(value);
  if (!Number.isSafeInteger(limit) || limit < 0) {
    throw new Error('AURA_GEMINI_DAILY_LIMIT must be a non-negative integer.');
  }
  return limit;
}

function createDailyGeminiBudget(limit, now) {
  let day = '';
  let used = 0;

  return {
    reserve() {
      const currentDay = new Date(now()).toISOString().slice(0, 10);
      if (currentDay !== day) {
        day = currentDay;
        used = 0;
      }
      if (used >= limit) return null;

      used += 1;
      const reservedDay = day;
      let released = false;
      return {
        release() {
          if (released) return;
          if (day === reservedDay) used -= 1;
          released = true;
        }
      };
    }
  };
}

function sanitizedProviderError(error) {
  let providerError;
  if (typeof error?.message === 'string') {
    try {
      providerError = JSON.parse(error.message)?.error;
    } catch {
      providerError = null;
    }
  }
  const message = typeof providerError?.message === 'string'
    ? providerError.message
      .replace(/AIza[\w-]{20,}/gu, '[API key removed]')
      .replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/giu, '[email removed]')
      .replace(/(?<!\d)(?:\+?\d[ .()-]*){10,15}(?!\d)/gu, '[phone removed]')
      .slice(0, 240)
    : undefined;
  return {
    name: typeof error?.name === 'string' ? error.name.slice(0, 100) : 'Error',
    status: Number.isInteger(error?.status)
      ? error.status
      : Number.isInteger(providerError?.code) ? providerError.code : undefined,
    code: typeof providerError?.status === 'string'
      ? providerError.status.slice(0, 100)
      : typeof error?.code === 'string' ? error.code.slice(0, 100) : undefined,
    message
  };
}

/** @param {{ advisor: Advisor | null, geminiDailyLimit: number, now: () => number, logger: Logger }} options */
export function createAdviceService({ advisor, geminiDailyLimit, now, logger }) {
  if (!Number.isSafeInteger(geminiDailyLimit) || geminiDailyLimit < 0) {
    throw new Error('geminiDailyLimit must be a non-negative integer.');
  }
  const geminiBudget = createDailyGeminiBudget(geminiDailyLimit, now);
  const liveAdvisorEnabled = typeof advisor === 'function';
  const providerHealth = {
    status: liveAdvisorEnabled ? 'checking' : 'disabled',
    model: liveAdvisorEnabled && typeof advisor.model === 'string' ? advisor.model : null
  };
  let providerCheckStarted = false;

  async function runStartupModelCheck() {
    if (typeof advisor?.checkModel !== 'function' || providerCheckStarted) return;
    providerCheckStarted = true;
    if (!geminiBudget.reserve()) {
      providerHealth.status = 'skipped_daily_limit';
      structuredLog(logger, 'warn', {
        timestamp: new Date().toISOString(),
        event: 'gemini_startup_check_skipped',
        model: providerHealth.model,
        reason: 'daily_limit_reached'
      });
      return;
    }

    try {
      await advisor.checkModel();
      providerHealth.status = 'ready';
      structuredLog(logger, 'info', {
        timestamp: new Date().toISOString(),
        event: 'gemini_startup_check_succeeded',
        model: providerHealth.model
      });
    } catch (error) {
      providerHealth.status = 'unavailable';
      structuredLog(logger, 'warn', {
        timestamp: new Date().toISOString(),
        event: 'gemini_startup_check_failed',
        model: providerHealth.model,
        error: sanitizedProviderError(error)
      });
    }
  }

  function getHealth() {
    return {
      assistantMode: liveAdvisorEnabled ? 'gemini-guidance' : 'local-guidance',
      liveAdvisorEnabled,
      provider: { ...providerHealth }
    };
  }

  /**
   * @param {AdviceRequest} request
   * @param {{ signal: AbortSignal, requestId: string }} context
   */
  async function answer(request, { signal, requestId }) {
    const input = { ...request, airData: groundAirContext(request.airData) };
    const urgent = isUrgentQuestion(request.message);
    const reservation = !urgent && advisor ? geminiBudget.reserve() : null;
    if (reservation) {
      try {
        const response = await advisor(input, { signal });
        signal.throwIfAborted();
        return { ...AdviceResponseSchema.parse(response), mode: 'gemini-guidance' };
      } catch (error) {
        if (error?.code === 'ADVISOR_BUSY') reservation.release();
        signal.throwIfAborted();
        if (error?.code !== 'ADVISOR_BUSY') {
          structuredLog(logger, 'warn', {
            timestamp: new Date().toISOString(),
            event: 'gemini_advice_failed',
            requestId,
            method: 'POST',
            path: '/api/advice',
            error: sanitizedProviderError(error)
          });
        }
      }
    }

    const response = AdviceResponseSchema.parse(generateRuleBasedAdvice(input));
    return { ...response, mode: urgent ? 'safety-guidance' : 'local-guidance' };
  }

  return { answer, getHealth, runStartupModelCheck };
}
