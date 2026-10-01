/**
 * @file textQuality.js
 * @description Analyzes PDF text quality, detects empty/corrupt pages, and determines if OCR is required.
 */

const DEFAULT_MIN_TEXT_CHARS_PER_PAGE = 50;

/**
 * Analyzes extracted PDF pages for text quality, character counts, and noise.
 * @param {Array<{ pageNumber: number, text: string, charCount: number }>} pages - Array of extracted page objects
 * @returns {{ isUsable: boolean, needsOcr: boolean, avgCharsPerPage: number, emptyPages: number[], lowQualityPages: number[], reasons: string[] }}
 */
export function analyzeTextQuality(pages) {
  const minChars = Number(process.env.MIN_TEXT_CHARS_PER_PAGE) || DEFAULT_MIN_TEXT_CHARS_PER_PAGE;
  const pageCount = pages ? pages.length : 0;

  if (!pages || pageCount === 0) {
    return {
      isUsable: false,
      needsOcr: true,
      avgCharsPerPage: 0,
      emptyPages: [],
      lowQualityPages: [],
      reasons: ['No pages found in document']
    };
  }

  let totalChars = 0;
  const emptyPages = [];
  const lowQualityPages = [];
  const reasons = [];

  for (const page of pages) {
    const text = page.text || '';
    const charCount = text.trim().length;
    totalChars += charCount;

    if (charCount === 0) {
      emptyPages.push(page.pageNumber);
      lowQualityPages.push(page.pageNumber);
      continue;
    }

    if (charCount < minChars) {
      lowQualityPages.push(page.pageNumber);
      continue;
    }

    // Check garbage / non-alphanumeric ratio (excluding standard punctuation and whitespace)
    const alphanumericCount = (text.match(/[a-zA-Z0-9\s.,;:!?'"()\-[\]{}/$%&]/g) || []).length;
    const garbageRatio = (text.length - alphanumericCount) / text.length;

    if (garbageRatio > 0.40) {
      lowQualityPages.push(page.pageNumber);
    }
  }

  const avgCharsPerPage = Math.round(totalChars / pageCount);
  const lowQualityRatio = lowQualityPages.length / pageCount;

  if (emptyPages.length > 0) {
    reasons.push(`${emptyPages.length} out of ${pageCount} page(s) have 0 text characters.`);
  }

  if (lowQualityPages.length > 0) {
    reasons.push(`${lowQualityPages.length} out of ${pageCount} page(s) fell below quality threshold (${minChars} chars/page or high noise ratio).`);
  }

  if (avgCharsPerPage < minChars) {
    reasons.push(`Average characters per page (${avgCharsPerPage}) is lower than minimum requirement (${minChars}).`);
  }

  const needsOcr = lowQualityRatio >= 0.40 || avgCharsPerPage < minChars;
  const isUsable = totalChars > 0 && lowQualityRatio < 0.90;

  return {
    isUsable,
    needsOcr,
    avgCharsPerPage,
    emptyPages,
    lowQualityPages: [...new Set(lowQualityPages)].sort((a, b) => a - b),
    reasons
  };
}
