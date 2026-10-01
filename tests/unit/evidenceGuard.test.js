/**
 * @file evidenceGuard.test.js
 * @description Unit tests for evidence guard verification and hallucination detection.
 */

import { describe, it, expect } from 'vitest';
import { guardEvidence } from '../../src/ai/services/evidenceGuard.js';

describe('guardEvidence', () => {
  const chunks = [
    { chunkId: 'doc1-c0', documentId: 'doc1', pageStart: 2, pageEnd: 2, section: 'Budget', text: 'The total allocated budget is $50 Million for renewable energy.' }
  ];

  it('should verify verbatim quote and enrich pageStart/pageEnd/documentId metadata', () => {
    const rawAnswer = {
      answer: 'The budget is $50 Million.',
      confidence: 'high',
      evidence: [
        { chunkId: 'doc1-c0', quote: '$50 Million for renewable energy' }
      ],
      insufficientEvidence: false
    };

    const guarded = guardEvidence(rawAnswer, chunks, 'answer');
    expect(guarded.insufficientEvidence).toBe(false);
    expect(guarded.evidence).toHaveLength(1);
    expect(guarded.evidence[0].documentId).toBe('doc1');
    expect(guarded.evidence[0].pageStart).toBe(2);
    expect(guarded.evidence[0].pageEnd).toBe(2);
  });

  it('should drop non-verbatim / fabricated quotes and flag insufficientEvidence', () => {
    const rawAnswer = {
      answer: 'The budget is $100 Billion.',
      confidence: 'high',
      evidence: [
        { chunkId: 'doc1-c0', quote: 'fabricated quote not present in chunk' }
      ],
      insufficientEvidence: false
    };

    const guarded = guardEvidence(rawAnswer, chunks, 'answer');
    expect(guarded.insufficientEvidence).toBe(true);
    expect(guarded.confidence).toBe('low');
    expect(guarded.evidence).toHaveLength(0);
  });

  it('should drop unknown chunkId references', () => {
    const rawAnswer = {
      answer: 'The budget is $50 Million.',
      confidence: 'high',
      evidence: [
        { chunkId: 'doc1-c999', quote: '$50 Million for renewable energy' }
      ],
      insufficientEvidence: false
    };

    const guarded = guardEvidence(rawAnswer, chunks, 'answer');
    expect(guarded.insufficientEvidence).toBe(true);
    expect(guarded.evidence).toHaveLength(0);
  });
});
