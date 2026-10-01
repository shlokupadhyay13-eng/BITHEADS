import type { QuestionResponse } from '../../types';

export const mockQuestions: Record<string, QuestionResponse> = {
  'penalties': {
    id: 'qr-001',
    question: 'What are the maximum financial penalties for non-compliance under the analyzed policies?',
    answer: 'Under the Digital Personal Data Protection Rules, Schedule 1 establishes penalties extending up to ₹200 Crore for breaches concerning children’s data protection obligations. Under the National Green Hydrogen Mission (SIGHT), penalties take the form of Performance Bank Guarantee (PBG) forfeiture at ₹15 Lakhs per MW of allotted manufacturing capacity.',
    documentIds: ['doc-gov-2024-001', 'doc-gov-2024-002'],
    confidence: 0.98,
    generatedAt: '2024-04-15T12:00:00Z',
    evidence: [
      {
        id: 'ev-q-1',
        documentId: 'doc-gov-2024-002',
        documentTitle: 'DPDP Rules: Children’s Data & Consent',
        pageNumber: 31,
        sectionHeading: 'Schedule 1: Penalty Matrix',
        excerptQuote: 'Penalties for failure to enforce child data protections may extend up to Two Hundred Crore Rupees per proven infringement incident.',
        confidenceScore: 0.99,
      },
      {
        id: 'ev-q-2',
        documentId: 'doc-gov-2024-001',
        documentTitle: 'National Green Hydrogen Mission: SIGHT Guidelines',
        pageNumber: 16,
        sectionHeading: 'Section 4.5: Performance Bank Guarantee Obligations',
        excerptQuote: 'Successful bidders must furnish an irrevocable Performance Bank Guarantee (PBG) equivalent to ₹15 Lakhs per MW of allotted manufacturing capacity.',
        confidenceScore: 0.96,
      },
    ],
  },
  'deadlines': {
    id: 'qr-002',
    question: 'What are the immediate transition deadlines for educational platforms?',
    answer: 'Rule 11 of the DPDP Rules provides a 180-day grace transition window from the date of rule notification for educational platforms and virtual schooling services to complete full compliance re-architecture and remove non-essential tracking mechanisms.',
    documentIds: ['doc-gov-2024-002'],
    confidence: 0.96,
    generatedAt: '2024-04-15T12:05:00Z',
    evidence: [
      {
        id: 'ev-q-3',
        documentId: 'doc-gov-2024-002',
        documentTitle: 'DPDP Rules: Children’s Data & Consent',
        pageNumber: 22,
        sectionHeading: 'Rule 11: Transitional Accommodations for Educational Platforms',
        excerptQuote: 'Platforms primarily offering virtual schooling or interactive educational instruction must complete compliance re-architecture within 180 days of rule gazettal.',
        confidenceScore: 0.94,
      },
    ],
  },
};
