/**
 * @file ocr.js
 * @description OCR execution interface for scanned documents. Requires an injected OCR provider.
 */

import { AppError, ERROR_CODES } from '../utils/errors.js';

/**
 * Runs OCR on a document buffer using an external OCR provider interface.
 * @param {Buffer|Uint8Array} buffer - PDF or document image binary buffer
 * @param {Object} options
 * @param {Object} [options.provider] - Injected OCR provider { name: string, recognize: (buffer) => Promise<Array<{ pageNumber: number, text: string }>> }
 * @returns {Promise<Array<{ pageNumber: number, text: string, charCount: number }>>}
 * @throws {AppError} OCR_NOT_CONFIGURED if provider is missing or invalid
 */
export async function runOcr(buffer, options = {}) {
  const provider = options.provider;

  if (!provider || typeof provider.recognize !== 'function') {
    throw new AppError(
      ERROR_CODES.OCR_NOT_CONFIGURED,
      'OCR processing requested but no valid OCR provider has been configured.',
      { providerName: provider ? provider.name : null }
    );
  }

  try {
    const rawPages = await provider.recognize(buffer);
    if (!Array.isArray(rawPages)) {
      throw new Error('OCR provider recognized output must be an array of page objects');
    }

    return rawPages.map((page, idx) => ({
      pageNumber: page.pageNumber || (idx + 1),
      text: typeof page.text === 'string' ? page.text : '',
      charCount: (typeof page.text === 'string' ? page.text : '').length
    }));
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(
      ERROR_CODES.OCR_NOT_CONFIGURED,
      `OCR recognition failed: ${err.message}`,
      { originalError: err.message }
    );
  }
}
