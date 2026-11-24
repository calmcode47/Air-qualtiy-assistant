import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAdviceInput, requestAdvice } from './advisor';

afterEach(() => vi.unstubAllGlobals());

describe('advisor request', () => {
  it('falls back when an API reply contains an incomplete recommendation', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({
      summary: 'Advice',
      mode: 'gemini-guidance',
      recommendations: [null]
    })));

    const result = await requestAdvice({ message: 'How can I reduce indoor particles?' }, new AbortController().signal);

    expect(result.mode).toBe('local-guidance');
    expect(result.advice.recommendations.map(({ id }) => id)).toContain('cleaner-indoor-air');
  });

  it('keeps urgent questions on the device', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    const result = await requestAdvice({ message: 'I cannot breathe' }, new AbortController().signal);

    expect(result.mode).toBe('safety-guidance');
    expect(result.advice.recommendations.map(({ id }) => id)).toEqual(['urgent-help']);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('does not display a reply when the request is cancelled during response parsing', async () => {
    const controller = new AbortController();
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => {
        controller.abort();
        return { summary: 'Late response', recommendations: [] };
      }
    })));

    await expect(requestAdvice({ message: 'What about tomorrow?' }, controller.signal)).resolves.toBeNull();
  });

  it('sends only the supported profile and reading fields', () => {
    const input = createAdviceInput({
      message: 'What about tomorrow?',
      householdProfile: { adults: 2, calibratedIndoorPm25: 120 },
      cityData: { name: 'Delhi', aqi: 180, lat: 28.61, lon: 77.21 },
      language: 'en',
      chatHistory: [{ sender: 'user', text: 'How do I plan outdoor time?' }]
    });

    const payload = JSON.parse(JSON.stringify(input));
    expect(payload.profile).toEqual({ adults: 2 });
    expect(payload.airData).toEqual({ name: 'Delhi', aqi: 180 });
    expect(payload.history).toEqual([{ role: 'user', content: 'How do I plan outdoor time?' }]);
  });
});
