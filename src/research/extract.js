/**
 * @file extract.js
 * @description AI Policy Information Extraction service.
 */

import { defaultGeminiClient } from '../ai/services/geminiClient.js';
import { EXTRACTION_SYSTEM_PROMPT, buildExtractionUserPrompt } from '../ai/prompts/extraction.js';
import { SCHEMAS, validateSchema } from '../ai/schemas/index.js';
import { guardEvidence } from '../ai/services/evidenceGuard.js';
import { retrieveRelevantChunks } from './retrieveChunks.js';
import { AppError, ERROR_CODES } from '../utils/errors.js';

/**
 * Extracts structured policy information from a processed document.
 * @param {Object} document - Processed document object { chunks: Array<Object>, documentId: string }
 * @param {Object} [options]
 * @param {Object} [options.client] - Injected Gemini client
 * @returns {Promise<Object>} Extracted policy object with grounded evidence
 */
export async function extractPolicyInformation(document, options = {}) {
  if (!document || !Array.isArray(document.chunks) || document.chunks.length === 0) {
    throw new AppError(
      ERROR_CODES.INVALID_INPUT,
      'Invalid document input. Must provide a valid document object containing non-empty chunks array.'
    );
  }

  const client = options.client || defaultGeminiClient;
  const selectedChunks = retrieveRelevantChunks(document.chunks, 'policy objectives beneficiaries budget effective date key provisions', { maxChunks: 12 });

  const userPrompt = buildExtractionUserPrompt(selectedChunks);
  
  const rawResponse = await client.generateJson({
    systemInstruction: EXTRACTION_SYSTEM_PROMPT,
    userPrompt,
    responseSchema: SCHEMAS.policyExtraction
  });

  validateSchema('policyExtraction', rawResponse);

  const guardedResult = guardEvidence(rawResponse, selectedChunks, 'policyExtraction');

  return guardedResult;
}
