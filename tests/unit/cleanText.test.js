/**
 * @file cleanText.test.js
 * @description Unit tests for conservative text cleaning.
 */

import { describe, it, expect } from 'vitest';
import { cleanText } from '../../src/documents/cleanText.js';

describe('cleanText', () => {
  it('should fix hyphenation and remove recurring headers without altering numbers, dates, or legal wording', () => {
    const pages = [
      { pageNumber: 1, text: 'CONFIDENTIAL GOVERNMENT REPORT 2026\ngov-\nernment policy effective on 2026-05-15 with $50,000,000 budget.' },
      { pageNumber: 2, text: 'CONFIDENTIAL GOVERNMENT REPORT 2026\nSection 2.1 provisions apply to 85% of citizens.' },
      { pageNumber: 3, text: 'CONFIDENTIAL GOVERNMENT REPORT 2026\nFinal summary.' }
    ];

    const result = cleanText(pages);
    expect(result.removedLines).toContain('CONFIDENTIAL GOVERNMENT REPORT 2026');
    expect(result.pages[0].text).toContain('government policy');
    expect(result.pages[0].text).toContain('2026-05-15');
    expect(result.pages[0].text).toContain('$50,000,000');
    expect(result.pages[1].text).toContain('Section 2.1');
    expect(result.pages[1].text).toContain('85%');
  });
});
