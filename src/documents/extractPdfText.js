/**
 * @file extractPdfText.js
 * @description Extracts page-by-page text content from a PDF document using pdfjs-dist.
 */

import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { AppError, ERROR_CODES } from '../utils/errors.js';

/**
 * Extracts per-page text from a PDF buffer.
 * @param {Buffer|Uint8Array} buffer - Validated PDF binary buffer
 * @returns {Promise<{ pageCount: number, pages: Array<{ pageNumber: number, text: string, charCount: number }> }>}
 */
export async function extractPdfText(buffer) {
  try {
    const uint8Data = new Uint8Array(buffer);
    const loadingTask = pdfjsLib.getDocument({
      data: uint8Data,
      useSystemFonts: true,
      isEvalSupported: false
    });
    const pdfDocument = await loadingTask.promise;
    const pageCount = pdfDocument.numPages;

    const pages = [];

    for (let i = 1; i <= pageCount; i++) {
      const page = await pdfDocument.getPage(i);
      const textContent = await page.getTextContent();
      
      // Reconstruct text maintaining items and spaces
      let pageTextParts = [];
      for (const item of textContent.items) {
        if (typeof item.str === 'string') {
          pageTextParts.push(item.str);
          if (item.hasEOL) {
            pageTextParts.push('\n');
          }
        }
      }

      const rawText = pageTextParts.join(' ').replace(/ \n /g, '\n').trim();

      pages.push({
        pageNumber: i,
        text: rawText,
        charCount: rawText.length
      });
    }

    return {
      pageCount,
      pages
    };
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(
      ERROR_CODES.CORRUPT_PDF,
      `Failed to extract text from PDF: ${err.message}`,
      { originalError: err.message }
    );
  }
}
