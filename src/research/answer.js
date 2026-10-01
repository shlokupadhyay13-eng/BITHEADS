/**
 * @file answer.js
 * @description AI Grounded Question & Answering service over document chunks.
 */

import { defaultGeminiClient } from '../ai/services/geminiClient.js';
import { QA_SYSTEM_PROMPT, buildQaUserPrompt } from '../ai/prompts/qa.js';
import { SCHEMAS, validateSchema } from '../ai/schemas/index.js';
import { guardEvidence } from '../ai/services/evidenceGuard.js';
import { retrieveRelevantChunks } from './retrieveChunks.js';
import { AppError, ERROR_CODES } from '../utils/errors.js';

/**
 * Answers a question based strictly on document excerpts.
 * @param {Object} document - Processed document object { chunks: Array<Object>, documentId: string }
 * @param {string} question - Question query string
 * @param {Object} [options]
 * @param {Object} [options.client] - Injected Gemini client
 * @returns {Promise<Object>} Answer object with grounded evidence and confidence
 */
export async function answerQuestion(document, question, options = {}) {
  if (!document || !Array.isArray(document.chunks) || document.chunks.length === 0) {
    throw new AppError(
      ERROR_CODES.INVALID_INPUT,
      'Invalid document input. Must provide a valid document object containing non-empty chunks array.'
    );
  }

  if (!question || typeof question !== 'string' || question.trim().length === 0) {
    throw new AppError(
      ERROR_CODES.INVALID_INPUT,
      'Invalid question input. Question must be a non-empty string.'
    );
  }

  const client = options.client || defaultGeminiClient;
  const selectedChunks = retrieveRelevantChunks(document.chunks, question, { maxChunks: 8 });

  const userPrompt = buildQaUserPrompt(question, selectedChunks);

  const rawResponse = await client.generateJson({
    systemInstruction: QA_SYSTEM_PROMPT,
    userPrompt,
    responseSchema: SCHEMAS.answer
  });

  validateSchema('answer', rawResponse);

  const guardedResult = guardEvidence(rawResponse, selectedChunks, 'answer');

  return guardedResult;
}
