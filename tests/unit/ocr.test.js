/**
 * @file ocr.test.js
 * @description Unit tests for OCR interface.
 */

import { describe, it, expect } from 'vitest';
import { runOcr } from '../../src/documents/ocr.js';
import { AppError, ERROR_CODES } from '../../src/utils/errors.js';

describe('runOcr', () => {
  it('should throw OCR_NOT_CONFIGURED when no provider is passed', async () => {
    const buffer = Buffer.from('test');
    await expect(runOcr(buffer)).rejects.toThrow(AppError);

    try {
      await runOcr(buffer);
    } catch (err) {
      expect(err.code).toBe(ERROR_CODES.OCR_NOT_CONFIGURED);
    }
  });

  it('should process document successfully using a mock provider', async () => {
    const mockProvider = {
      name: 'TestOcrEngine',
      recognize: async () => [
        { pageNumber: 1, text: 'OCR Extracted Page 1 Text' },
        { pageNumber: 2, text: 'OCR Extracted Page 2 Text' }
      ]
    };

    const result = await runOcr(Buffer.from('fake pdf'), { provider: mockProvider });
    expect(result).toHaveLength(2);
    expect(result[0].pageNumber).toBe(1);
    expect(result[0].text).toBe('OCR Extracted Page 1 Text');
  });
});
