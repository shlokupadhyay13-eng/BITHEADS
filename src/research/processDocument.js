/**
 * @file processDocument.js
 * @description Internal service function orchestrating document validation, extraction, quality check, cleaning, and chunking.
 */

import crypto from 'crypto';
import { validateFile } from '../documents/validateFile.js';
import { extractPdfText } from '../documents/extractPdfText.js';
import { analyzeTextQuality } from '../documents/textQuality.js';
import { runOcr } from '../documents/ocr.js';
import { cleanText } from '../documents/cleanText.js';
import { chunkPages } from '../documents/chunkPages.js';
import { AppError, ERROR_CODES } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

/**
 * Processes an in-memory PDF document buffer through the full Document Intelligence pipeline.
 * @param {Object} input
 * @param {Buffer|Uint8Array} input.buffer - Raw PDF binary buffer
 * @param {string} input.filename - Name of PDF file
 * @param {string} input.mimeType - MIME type of file (e.g. 'application/pdf')
 * @param {string} [input.documentId] - Optional document UUID (generated if missing)
 * @param {Object} [input.ocrProvider] - Optional injected OCR provider
 * @returns {Promise<{ documentId: string, filename: string, pageCount: number, chunks: Array<Object>, quality: Object, warnings: string[], ocrUsed: boolean }>}
 */
export async function processDocument({ buffer, filename, mimeType, documentId, ocrProvider }) {
  const docId = documentId || crypto.randomUUID();
  const startTime = Date.now();

  logger.info('Beginning document processing', { documentId: docId, filename });

  // 1. Validate file
  await validateFile({ buffer, filename, mimeType });

  // 2. Extract PDF text page-by-page
  const extractionResult = await extractPdfText(buffer);
  let pages = extractionResult.pages;
  const pageCount = extractionResult.pageCount;

  // 3. Analyze text quality
  let quality = analyzeTextQuality(pages);
  const warnings = [...quality.reasons];
  let ocrUsed = false;

  // 4. Handle OCR fallback if required
  if (quality.needsOcr) {
    if (!ocrProvider) {
      if (!quality.isUsable) {
        throw new AppError(
          ERROR_CODES.INSUFFICIENT_TEXT,
          'Document contains non-usable text or scanned images and no OCR provider was configured.',
          { documentId: docId, pageCount, reasons: quality.reasons }
        );
      }
      warnings.push('Document text quality is low, but proceeding without OCR because no provider was passed.');
    } else {
      logger.info('Document requires OCR, executing OCR provider', { documentId: docId });
      const ocrPages = await runOcr(buffer, { provider: ocrProvider });
      pages = ocrPages;
      ocrUsed = true;
      quality = analyzeTextQuality(pages);
    }
  }

  // 5. Clean text
  const cleaningResult = cleanText(pages);

  // 6. Chunk pages
  const chunks = chunkPages({ documentId: docId, pages: cleaningResult.pages });

  const durationMs = Date.now() - startTime;
  logger.info('Document processing completed successfully', {
    documentId: docId,
    pageCount,
    chunkCount: chunks.length,
    ocrUsed,
    durationMs
  });

  return {
    documentId: docId,
    filename,
    pageCount,
    chunks,
    quality,
    warnings,
    ocrUsed
  };
}
