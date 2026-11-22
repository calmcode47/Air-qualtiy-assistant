import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGeminiAdvisor } from './geminiAdvice.js';

test('Gemini advisor exposes a bounded metadata check for its configured model', async () => {
  let request;
  const advisor = createGeminiAdvisor({
    apiKey: 'test-key',
    model: 'gemini-test-flash',
    client: {
      models: {
        get: async (options) => {
          request = options;
          return { name: 'models/gemini-test-flash' };
        }
      }
    }
  });

  assert.equal(advisor.model, 'gemini-test-flash');
  assert.deepEqual(await advisor.checkModel(), { name: 'models/gemini-test-flash' });
  assert.equal(request.model, 'gemini-test-flash');
  assert.ok(request.config.abortSignal instanceof AbortSignal);
});
