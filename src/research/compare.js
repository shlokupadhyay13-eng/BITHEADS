/**
 * @file compare.js
 * @description AI Comparative Policy Analysis service for two documents.
 */

import { defaultGeminiClient } from '../ai/services/geminiClient.js';
import { COMPARISON_SYSTEM_PROMPT, buildComparisonUserPrompt } from '../ai/prompts/comparison.js';
import { SCHEMAS, validateSchema } from '../ai/schemas/index.js';
import { guardEvidence } from '../ai/services/evidenceGuard.js';
import { retrieveRelevantChunks } from './retrieveChunks.js';
import { AppError, ERROR_CODES } from '../utils/errors.js';

/**
 * Compares two processed policy documents.
 * @param {Object} documentA - Processed Document A
 * @param {Object} documentB - Processed Document B
 * @param {Object} [options]
 * @param {Object} [options.client] - Injected Gemini client
 * @returns {Promise<Object>} Comparison result object with grounded evidence for both documents
 */
export async function compareDocuments(documentA, documentB, options = {}) {
  if (!documentA || !Array.isArray(documentA.chunks) || documentA.chunks.length === 0) {
    throw new AppError(
      ERROR_CODES.INVALID_INPUT,
      'Invalid documentA input. Must provide a valid document object containing non-empty chunks array.'
    );
  }

  if (!documentB || !Array.isArray(documentB.chunks) || documentB.chunks.length === 0) {
    throw new AppError(
      ERROR_CODES.INVALID_INPUT,
      'Invalid documentB input. Must provide a valid document object containing non-empty chunks array.'
    );
  }

  const client = options.client || defaultGeminiClient;

  const queryTerms = 'policy comparison objectives provisions scope budget effective date target audience';
  const chunksA = retrieveRelevantChunks(documentA.chunks, queryTerms, { maxChunks: 6 });
  const chunksB = retrieveRelevantChunks(documentB.chunks, queryTerms, { maxChunks: 6 });

  const userPrompt = buildComparisonUserPrompt(chunksA, chunksB);

  const rawResponse = await client.generateJson({
    systemInstruction: COMPARISON_SYSTEM_PROMPT,
    userPrompt,
    responseSchema: SCHEMAS.comparison
  });

  validateSchema('comparison', rawResponse);

  const guardedResult = guardEvidence(rawResponse, { chunksA, chunksB }, 'comparison');

  return guardedResult;
}
