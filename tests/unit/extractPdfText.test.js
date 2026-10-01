/**
 * @file extractPdfText.test.js
 * @description Unit tests for PDF page text extraction.
 */

import { describe, it, expect } from 'vitest';
import { extractPdfText } from '../../src/documents/extractPdfText.js';
import { createTestPdfBuffer } from '../helpers/pdfHelper.js';

describe('extractPdfText', () => {
  it('should extract text page-by-page with 1-based page numbers', async () => {
    const page1Text = 'Government Policy Document Page One Header Text.';
    const page2Text = 'Section 2 Policy Details and Objectives.';
    const pdfBuffer = await createTestPdfBuffer([page1Text, page2Text]);

    const result = await extractPdfText(pdfBuffer);
    expect(result.pageCount).toBe(2);
    expect(result.pages).toHaveLength(2);
    expect(result.pages[0].pageNumber).toBe(1);
    expect(result.pages[0].text).toContain('Government Policy');
    expect(result.pages[1].pageNumber).toBe(2);
    expect(result.pages[1].text).toContain('Section 2 Policy Details');
  });
});
