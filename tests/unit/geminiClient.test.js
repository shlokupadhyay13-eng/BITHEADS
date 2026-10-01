/**
 * @file geminiClient.test.js
 * @description Unit tests for Gemini API client and error handling.
 */

import { describe, it, expect } from 'vitest';
import { createGeminiClient } from '../../src/ai/services/geminiClient.js';
import { AppError, ERROR_CODES } from '../../src/utils/errors.js';

describe('geminiClient', () => {
  it('should throw CONFIG_MISSING_API_KEY when no API key is provided', async () => {
    const client = createGeminiClient({ apiKey: '' });
    const oldKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    await expect(client.generateJson({ userPrompt: 'test' })).rejects.toThrow(AppError);

    try {
      await client.generateJson({ userPrompt: 'test' });
    } catch (err) {
      expect(err.code).toBe(ERROR_CODES.CONFIG_MISSING_API_KEY);
    } finally {
      if (oldKey) process.env.GEMINI_API_KEY = oldKey;
    }
  });

  it('should retry on invalid JSON and throw AI_INVALID_RESPONSE after retries', async () => {
    let callCount = 0;
    const mockSdk = {
      models: {
        generateContent: async () => {
          callCount++;
          return { text: 'NOT_VALID_JSON' };
        }
      }
    };

    const client = createGeminiClient({ sdk: mockSdk, apiKey: 'dummy-key' });

    try {
      await client.generateJson({ userPrompt: 'test' });
    } catch (err) {
      expect(err.code).toBe(ERROR_CODES.AI_INVALID_RESPONSE);
      expect(callCount).toBe(3); // Initial + 2 retries
    }
  });
});
