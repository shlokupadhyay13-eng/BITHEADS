/**
 * @file evidenceGuard.js
 * @description Code-enforced verification of AI response citations against source document chunks.
 */

/**
 * Normalizes whitespace for exact quote matching within chunk text.
 * @param {string} str 
 * @returns {string} Normalized string
 */
function normalizeSpaces(str) {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/\s+/g, ' ').trim().toLowerCase();
}

/**
 * Validates and enriches a single evidence item against available source chunks.
 * @param {Object} evidenceItem - Model generated evidence { chunkId, quote }
 * @param {Map<string, Object>} chunkMap - Map of chunkId -> chunk object
 * @returns {Object|null} Enriched evidence item or null if invalid
 */
function verifyAndEnrichEvidenceItem(evidenceItem, chunkMap) {
  if (!evidenceItem || typeof evidenceItem.chunkId !== 'string' || typeof evidenceItem.quote !== 'string') {
    return null;
  }

  const chunk = chunkMap.get(evidenceItem.chunkId);
  if (!chunk) {
    return null; // chunkId not sent to model
  }

  const normChunkText = normalizeSpaces(chunk.text);
  const normQuote = normalizeSpaces(evidenceItem.quote);

  if (!normQuote || normQuote.length === 0) {
    return null;
  }

  // Quote must appear verbatim (modulo whitespace) in chunk text
  if (!normChunkText.includes(normQuote)) {
    return null;
  }

  return {
    documentId: chunk.documentId,
    chunkId: chunk.chunkId,
    pageStart: chunk.pageStart,
    pageEnd: chunk.pageEnd,
    quote: evidenceItem.quote.trim()
  };
}

/**
 * Filters array of evidence items using valid chunk map.
 * @param {Array} evidenceArray 
 * @param {Map<string, Object>} chunkMap 
 * @returns {Array} Verified evidence items
 */
function filterEvidenceArray(evidenceArray, chunkMap) {
  if (!Array.isArray(evidenceArray)) return [];
  const valid = [];
  for (const item of evidenceArray) {
    const verified = verifyAndEnrichEvidenceItem(item, chunkMap);
    if (verified) {
      valid.push(verified);
    }
  }
  return valid;
}

/**
 * Applies strict evidence guard rules to model JSON outputs.
 * @param {Object} data - Parsed and validated schema object from AI model
 * @param {Array<Object>|{ chunksA: Array<Object>, chunksB: Array<Object> }} chunksInput - Source chunks provided to model
 * @param {'policyExtraction'|'summary'|'answer'|'comparison'} schemaType 
 * @returns {Object} Guarded output object with verified evidence and page metadata
 */
export function guardEvidence(data, chunksInput, schemaType) {
  // Build chunk map from input chunks
  const chunkMap = new Map();

  if (Array.isArray(chunksInput)) {
    for (const c of chunksInput) {
      if (c && c.chunkId) chunkMap.set(c.chunkId, c);
    }
  } else if (chunksInput && typeof chunksInput === 'object') {
    if (Array.isArray(chunksInput.chunksA)) {
      for (const c of chunksInput.chunksA) {
        if (c && c.chunkId) chunkMap.set(c.chunkId, c);
      }
    }
    if (Array.isArray(chunksInput.chunksB)) {
      for (const c of chunksInput.chunksB) {
        if (c && c.chunkId) chunkMap.set(c.chunkId, c);
      }
    }
  }

  const result = JSON.parse(JSON.stringify(data));

  if (result.insufficientEvidence) {
    return result;
  }

  let totalValidEvidenceCount = 0;

  if (schemaType === 'answer') {
    result.evidence = filterEvidenceArray(result.evidence, chunkMap);
    totalValidEvidenceCount += result.evidence.length;

    if (result.evidence.length === 0) {
      result.insufficientEvidence = true;
      result.confidence = 'low';
      result.answer = 'The provided document excerpts do not contain sufficient evidence to answer this question.';
    }
  } else if (schemaType === 'summary') {
    if (Array.isArray(result.keyPoints)) {
      const validPoints = [];
      for (const kp of result.keyPoints) {
        const verifiedEv = filterEvidenceArray(kp.evidence, chunkMap);
        if (verifiedEv.length > 0) {
          kp.evidence = verifiedEv;
          validPoints.push(kp);
          totalValidEvidenceCount += verifiedEv.length;
        }
      }
      result.keyPoints = validPoints;
    }
    if (!result.shortSummary || result.keyPoints.length === 0) {
      result.insufficientEvidence = true;
    }
  } else if (schemaType === 'policyExtraction') {
    const fieldsWithValue = ['title', 'issuingBody', 'dateIssued', 'effectiveDate', 'budget'];
    for (const field of fieldsWithValue) {
      if (result[field] && typeof result[field] === 'object') {
        const verified = filterEvidenceArray(result[field].evidence, chunkMap);
        result[field].evidence = verified;
        totalValidEvidenceCount += verified.length;
        if (verified.length === 0) {
          result[field].value = 'NOT_SPECIFIED';
        }
      }
    }

    const listFields = ['objectives', 'beneficiaries', 'deadlines', 'keyProvisions'];
    for (const field of listFields) {
      if (Array.isArray(result[field])) {
        const validItems = [];
        for (const item of result[field]) {
          const verified = filterEvidenceArray(item.evidence, chunkMap);
          if (verified.length > 0) {
            item.evidence = verified;
            validItems.push(item);
            totalValidEvidenceCount += verified.length;
          }
        }
        result[field] = validItems;
      }
    }

    if (totalValidEvidenceCount === 0) {
      result.insufficientEvidence = true;
    }
  } else if (schemaType === 'comparison') {
    if (Array.isArray(result.similarities)) {
      const validSims = [];
      for (const sim of result.similarities) {
        sim.evidenceA = filterEvidenceArray(sim.evidenceA, chunkMap);
        sim.evidenceB = filterEvidenceArray(sim.evidenceB, chunkMap);
        totalValidEvidenceCount += sim.evidenceA.length + sim.evidenceB.length;
        if (sim.evidenceA.length > 0 || sim.evidenceB.length > 0) {
          validSims.push(sim);
        }
      }
      result.similarities = validSims;
    }

    if (Array.isArray(result.differences)) {
      const validDiffs = [];
      for (const diff of result.differences) {
        diff.evidenceA = filterEvidenceArray(diff.evidenceA, chunkMap);
        diff.evidenceB = filterEvidenceArray(diff.evidenceB, chunkMap);
        totalValidEvidenceCount += diff.evidenceA.length + diff.evidenceB.length;
        if (diff.evidenceA.length > 0 || diff.evidenceB.length > 0) {
          validDiffs.push(diff);
        }
      }
      result.differences = validDiffs;
    }

    if (totalValidEvidenceCount === 0) {
      result.insufficientEvidence = true;
    }
  }

  return result;
}
