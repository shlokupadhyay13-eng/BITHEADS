/**
 * @file validateFile.js
 * @description Validates PDF file input by inspecting extension, MIME type, buffer size, magic bytes, and PDF parsing capability.
 */

import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { AppError, ERROR_CODES } from '../utils/errors.js';

const DEFAULT_MAX_FILE_SIZE_MB = 20;

/**
 * Validates an incoming PDF document input.
 * @param {Object} input
 * @param {Buffer|Uint8Array} input.buffer - File binary buffer
 * @param {string} input.filename - Name of the file
 * @param {string} input.mimeType - MIME type of the file
 * @returns {Promise<boolean>} Resolves true if valid
 * @throws {AppError} INVALID_FILE, FILE_TOO_LARGE, or CORRUPT_PDF
 */
export async function validateFile({ buffer, filename, mimeType }) {
  if (!filename || typeof filename !== 'string' || !filename.toLowerCase().endsWith('.pdf')) {
    throw new AppError(
      ERROR_CODES.INVALID_FILE,
      'Invalid file format. File must have a .pdf extension.',
      { filename, mimeType }
    );
  }

  const validMimetypes = ['application/pdf', 'application/x-pdf', 'application/acrobat', 'applications/vnd.pdf'];
  if (!mimeType || typeof mimeType !== 'string' || !validMimetypes.includes(mimeType.toLowerCase())) {
    throw new AppError(
      ERROR_CODES.INVALID_FILE,
      'Invalid MIME type. Expected application/pdf.',
      { filename, mimeType }
    );
  }

  if (!buffer || !(Buffer.isBuffer(buffer) || buffer instanceof Uint8Array) || buffer.length === 0) {
    throw new AppError(
      ERROR_CODES.INVALID_FILE,
      'File buffer is empty or invalid.',
      { filename }
    );
  }

  const maxMb = Number(process.env.MAX_FILE_SIZE_MB) || DEFAULT_MAX_FILE_SIZE_MB;
  const maxBytes = maxMb * 1024 * 1024;

  if (buffer.length > maxBytes) {
    throw new AppError(
      ERROR_CODES.FILE_TOO_LARGE,
      `File size (${(buffer.length / (1024 * 1024)).toFixed(2)} MB) exceeds maximum allowed limit of ${maxMb} MB.`,
      { sizeBytes: buffer.length, maxBytes }
    );
  }

  // Check magic bytes %PDF- (0x25 0x50 0x44 0x46 0x2D)
  const magicBytes = Buffer.from(buffer.subarray(0, 5)).toString('utf8');
  if (magicBytes !== '%PDF-') {
    throw new AppError(
      ERROR_CODES.CORRUPT_PDF,
      'Invalid PDF header magic bytes. File does not appear to be a valid PDF.',
      { magicBytes }
    );
  }

  // Corruption test via pdfjs-dist
  try {
    const uint8Data = new Uint8Array(buffer);
    const loadingTask = pdfjsLib.getDocument({
      data: uint8Data,
      useSystemFonts: true,
      isEvalSupported: false
    });
    const pdfDocument = await loadingTask.promise;
    if (!pdfDocument || pdfDocument.numPages <= 0) {
      throw new Error('PDF has 0 pages');
    }
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(
      ERROR_CODES.CORRUPT_PDF,
      `Failed to parse PDF document structure: ${err.message}`,
      { originalError: err.message }
    );
  }

  return true;
}
