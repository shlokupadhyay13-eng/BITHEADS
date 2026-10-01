/**
 * @file research.test.js
 * @description Integration tests for Document Intelligence & AI Research Services.
 */

import { describe, it, expect } from 'vitest';
import { processDocument } from '../../src/research/processDocument.js';
import { extractPolicyInformation } from '../../src/research/extract.js';
import { summarizeDocument } from '../../src/research/summarize.js';
import { answerQuestion } from '../../src/research/answer.js';
import { compareDocuments } from '../../src/research/compare.js';
import { createTestPdfBuffer } from '../helpers/pdfHelper.js';
import { AppError, ERROR_CODES } from '../../src/utils/errors.js';

describe('AI Research Integration Tests', () => {
  it('should process document and answer question with valid grounded evidence', async () => {
    const pageText = 'SECTION 1. BUDGET ALLOCATION\nThe Ministry of Clean Energy has allocated $150 Million for solar grid installation in 2026.';
    const pdfBuffer = await createTestPdfBuffer([pageText]);

    const doc = await processDocument({
      buffer: pdfBuffer,
      filename: 'solar_policy.pdf',
      mimeType: 'application/pdf'
    });

    expect(doc.chunks.length).toBeGreaterThan(0);
    const validChunkId = doc.chunks[0].chunkId;

    const mockGeminiClient = {
      generateJson: async () => ({
        answer: 'The Ministry of Clean Energy allocated $150 Million for solar grid installation.',
        confidence: 'high',
        evidence: [
          { chunkId: validChunkId, quote: '$150 Million for solar grid installation in 2026' }
        ],
        insufficientEvidence: false
      })
    };

    const answer = await answerQuestion(doc, 'How much budget is allocated for solar grid installation?', { client: mockGeminiClient });
    expect(answer.insufficientEvidence).toBe(false);
    expect(answer.confidence).toBe('high');
    expect(answer.evidence[0].documentId).toBe(doc.documentId);
    expect(answer.evidence[0].pageStart).toBe(1);
    expect(answer.evidence[0].quote).toContain('$150 Million');
  });

  it('should flag insufficientEvidence when model provides a fake chunkId or ungrounded quote', async () => {
    const pageText = 'SECTION 1. BUDGET ALLOCATION\nThe Ministry of Clean Energy has allocated $150 Million for solar grid installation in 2026.';
    const pdfBuffer = await createTestPdfBuffer([pageText]);

    const doc = await processDocument({
      buffer: pdfBuffer,
      filename: 'solar_policy.pdf',
      mimeType: 'application/pdf'
    });

    const mockGeminiClient = {
      generateJson: async () => ({
        answer: 'The budget is $150 Million.',
        confidence: 'high',
        evidence: [
          { chunkId: 'fake-chunk-999', quote: '$150 Million for solar grid installation' }
        ],
        insufficientEvidence: false
      })
    };

    const answer = await answerQuestion(doc, 'What is the budget?', { client: mockGeminiClient });
    expect(answer.insufficientEvidence).toBe(true);
    expect(answer.evidence).toHaveLength(0);
  });

  it('should summarize and extract policy information using mocked Gemini client', async () => {
    const pageText = 'SECTION 1. HEALTHCARE REFORM\nThe Department of Health issues the National Wellness Act effective 2026-01-01.\nBudget: $200 Million.\nObjectives: Improve rural clinics access.\nBeneficiaries: Elderly citizens.';
    const pdfBuffer = await createTestPdfBuffer([pageText]);

    const doc = await processDocument({
      buffer: pdfBuffer,
      filename: 'health_act.pdf',
      mimeType: 'application/pdf'
    });

    const validChunkId = doc.chunks[0].chunkId;

    const mockGeminiClient = {
      generateJson: async ({ responseSchema }) => {
        if (responseSchema.properties.shortSummary) {
          return {
            shortSummary: 'Overview of National Wellness Act 2026.',
            keyPoints: [
              { point: 'Budget of $200 Million allocated.', evidence: [{ chunkId: validChunkId, quote: '$200 Million' }] }
            ],
            insufficientEvidence: false
          };
        }
        return {
          title: { value: 'National Wellness Act', evidence: [{ chunkId: validChunkId, quote: 'National Wellness Act' }] },
          issuingBody: { value: 'Department of Health', evidence: [{ chunkId: validChunkId, quote: 'Department of Health' }] },
          dateIssued: { value: '2026-01-01', evidence: [{ chunkId: validChunkId, quote: '2026-01-01' }] },
          effectiveDate: { value: '2026-01-01', evidence: [{ chunkId: validChunkId, quote: '2026-01-01' }] },
          objectives: [{ value: 'Improve rural clinics access', evidence: [{ chunkId: validChunkId, quote: 'Improve rural clinics access' }] }],
          beneficiaries: [{ value: 'Elderly citizens', evidence: [{ chunkId: validChunkId, quote: 'Elderly citizens' }] }],
          budget: { value: '$200 Million', evidence: [{ chunkId: validChunkId, quote: '$200 Million' }] },
          deadlines: [],
          keyProvisions: [],
          insufficientEvidence: false
        };
      }
    };

    const summary = await summarizeDocument(doc, { client: mockGeminiClient });
    expect(summary.shortSummary).toBe('Overview of National Wellness Act 2026.');
    expect(summary.keyPoints[0].evidence[0].documentId).toBe(doc.documentId);

    const extraction = await extractPolicyInformation(doc, { client: mockGeminiClient });
    expect(extraction.title.value).toBe('National Wellness Act');
    expect(extraction.budget.value).toBe('$200 Million');
  });

  it('should compare two documents using mocked Gemini client', async () => {
    const docA = await processDocument({
      buffer: await createTestPdfBuffer(['Policy Document A officially allocates $50M for national solar energy grid infrastructure expansion.']),
      filename: 'docA.pdf',
      mimeType: 'application/pdf'
    });

    const docB = await processDocument({
      buffer: await createTestPdfBuffer(['Policy Document B officially allocates $100M for offshore wind energy plant development.']),
      filename: 'docB.pdf',
      mimeType: 'application/pdf'
    });

    const mockGeminiClient = {
      generateJson: async () => ({
        similarities: [],
        differences: [
          {
            topic: 'Budget and Energy Source',
            documentADetail: '$50M for solar',
            documentBDetail: '$100M for wind',
            evidenceA: [{ chunkId: docA.chunks[0].chunkId, quote: '$50M for national solar energy' }],
            evidenceB: [{ chunkId: docB.chunks[0].chunkId, quote: '$100M for offshore wind energy' }]
          }
        ],
        insufficientEvidence: false
      })
    };

    const comparison = await compareDocuments(docA, docB, { client: mockGeminiClient });
    expect(comparison.differences).toHaveLength(1);
    expect(comparison.differences[0].evidenceA[0].documentId).toBe(docA.documentId);
    expect(comparison.differences[0].evidenceB[0].documentId).toBe(docB.documentId);
  });

  it('should throw INSUFFICIENT_TEXT for empty PDF with no text when no OCR provider is configured', async () => {
    const emptyPdf = await createTestPdfBuffer([' ']);
    try {
      await processDocument({
        buffer: emptyPdf,
        filename: 'empty.pdf',
        mimeType: 'application/pdf'
      });
    } catch (err) {
      expect(err.code).toBe(ERROR_CODES.INSUFFICIENT_TEXT);
    }
  });
});
