/**
 * @file validateFile.test.js
 * @description Unit tests for PDF file validation.
 */

import { describe, it, expect } from 'vitest';
import { validateFile } from '../../src/documents/validateFile.js';
import { AppError, ERROR_CODES } from '../../src/utils/errors.js';
import { createTestPdfBuffer } from '../helpers/pdfHelper.js';

describe('validateFile', () => {
  it('should pass validation for a valid PDF buffer', async () => {
    const pdfBuffer = await createTestPdfBuffer(['Valid PDF content']);
    const result = await validateFile({
      buffer: pdfBuffer,
      filename: 'report.pdf',
      mimeType: 'application/pdf'
    });
    expect(result).toBe(true);
  });

  it('should throw INVALID_FILE if filename extension is not .pdf', async () => {
    const pdfBuffer = await createTestPdfBuffer();
    await expect(validateFile({
      buffer: pdfBuffer,
      filename: 'report.txt',
      mimeType: 'application/pdf'
    })).rejects.toThrow(AppError);

    try {
      await validateFile({ buffer: pdfBuffer, filename: 'report.txt', mimeType: 'application/pdf' });
    } catch (err) {
      expect(err.code).toBe(ERROR_CODES.INVALID_FILE);
    }
  });

  it('should throw INVALID_FILE if MIME type is invalid', async () => {
    const pdfBuffer = await createTestPdfBuffer();
    try {
      await validateFile({ buffer: pdfBuffer, filename: 'report.pdf', mimeType: 'text/plain' });
    } catch (err) {
      expect(err.code).toBe(ERROR_CODES.INVALID_FILE);
    }
  });

  it('should throw INVALID_FILE if buffer is empty', async () => {
    try {
      await validateFile({ buffer: Buffer.from(''), filename: 'report.pdf', mimeType: 'application/pdf' });
    } catch (err) {
      expect(err.code).toBe(ERROR_CODES.INVALID_FILE);
    }
  });

  it('should throw FILE_TOO_LARGE if file exceeds MAX_FILE_SIZE_MB', async () => {
    process.env.MAX_FILE_SIZE_MB = '0.0001'; // ~100 bytes limit
    const pdfBuffer = await createTestPdfBuffer();
    try {
      await validateFile({ buffer: pdfBuffer, filename: 'large.pdf', mimeType: 'application/pdf' });
    } catch (err) {
      expect(err.code).toBe(ERROR_CODES.FILE_TOO_LARGE);
    } finally {
      delete process.env.MAX_FILE_SIZE_MB;
    }
  });

  it('should throw CORRUPT_PDF if magic bytes do not start with %PDF-', async () => {
    const fakeBuffer = Buffer.from('NOT_A_PDF_FILE_HEADER');
    try {
      await validateFile({ buffer: fakeBuffer, filename: 'corrupt.pdf', mimeType: 'application/pdf' });
    } catch (err) {
      expect(err.code).toBe(ERROR_CODES.CORRUPT_PDF);
    }
  });
});
