/**
 * @file chunkPages.js
 * @description Splits cleaned page text into page-mapped, section-aware, overlapping text chunks.
 */

const TARGET_CHUNK_SIZE = 1000;
const MIN_CHUNK_SIZE = 500;
const MAX_CHUNK_SIZE = 1400;
const OVERLAP_SIZE = 150;

/**
 * Heuristically detects if a line is a section heading.
 * @param {string} line 
 * @returns {string|null} Detected heading or null
 */
function detectHeading(line) {
  if (!line || typeof line !== 'string') return null;
  const trimmed = line.trim();
  if (trimmed.length > 100) return null;

  // Numbered section e.g. "1. Executive Summary" or "SECTION 2.1"
  if (/^(?:SECTION|CHAPTER|PART|ARTICLE)\s+[0-9IVX]+[:.]?\s+/i.test(trimmed)) {
    return trimmed;
  }

  // Numbered outline e.g. "1.2 Policy Objectives"
  if (/^[0-9]+(\.[0-9]+)*\s+[A-Z]/.test(trimmed)) {
    return trimmed;
  }

  // ALL CAPS headings e.g. "EXECUTIVE SUMMARY"
  if (/^[A-Z0-9\s.,\-\/():]{4,80}$/.test(trimmed) && /[A-Z]{3,}/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

/**
 * Splits document pages into deterministic, page-range mapped chunks.
 * @param {Object} input
 * @param {string} input.documentId - Unique identifier for the document
 * @param {Array<{ pageNumber: number, text: string }>} input.pages - Cleaned document pages
 * @returns {Array<{ chunkId: string, documentId: string, pageStart: number, pageEnd: number, section: string, text: string }>}
 */
export function chunkPages({ documentId, pages }) {
  if (!documentId || typeof documentId !== 'string') {
    throw new Error('documentId is required for chunking');
  }

  if (!pages || !Array.isArray(pages) || pages.length === 0) {
    return [];
  }

  // Step 1: Break pages into sentence/paragraph units with pageNumber and section metadata
  const textUnits = [];
  let currentSection = 'Unlabelled';

  for (const page of pages) {
    const lines = (page.text || '').split(/\n+/);

    for (const line of lines) {
      const heading = detectHeading(line);
      if (heading) {
        currentSection = heading;
      }

      const trimmed = line.trim();
      if (!trimmed) continue;

      // Split long paragraphs into sentence units if needed
      const sentences = trimmed.match(/[^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$/g) || [trimmed];
      for (const sentence of sentences) {
        const sTrimmed = sentence.trim();
        if (sTrimmed.length > 0) {
          textUnits.push({
            text: sTrimmed,
            pageNumber: page.pageNumber,
            section: currentSection
          });
        }
      }
    }
  }

  if (textUnits.length === 0) {
    return [];
  }

  // Step 2: Accumulate text units into chunks (~800 - 1200 chars with ~150 char overlap)
  const chunks = [];
  let currentUnits = [];
  let currentLen = 0;
  let chunkIndex = 0;

  for (let i = 0; i < textUnits.length; i++) {
    const unit = textUnits[i];
    currentUnits.push(unit);
    currentLen += unit.text.length + 1; // +1 for space

    const isLastUnit = i === textUnits.length - 1;
    const exceedsTarget = currentLen >= TARGET_CHUNK_SIZE;
    const exceedsMax = currentLen >= MAX_CHUNK_SIZE;

    if (exceedsMax || (exceedsTarget && currentLen >= MIN_CHUNK_SIZE) || isLastUnit) {
      const chunkText = currentUnits.map(u => u.text).join(' ').trim();
      const pageStart = Math.min(...currentUnits.map(u => u.pageNumber));
      const pageEnd = Math.max(...currentUnits.map(u => u.pageNumber));
      
      // Determine dominant section in chunk
      const sectionCounts = {};
      for (const u of currentUnits) {
        sectionCounts[u.section] = (sectionCounts[u.section] || 0) + u.text.length;
      }
      let dominantSection = 'Unlabelled';
      let maxSectionLen = 0;
      for (const [sec, len] of Object.entries(sectionCounts)) {
        if (len > maxSectionLen) {
          maxSectionLen = len;
          dominantSection = sec;
        }
      }

      chunks.push({
        chunkId: `${documentId}-c${chunkIndex}`,
        documentId,
        pageStart,
        pageEnd,
        section: dominantSection,
        text: chunkText
      });
      chunkIndex++;

      // Compute overlap units for next chunk (~150 chars)
      if (!isLastUnit) {
        const overlapUnits = [];
        let overlapLen = 0;
        for (let j = currentUnits.length - 1; j >= 0; j--) {
          overlapUnits.unshift(currentUnits[j]);
          overlapLen += currentUnits[j].text.length + 1;
          if (overlapLen >= OVERLAP_SIZE) break;
        }
        currentUnits = [...overlapUnits];
        currentLen = overlapLen;
      } else {
        currentUnits = [];
        currentLen = 0;
      }
    }
  }

  return chunks;
}
