/**
 * @file summarize.js
 * @description AI Document Summarization service.
 */

import { defaultGeminiClient } from '../ai/services/geminiClient.js';
import { SUMMARY_SYSTEM_PROMPT, buildSummaryUserPrompt } from '../ai/prompts/summary.js';
import { SCHEMAS, validateSchema } from '../ai/schemas/index.js';
import { guardEvidence } from '../ai/services/evidenceGuard.js';
import { retrieveRelevantChunks } from './retrieveChunks.js';
import { AppError, ERROR_CODES } from '../utils/errors.js';

/**
 * Summarizes a processed document into a short overview and evidence-grounded key points.
 * @param {Object} document - Processed document object { chunks: Array<Object>, documentId: string }
 * @param {Object} [options]
 * @param {Object} [options.client] - Injected Gemini client
 * @returns {Promise<Object>} Summary object with grounded evidence
 */
export async function summarizeDocument(document, options = {}) {
  if (!document || !Array.isArray(document.chunks) || document.chunks.length === 0) {
    throw new AppError(
      ERROR_CODES.INVALID_INPUT,
      'Invalid document input. Must provide a valid document object containing non-empty chunks array.'
    );
  }

  const client = options.client || defaultGeminiClient;
  const selectedChunks = retrieveRelevantChunks(document.chunks, 'summary executive summary key findings policy background objectives', { maxChunks: 12 });

  const userPrompt = buildSummaryUserPrompt(selectedChunks);

  const rawResponse = await client.generateJson({
    systemInstruction: SUMMARY_SYSTEM_PROMPT,
    userPrompt,
    responseSchema: SCHEMAS.summary
  });

  validateSchema('summary', rawResponse);

  const guardedResult = guardEvidence(rawResponse, selectedChunks, 'summary');

  return guardedResult;
}
