/**
 * @file chunkPages.test.js
 * @description Unit tests for document page chunking.
 */

import { describe, it, expect } from 'vitest';
import { chunkPages } from '../../src/documents/chunkPages.js';

describe('chunkPages', () => {
  it('should split pages into deterministic, section-aware chunks with accurate page ranges', () => {
    const pages = [
      { pageNumber: 1, text: 'SECTION 1. EXECUTIVE SUMMARY\nThis policy outlines national healthcare reform objectives.' },
      { pageNumber: 2, text: 'The budget allocation is set at $100 Million over five years for public hospitals.' }
    ];

    const chunks = chunkPages({ documentId: 'doc-123', pages });
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0].chunkId).toBe('doc-123-c0');
    expect(chunks[0].documentId).toBe('doc-123');
    expect(chunks[0].pageStart).toBe(1);
    expect(chunks[0].pageEnd).toBe(2);
    expect(chunks[0].section).toBe('SECTION 1. EXECUTIVE SUMMARY');
    expect(chunks[0].text).toContain('national healthcare reform');
  });
});
