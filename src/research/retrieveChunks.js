/**
 * @file retrieveChunks.js
 * @description In-memory lexical search and retrieval of relevant document chunks.
 */

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he',
  'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to', 'was', 'were',
  'will', 'with', 'which', 'or', 'this', 'have', 'been', 'about', 'can', 'should'
]);

/**
 * Tokenizes a text string into normalized terms.
 * @param {string} text 
 * @returns {string[]} Array of normalized term tokens
 */
function tokenize(text) {
  if (!text || typeof text !== 'string') return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1 && !STOP_WORDS.has(t));
}

/**
 * Retrieves the top relevant chunks for a question/query using in-memory BM25-style term frequency scoring.
 * @param {Array<{ chunkId: string, section: string, text: string }>} chunks - Document chunks
 * @param {string} query - User question or search query
 * @param {Object} [options]
 * @param {number} [options.maxChunks=8] - Maximum number of top chunks to return
 * @returns {Array<Object>} Selected top relevant chunks
 */
export function retrieveRelevantChunks(chunks, query, options = {}) {
  const maxChunks = options.maxChunks || 8;

  if (!chunks || !Array.isArray(chunks) || chunks.length === 0) {
    return [];
  }

  // If document is small (<= maxChunks chunks), return all chunks
  if (chunks.length <= maxChunks) {
    return chunks;
  }

  const queryTerms = tokenize(query);
  if (queryTerms.length === 0) {
    return chunks.slice(0, maxChunks);
  }

  // Score chunks
  const scoredChunks = chunks.map((chunk) => {
    const chunkTokens = tokenize(chunk.text);
    const sectionTokens = tokenize(chunk.section);

    let score = 0;
    const termCounts = new Map();
    for (const token of chunkTokens) {
      termCounts.set(token, (termCounts.get(token) || 0) + 1);
    }

    for (const qTerm of queryTerms) {
      if (termCounts.has(qTerm)) {
        // BM25 sublinear term frequency
        const tf = termCounts.get(qTerm);
        score += (1 + Math.log(tf));
      }
      if (sectionTokens.includes(qTerm)) {
        score += 2.5; // Boost section title matches
      }
    }

    return { chunk, score };
  });

  scoredChunks.sort((a, b) => b.score - a.score);

  return scoredChunks.slice(0, maxChunks).map(sc => sc.chunk);
}
