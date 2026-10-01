/**
 * @file textQuality.test.js
 * @description Unit tests for text quality analysis and OCR requirement detection.
 */

import { describe, it, expect } from 'vitest';
import { analyzeTextQuality } from '../../src/documents/textQuality.js';

describe('analyzeTextQuality', () => {
  it('should pass quality check for clean, high-character pages', () => {
    const pages = [
      { pageNumber: 1, text: 'This is a high quality government report with sufficient characters on page one.'.repeat(3), charCount: 240 },
      { pageNumber: 2, text: 'This is page two containing detailed explanations of budget allocation and guidelines.'.repeat(3), charCount: 260 }
    ];
    const quality = analyzeTextQuality(pages);
    expect(quality.isUsable).toBe(true);
    expect(quality.needsOcr).toBe(false);
    expect(quality.emptyPages).toEqual([]);
    expect(quality.lowQualityPages).toEqual([]);
  });

  it('should flag empty and low-character pages as needing OCR', () => {
    const pages = [
      { pageNumber: 1, text: '', charCount: 0 },
      { pageNumber: 2, text: 'Hi', charCount: 2 }
    ];
    const quality = analyzeTextQuality(pages);
    expect(quality.needsOcr).toBe(true);
    expect(quality.emptyPages).toContain(1);
    expect(quality.lowQualityPages).toEqual([1, 2]);
  });
});
