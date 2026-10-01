/**
 * @file cleanText.js
 * @description Performs conservative text normalization per page while strictly preserving numbers, dates, and legal terms.
 */

/**
 * Detects headers and footers that repeat across >= 60% of pages and are under 120 characters long.
 * @param {Array<{ pageNumber: number, text: string }>} pages 
 * @returns {Set<string>} Set of lines to strip as recurring header/footers
 */
function findRecurringHeadersFooters(pages) {
  if (!pages || pages.length < 2) return new Set();

  const lineOccurrences = new Map();
  const pageCount = pages.length;

  for (const page of pages) {
    const lines = (page.text || '')
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0 && l.length < 120);

    const uniqueLinesOnPage = new Set(lines);
    for (const line of uniqueLinesOnPage) {
      lineOccurrences.set(line, (lineOccurrences.get(line) || 0) + 1);
    }
  }

  const threshold = Math.ceil(pageCount * 0.6);
  const recurringLines = new Set();

  for (const [line, count] of lineOccurrences.entries()) {
    if (count >= threshold) {
      recurringLines.add(line);
    }
  }

  return recurringLines;
}

/**
 * Conservatively cleans extracted text per page.
 * @param {Array<{ pageNumber: number, text: string }>} pages - Extracted PDF pages
 * @returns {{ pages: Array<{ pageNumber: number, text: string, charCount: number }>, removedLines: string[] }}
 */
export function cleanText(pages) {
  if (!pages || !Array.isArray(pages)) {
    return { pages: [], removedLines: [] };
  }

  const recurringHeadersFooters = findRecurringHeadersFooters(pages);
  const removedLinesSet = new Set(recurringHeadersFooters);

  const cleanedPages = pages.map((page) => {
    let raw = page.text || '';

    // 1. Strip null and control characters (except newline \n and carriage return \r)
    raw = raw.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    // 2. Fix hyphenated line breaks e.g. "gov-\nernment" -> "government"
    // Only merge when both ends are letters
    raw = raw.replace(/([a-zA-Z]{2,})-\r?\n\s*([a-zA-Z]{2,})/g, '$1$2');

    // 3. Process line by line for header/footer removal and whitespace normalization
    const lines = raw.split(/\r?\n/);
    const cleanedLines = [];

    for (let line of lines) {
      const trimmedLine = line.trim();

      // Check recurring header/footer line removal
      if (recurringHeadersFooters.has(trimmedLine)) {
        continue; // Strip header/footer
      }

      // Normalize internal horizontal spaces (preserve single spaces)
      const normalizedLine = line.replace(/[ \t]+/g, ' ').trim();
      if (normalizedLine.length > 0) {
        cleanedLines.push(normalizedLine);
      }
    }

    const cleanedText = cleanedLines.join('\n');

    return {
      pageNumber: page.pageNumber,
      text: cleanedText,
      charCount: cleanedText.length
    };
  });

  return {
    pages: cleanedPages,
    removedLines: Array.from(removedLinesSet)
  };
}
