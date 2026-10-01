/**
 * @file geminiClient.js
 * @description Single backend Gemini API integration wrapper with retry, JSON mode, and schema validation.
 */

import { GoogleGenAI } from '@google/genai';
import { AppError, ERROR_CODES } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';

const DEFAULT_MODEL = 'gemini-2.5-flash';
const MAX_RETRIES = 2;

/**
 * Creates a Gemini Client instance.
 * @param {Object} [options]
 * @param {any} [options.sdk] - Optional mock or pre-configured SDK instance for testing
 * @param {string} [options.apiKey] - Explicit API key (defaults to process.env.GEMINI_API_KEY)
 * @param {string} [options.model] - Explicit Gemini model (defaults to process.env.GEMINI_MODEL or gemini-2.5-flash)
 */
export function createGeminiClient(options = {}) {
  const apiKey = options.apiKey || process.env.GEMINI_API_KEY;
  const modelName = options.model || process.env.GEMINI_MODEL || DEFAULT_MODEL;
  
  let aiSdk = options.sdk;
  if (!aiSdk && apiKey) {
    aiSdk = new GoogleGenAI({ apiKey });
  }

  return {
    modelName,

    /**
     * Generates structured JSON response from Gemini model given prompts and schema.
     * @param {Object} params
     * @param {string} params.systemInstruction - System instruction prompt
     * @param {string} params.userPrompt - User prompt containing formatted document excerpts
     * @param {Object} [params.responseSchema] - Optional OpenAPI JSON schema object
     * @returns {Promise<Object>} Parsed JSON response from Gemini
     */
    async generateJson({ systemInstruction, userPrompt, responseSchema }) {
      if (!apiKey && !options.sdk) {
        throw new AppError(
          ERROR_CODES.CONFIG_MISSING_API_KEY,
          'GEMINI_API_KEY environment variable is not configured.'
        );
      }

      let attempts = 0;
      let lastError = null;

      while (attempts <= MAX_RETRIES) {
        try {
          attempts++;
          logger.debug('Sending request to Gemini API', { model: modelName, attempt: attempts });

          const config = {
            temperature: 0.1,
            responseMimeType: 'application/json'
          };

          if (systemInstruction) {
            config.systemInstruction = systemInstruction;
          }

          if (responseSchema) {
            config.responseSchema = responseSchema;
          }

          let responseText;

          if (aiSdk && typeof aiSdk.models?.generateContent === 'function') {
            const result = await aiSdk.models.generateContent({
              model: modelName,
              contents: userPrompt,
              config
            });
            responseText = result.text || (result.response && result.response.text ? result.response.text() : '');
          } else if (aiSdk && typeof aiSdk.generateJson === 'function') {
            // Mock SDK convenience hook
            return await aiSdk.generateJson({ systemInstruction, userPrompt, responseSchema });
          } else {
            throw new AppError(
              ERROR_CODES.AI_REQUEST_FAILED,
              'Invalid SDK instance or client initialization failure.'
            );
          }

          if (!responseText || typeof responseText !== 'string') {
            throw new AppError(
              ERROR_CODES.AI_INVALID_RESPONSE,
              'Gemini API returned an empty response string.'
            );
          }

          // Parse JSON output
          try {
            const parsed = JSON.parse(responseText);
            return parsed;
          } catch (jsonErr) {
            logger.warn('Failed to parse Gemini JSON response', { attempt: attempts, error: jsonErr.message });
            if (attempts > MAX_RETRIES) {
              throw new AppError(
                ERROR_CODES.AI_INVALID_RESPONSE,
                `Gemini response is not valid JSON: ${jsonErr.message}`,
                { rawResponseText: responseText }
              );
            }
          }
        } catch (err) {
          lastError = err;
          if (err instanceof AppError) {
            if (err.code === ERROR_CODES.CONFIG_MISSING_API_KEY) throw err;
            if (attempts > MAX_RETRIES) throw err;
          } else {
            logger.warn('Gemini API call failed', { attempt: attempts, error: err.message });
            if (attempts > MAX_RETRIES) {
              throw new AppError(
                ERROR_CODES.AI_REQUEST_FAILED,
                `Gemini API request failed after ${MAX_RETRIES + 1} attempts: ${err.message}`,
                { originalError: err.message }
              );
            }
          }
        }
      }

      throw lastError || new AppError(ERROR_CODES.AI_REQUEST_FAILED, 'Gemini request failed.');
    }
  };
}

export const defaultGeminiClient = createGeminiClient();
