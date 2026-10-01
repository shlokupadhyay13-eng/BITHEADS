import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { questionsApi } from '../services/api/questionsApi';
import { documentsApi } from '../services/api/documentsApi';
import { comparisonApi } from '../services/api/comparisonApi';
import { researchApi } from '../services/api/researchApi';
import { QuestionsPage } from '../pages/QuestionsPage';
import { CrossPolicyComparePage } from '../pages/CrossPolicyComparePage';
import { PolicyBriefExportPage } from '../pages/PolicyBriefExportPage';
import { QuestionResultView } from '../components/qa/QuestionResultView';
import { ResearchBriefView } from '../components/brief/ResearchBriefView';
import type { Document, QuestionResponse, Comparison, ResearchBrief } from '../types';

const mockDocs: Document[] = [
  {
    id: 'doc-1',
    title: 'National Green Hydrogen Mission SIGHT',
    issuingMinistry: 'Ministry of New & Renewable Energy',
    publicationDate: '2024-03-15',
    category: 'energy',
    status: 'ready',
  },
  {
    id: 'doc-2',
    title: 'Digital Personal Data Protection Rules',
    issuingMinistry: 'Ministry of Electronics and Information Technology',
    publicationDate: '2024-04-01',
    category: 'technology_ai',
    status: 'ready',
  },
];

const mockQaResponse: QuestionResponse = {
  id: 'qr-101',
  question: 'What are the penalties for non-compliance?',
  answer: 'Under the DPDP Rules, penalties extend up to ₹200 Crore for non-compliance.',
  documentIds: ['doc-2'],
  confidence: 0.98,
  evidence: [
    {
      id: 'ev-1',
      documentId: 'doc-2',
      documentTitle: 'Digital Personal Data Protection Rules',
      pageNumber: 31,
      sectionHeading: 'Schedule 1: Penalty Matrix',
      excerptQuote: 'Penalties for failure to enforce child data protections may extend up to Two Hundred Crore Rupees.',
    },
  ],
};

const mockComparisonResult: Comparison = {
  query: 'Statutory comparison across criteria',
  documentIds: ['doc-1', 'doc-2'],
  synthesizedAnswer: 'Both frameworks impose binding compliance mandates with central oversight.',
  similarities: [
    'Both frameworks institute phased transitional deadlines.',
    'Both assign oversight to central statutory regulators.',
  ],
  differences: [
    'SIGHT uses PBG forfeiture, while DPDP imposes civil fines up to ₹200 Crore.',
  ],
  comparisonMatrix: [
    {
      comparisonTopic: 'Objectives',
      criterionId: 'objectives',
      findings: [
        {
          documentId: 'doc-1',
          documentTitle: 'National Green Hydrogen Mission SIGHT',
          findingSummary: 'Establish 5 MMT annual green hydrogen capacity.',
          citations: [
            {
              id: 'cit-1',
              pageNumber: 3,
              excerptQuote: 'The objective is to position India as a global clean energy hub.',
            },
          ],
        },
        {
          documentId: 'doc-2',
          documentTitle: 'Digital Personal Data Protection Rules',
          findingSummary: 'Safeguard children personal data online.',
        },
      ],
    },
    {
      comparisonTopic: 'Funding',
      criterionId: 'funding',
      findings: [
        {
          documentId: 'doc-1',
          documentTitle: 'National Green Hydrogen Mission SIGHT',
          findingSummary: '₹17,490 Crore financial outlay.',
        },
        {
          documentId: 'doc-2',
          documentTitle: 'Digital Personal Data Protection Rules',
          findingSummary: '', // Zero-fabrication: "Not specified in document"
        },
      ],
    },
  ],
};

const mockFullBrief: ResearchBrief = {
  id: 'brief-001',
  title: 'Executive Legislative Memorandum: SIGHT Guidelines Evaluation',
  subject: 'Operational Guidelines for Strategic Interventions',
  topic: 'Green Hydrogen Domestic Value Addition',
  ministry: 'Ministry of New and Renewable Energy',
  gazetteDate: '2024-03-15',
  authorDivision: 'Policy Intelligence Division',
  generatedAt: '2024-04-15T12:00:00Z',
  executiveSummary: 'This memorandum provides an executive regulatory evaluation.',
  background: 'Notified pursuant to Cabinet Decision No. 44/2023.',
  keyFindings: [
    {
      id: 'kf-1',
      title: 'Tiered Local Value Addition',
      summary: 'Domestic manufacturers must verify 40% LVA in Year 1.',
      mandateLevel: 'mandatory',
      enforcingAgency: 'SECI',
    },
  ],
  policyAnalysis: 'Statutory coherence is strong between Central capital allocation and SECI rules.',
  evidence: [
    {
      id: 'ev-b1',
      documentTitle: 'National Green Hydrogen Mission: SIGHT Guidelines',
      pageNumber: 14,
      sectionHeading: 'Section 4.2',
      excerptQuote: 'The bidder must commit to minimum local value addition of 40%.',
    },
  ],
  implications: ['Domestic fabricators must re-engineer supply chains within 60 days.'],
  limitations: ['Analysis is based on Draft Scheme Guidelines.'],
  sources: [
    {
      id: 'src-b1',
      title: 'National Green Hydrogen Mission: SIGHT Guidelines',
      ministry: 'MNRE',
      pageNumber: 14,
    },
  ],
};

const mockPartialBrief: ResearchBrief = {
  id: 'brief-partial',
  title: 'Partial Policy Brief',
  executiveSummary: 'Preliminary summary only.',
  keyFindings: [
    {
      id: 'kf-p1',
      title: 'Initial Finding',
      summary: 'Initial analysis completed.',
    },
  ],
  // background, policyAnalysis, evidence, implications, limitations, sources intentionally omitted
};

describe('PHASE 5C — Evidence-Grounded Q&A Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(documentsApi, 'listDocuments').mockResolvedValue(mockDocs);
    vi.spyOn(questionsApi, 'askQuestion').mockResolvedValue(mockQaResponse);
  });

  it('renders initial empty state with "Ask your first research question about this document."', async () => {
    render(
      <MemoryRouter>
        <QuestionsPage />
      </MemoryRouter>
    );

    const emptyText = await screen.findByText('Ask your first research question about this document.');
    expect(emptyText).toBeDefined();
    expect(screen.getByLabelText(/Research question/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Ask Question/i })).toBeDefined();
  });

  it('renders document selector when not in document context and allows changing document', async () => {
    render(
      <MemoryRouter>
        <QuestionsPage />
      </MemoryRouter>
    );

    const selector = await screen.findByLabelText(/Target Policy Document/i);
    expect(selector).toBeDefined();
    expect(screen.getByText(/All catalogued policies/i)).toBeDefined();
    expect(screen.getByText(/National Green Hydrogen Mission SIGHT/i)).toBeDefined();
  });

  it('displays document context badge when documentId is provided in URL', async () => {
    render(
      <MemoryRouter initialEntries={['/questions?documentId=doc-1']}>
        <QuestionsPage />
      </MemoryRouter>
    );

    expect(await screen.findByText(/Document Context:/i)).toBeDefined();
    expect(screen.getByText(/National Green Hydrogen Mission SIGHT/i)).toBeDefined();
  });

  it('handles question submission, shows descriptive loading state, then renders answer, evidence, and sources', async () => {
    let resolveQuery!: (val: QuestionResponse) => void;
    const queryPromise = new Promise<QuestionResponse>((res) => {
      resolveQuery = res;
    });
    vi.spyOn(questionsApi, 'askQuestion').mockImplementation(() => queryPromise);

    render(
      <MemoryRouter>
        <QuestionsPage />
      </MemoryRouter>
    );

    const textarea = screen.getByLabelText(/Research question/i);
    fireEvent.change(textarea, { target: { value: 'What are the penalties for non-compliance?' } });

    const submitBtn = screen.getByRole('button', { name: /Ask Question/i });
    fireEvent.click(submitBtn);

    // Verify descriptive loading status
    expect(
      screen.getAllByText(/Retrieving statutory context and synthesizing evidence-grounded answer.../i).length
    ).toBeGreaterThan(0);

    // Resolve query
    resolveQuery(mockQaResponse);

    // Verify Answer section
    expect(await screen.findByText('AI-generated interpretation')).toBeDefined();
    expect(screen.getByText(mockQaResponse.answer)).toBeDefined();

    // Verify Evidence passages section
    expect(screen.getByText('Source evidence')).toBeDefined();
    expect(screen.getByText(/Penalties for failure to enforce child data protections/i)).toBeDefined();
    expect(screen.getAllByText(/Page 31/i).length).toBeGreaterThan(0);

    // Verify Sources section
    expect(screen.getByText('Statutory Sources')).toBeDefined();
    expect(screen.getAllByText(/Schedule 1: Penalty Matrix/i).length).toBeGreaterThan(0);
  });

  it('opens View Source modal with full quote when clicking "View source"', () => {
    render(
      <MemoryRouter>
        <QuestionResultView result={mockQaResponse} />
      </MemoryRouter>
    );

    const viewSourceBtn = screen.getByRole('button', { name: /View source/i });
    fireEvent.click(viewSourceBtn);

    expect(screen.getByText('Verifiable Statutory Evidence Source')).toBeDefined();
    expect(screen.getByText('Exact Source Excerpt')).toBeDefined();
    expect(screen.getByText('Close Evidence Viewer')).toBeDefined();

    // Close modal
    fireEvent.click(screen.getByText('Close Evidence Viewer'));
    expect(screen.queryByText('Verifiable Statutory Evidence Source')).toBeNull();
  });

  it('displays error state with Retry button on API failure and retries successfully', async () => {
    const askSpy = vi
      .spyOn(questionsApi, 'askQuestion')
      .mockRejectedValueOnce(new Error('Network error: statutory engine offline'))
      .mockResolvedValueOnce(mockQaResponse);

    render(
      <MemoryRouter>
        <QuestionsPage />
      </MemoryRouter>
    );

    const textarea = screen.getByLabelText(/Research question/i);
    fireEvent.change(textarea, { target: { value: 'What are the penalties?' } });
    fireEvent.click(screen.getByRole('button', { name: /Ask Question/i }));

    expect(await screen.findByText(/Network error: statutory engine offline/i)).toBeDefined();
    const retryBtn = screen.getByRole('button', { name: /Retry Query/i });
    expect(retryBtn).toBeDefined();

    // Click retry
    fireEvent.click(retryBtn);
    expect(askSpy).toHaveBeenCalledTimes(2);

    expect(await screen.findByText(mockQaResponse.answer)).toBeDefined();
  });
});

describe('PHASE 5C — Cross-Policy Comparison Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(documentsApi, 'listDocuments').mockResolvedValue(mockDocs);
    vi.spyOn(comparisonApi, 'comparePolicies').mockResolvedValue(mockComparisonResult);
  });

  it('renders 4-step workflow: Select Doc A, Select Doc B, Choose Criteria, Compare', async () => {
    render(
      <MemoryRouter>
        <CrossPolicyComparePage />
      </MemoryRouter>
    );

    expect(await screen.findByLabelText(/Step 1: Select Document A/i)).toBeDefined();
    expect(screen.getByLabelText(/Step 2: Select Document B/i)).toBeDefined();
    expect(screen.getByText(/Step 3: Choose Comparison Criteria/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /^Compare$/i })).toBeDefined();
  });

  it('enforces validation rule: Document B cannot equal Document A', async () => {
    render(
      <MemoryRouter>
        <CrossPolicyComparePage />
      </MemoryRouter>
    );

    const docASelect = await screen.findByLabelText(/Step 1: Select Document A/i);
    const docBSelect = screen.getByLabelText(/Step 2: Select Document B/i);

    // Set both to doc-1
    fireEvent.change(docASelect, { target: { value: 'doc-1' } });
    fireEvent.change(docBSelect, { target: { value: 'doc-1' } });

    expect(
      screen.getByText(/Validation Error: Document B cannot be the same as Document A/i)
    ).toBeDefined();
    const compareBtn = screen.getByRole('button', { name: /^Compare$/i });
    expect(compareBtn.hasAttribute('disabled')).toBe(true);
  });

  it('executes comparison and renders similarities, differences, and per-criterion table with scoped headers', async () => {
    render(
      <MemoryRouter>
        <CrossPolicyComparePage />
      </MemoryRouter>
    );

    const docASelect = await screen.findByLabelText(/Step 1: Select Document A/i);
    const docBSelect = screen.getByLabelText(/Step 2: Select Document B/i);

    fireEvent.change(docASelect, { target: { value: 'doc-1' } });
    fireEvent.change(docBSelect, { target: { value: 'doc-2' } });

    const compareBtn = screen.getByRole('button', { name: /^Compare$/i });
    expect(compareBtn.hasAttribute('disabled')).toBe(false);
    fireEvent.click(compareBtn);

    // Verify similarities
    expect(await screen.findByText('Statutory Similarities')).toBeDefined();
    expect(screen.getByText(/Both frameworks institute phased transitional deadlines/i)).toBeDefined();

    // Verify differences
    expect(screen.getByText('Statutory Differences')).toBeDefined();
    expect(screen.getByText(/SIGHT uses PBG forfeiture, while DPDP imposes civil fines/i)).toBeDefined();

    // Verify per-criterion table with proper scoped headers
    const table = screen.getByRole('table', { name: /Per-Criterion Policy Comparison Matrix/i });
    expect(table).toBeDefined();

    // Check table headers
    expect(screen.getByRole('columnheader', { name: /Statutory Criterion/i })).toBeDefined();
    expect(screen.getByRole('rowheader', { name: /Objectives/i })).toBeDefined();
    expect(screen.getByRole('rowheader', { name: /Funding/i })).toBeDefined();

    // Zero-fabrication check: missing finding in Document B for Funding renders "Not specified in document"
    expect(screen.getAllByText('Not specified in document').length).toBeGreaterThan(0);
  });

  it('handles comparison API errors with Retry button', async () => {
    vi.spyOn(comparisonApi, 'comparePolicies')
      .mockRejectedValueOnce(new Error('Comparison matrix synthesis timed out'))
      .mockResolvedValueOnce(mockComparisonResult);

    render(
      <MemoryRouter>
        <CrossPolicyComparePage />
      </MemoryRouter>
    );

    const docASelect = await screen.findByLabelText(/Step 1: Select Document A/i);
    const docBSelect = screen.getByLabelText(/Step 2: Select Document B/i);

    fireEvent.change(docASelect, { target: { value: 'doc-1' } });
    fireEvent.change(docBSelect, { target: { value: 'doc-2' } });

    fireEvent.click(screen.getByRole('button', { name: /^Compare$/i }));

    expect(await screen.findByText(/Comparison matrix synthesis timed out/i)).toBeDefined();
    const retryBtn = screen.getByRole('button', { name: /Retry Comparison/i });
    expect(retryBtn).toBeDefined();

    fireEvent.click(retryBtn);
    expect(await screen.findByText('Statutory Similarities')).toBeDefined();
  });
});

describe('PHASE 5C — Research Brief Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(documentsApi, 'listDocuments').mockResolvedValue(mockDocs);
    vi.spyOn(researchApi, 'getResearchBrief').mockResolvedValue(mockFullBrief);
    vi.spyOn(researchApi, 'generateResearchBrief').mockResolvedValue(mockFullBrief);
  });

  it('renders generate brief form with document selector and inquiry topic textarea', async () => {
    render(
      <MemoryRouter>
        <PolicyBriefExportPage />
      </MemoryRouter>
    );

    expect(await screen.findByText(/Generate Legislative Policy Brief/i)).toBeDefined();
    expect(screen.getByLabelText(/Research Topic \/ Legislative Scope/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Generate Research Brief/i })).toBeDefined();
  });

  it('renders all 8 sections when supplied by API', () => {
    render(
      <MemoryRouter>
        <ResearchBriefView brief={mockFullBrief} />
      </MemoryRouter>
    );

    expect(screen.getByTestId('brief-section-executive-summary')).toBeDefined();
    expect(screen.getByTestId('brief-section-background')).toBeDefined();
    expect(screen.getByTestId('brief-section-key-findings')).toBeDefined();
    expect(screen.getByTestId('brief-section-policy-analysis')).toBeDefined();
    expect(screen.getByTestId('brief-section-evidence')).toBeDefined();
    expect(screen.getByTestId('brief-section-implications')).toBeDefined();
    expect(screen.getByTestId('brief-section-limitations')).toBeDefined();
    expect(screen.getByTestId('brief-section-sources')).toBeDefined();
  });

  it('tolerates missing sections and renders ONLY sections returned by the API (Zero-Fabrication)', () => {
    render(
      <MemoryRouter>
        <ResearchBriefView brief={mockPartialBrief} />
      </MemoryRouter>
    );

    // Rendered sections
    expect(screen.getByTestId('brief-section-executive-summary')).toBeDefined();
    expect(screen.getByTestId('brief-section-key-findings')).toBeDefined();

    // Sections NOT returned by API must NOT be fabricated or rendered
    expect(screen.queryByTestId('brief-section-background')).toBeNull();
    expect(screen.queryByTestId('brief-section-policy-analysis')).toBeNull();
    expect(screen.queryByTestId('brief-section-evidence')).toBeNull();
    expect(screen.queryByTestId('brief-section-implications')).toBeNull();
    expect(screen.queryByTestId('brief-section-limitations')).toBeNull();
    expect(screen.queryByTestId('brief-section-sources')).toBeNull();
  });

  it('provides copy-to-clipboard action and print button, and omits unsupported download/export button', async () => {
    const writeTextSpy = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextSpy },
      configurable: true,
      writable: true,
    });

    render(
      <MemoryRouter>
        <ResearchBriefView brief={mockFullBrief} />
      </MemoryRouter>
    );

    const copyBtn = screen.getByRole('button', { name: /Copy Text/i });
    expect(copyBtn).toBeDefined();
    fireEvent.click(copyBtn);

    expect(writeTextSpy).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('Copied to Clipboard')).toBeDefined();

    // Print button exists
    expect(screen.getByRole('button', { name: /Print Dossier \/ Save PDF/i })).toBeDefined();

    // Download/export button is NOT present (omitted per prompt requirement)
    expect(screen.queryByRole('button', { name: /download/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /export pdf/i })).toBeNull();
  });

  it('handles route /research-brief/:briefId loading and error with retry', async () => {
    const getBriefSpy = vi
      .spyOn(researchApi, 'getResearchBrief')
      .mockRejectedValueOnce(new Error('Brief not found in repository'))
      .mockResolvedValueOnce(mockFullBrief);

    render(
      <MemoryRouter initialEntries={['/research-brief/brief-missing']}>
        <Routes>
          <Route path="/research-brief/:briefId" element={<PolicyBriefExportPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText(/Brief not found in repository/i)).toBeDefined();
    const retryBtn = screen.getByRole('button', { name: /Retry Loading Brief/i });
    expect(retryBtn).toBeDefined();

    fireEvent.click(retryBtn);
    expect(getBriefSpy).toHaveBeenCalledTimes(2);

    expect(await screen.findByText(mockFullBrief.title)).toBeDefined();
  });
});
