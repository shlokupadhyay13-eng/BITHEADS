import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { Analysis, Document, Evidence, Finding } from '../types';
import { DocumentHeader } from '../components/analysis/DocumentHeader';
import { AnalysisTabs } from '../components/analysis/AnalysisTabs';
import { SummaryPanel } from '../components/analysis/SummaryPanel';
import { KeyFindings } from '../components/analysis/KeyFindings';
import { PolicyInsights } from '../components/analysis/PolicyInsights';
import { EvidencePanel } from '../components/analysis/EvidencePanel';
import { SourceReferences } from '../components/analysis/SourceReferences';

const sampleDoc: Document = {
  id: 'doc-sight-2024',
  title: 'National Green Hydrogen Mission SIGHT Guidelines',
  issuingMinistry: 'Ministry of New and Renewable Energy',
  publicationDate: '2024-03-15',
  category: 'energy',
  status: 'ready',
  fileSize: 4280192,
  pageCount: 68,
};

const sampleEvidence: Evidence = {
  id: 'cit-test-01',
  documentId: 'doc-sight-2024',
  documentTitle: 'National Green Hydrogen Mission: SIGHT Guidelines',
  pageNumber: 14,
  sectionHeading: 'Section 4.2: Eligibility Criteria',
  paragraphNumber: 3,
  excerptQuote: 'The bidder must commit to minimum local value addition (LVA) of 40% in Year 1.',
  confidenceScore: 0.98,
};

const sampleFinding: Finding = {
  id: 'find-01',
  title: 'Electrolyser Manufacturing Subsidy',
  summary: 'Direct capital incentives for establishing electrolyser manufacturing facilities.',
  mandateLevel: 'mandatory',
  effectiveDate: '2024-06-01',
  enforcingAgency: 'SECI',
  penaltiesOrConsequences: 'Revocation of bank guarantees upon default.',
  citations: [sampleEvidence],
};

const fullAnalysis: Analysis = {
  documentId: 'doc-sight-2024',
  modelVersion: 'Gemini-1.5-Pro-Policy-Tuned-v2',
  analyzedAt: '2024-04-10T09:35:12Z',
  executiveSummary: 'This guideline establishes a phased financial subsidy regime totaling ₹17,490 Crore.',
  keyPoints: [
    'Phased local value addition scaling from 40% to 60%.',
    'Volume-based production subsidy capped at ₹50/kg.',
  ],
  limitations: [
    'State-level transmission open access waivers remain unharmonized across SERCs.',
  ],
  findings: [sampleFinding],
  extractedMetrics: [
    {
      label: 'Financial Outlay',
      value: '17,490',
      unit: '₹ Crore',
      citations: [sampleEvidence],
    },
  ],
  stakeholderImpacts: [
    {
      id: 'stk-1',
      groupName: 'Domestic Clean Tech Manufacturers',
      impactType: 'positive',
      description: 'Capital subsidization and protected domestic procurement quotas.',
      complianceDeadline: '2024-12-31',
    },
  ],
  insights: [
    {
      id: 'rsk-1',
      severity: 'high',
      category: 'enforcement_gap',
      description: 'Absence of unified interstate transmission open-access waiver.',
      suggestedRemediation: 'Issue directions under Section 107 of Electricity Act.',
    },
  ],
};

describe('Phase 5B: Analysis Tolerates Missing Sections (Zero-Fabrication)', () => {
  it('renders SummaryPanel with complete sections when fully supplied', () => {
    render(<SummaryPanel analysis={fullAnalysis} />);

    expect(screen.getByText(/This guideline establishes a phased financial subsidy regime/i)).toBeDefined();
    expect(screen.getByTestId('key-points-section')).toBeDefined();
    expect(screen.getByText('Phased local value addition scaling from 40% to 60%.')).toBeDefined();
    expect(screen.getByTestId('limitations-warnings-section')).toBeDefined();
  });

  it('renders SummaryPanel gracefully when keyPoints and limitations are omitted', () => {
    const sparseAnalysis: Analysis = {
      documentId: 'doc-sparse',
      executiveSummary: 'Brief executive summary text.',
      findings: [sampleFinding],
    };

    render(<SummaryPanel analysis={sparseAnalysis} />);

    // Executive summary is rendered
    expect(screen.getByText('Brief executive summary text.')).toBeDefined();

    // Key points and limitations sections MUST NOT be rendered
    expect(screen.queryByTestId('key-points-section')).toBeNull();
    expect(screen.queryByTestId('limitations-warnings-section')).toBeNull();
  });

  it('renders PolicyInsights only for categories actually returned', () => {
    // Only has funding metrics; no risks, no stakeholders
    const fundingOnlyAnalysis: Analysis = {
      documentId: 'doc-funding',
      extractedMetrics: [
        {
          label: 'Electrolyser Incentive Outlay',
          value: '4,440',
          unit: '₹ Crore',
        },
      ],
    };

    render(<PolicyInsights analysis={fundingOnlyAnalysis} />);

    // Funding section is rendered
    expect(screen.getByText('Funding, Budgetary Allocations & Program Targets')).toBeDefined();
    expect(screen.getByText('Electrolyser Incentive Outlay')).toBeDefined();
    expect(screen.getByText('4,440')).toBeDefined();

    // Risks and stakeholders MUST NOT be fabricated
    expect(screen.queryByText(/Identified Regulatory Risks/i)).toBeNull();
    expect(screen.queryByText(/Target Population & Stakeholder Obligations/i)).toBeNull();
  });

  it('renders KeyFindings notice when no findings exist without breaking', () => {
    render(<KeyFindings findings={[]} />);
    expect(screen.getByTestId('no-findings-notice')).toBeDefined();
    expect(screen.getByText(/No specific key provisions were synthesized/i)).toBeDefined();
  });

  it('renders DocumentHeader gracefully with partial metadata', () => {
    const minimalDoc: Document = {
      id: 'doc-minimal',
      title: 'Minimal Gazette Notice 2024',
      status: 'ready',
    };

    render(<DocumentHeader document={minimalDoc} />);

    expect(screen.getByText('Minimal Gazette Notice 2024')).toBeDefined();
    expect(screen.getByText('Ready & Analyzed')).toBeDefined();
    // No model version or file size rendered without data
    expect(screen.queryByText(/Gemini/i)).toBeNull();
  });
});

describe('Phase 5B: Evidence & Grounding Rendering Rules', () => {
  it('renders quoted passage, source document, page, section heading, and paragraph only when supplied', () => {
    const handleViewSource = vi.fn();
    render(
      <EvidencePanel
        evidenceList={[sampleEvidence]}
        onViewSource={handleViewSource}
      />
    );

    // Quoted passage
    expect(screen.getByText(/The bidder must commit to minimum local value addition/i)).toBeDefined();

    // Source coordinates
    expect(screen.getByText('National Green Hydrogen Mission: SIGHT Guidelines')).toBeDefined();
    expect(screen.getByText('Page 14')).toBeDefined();
    expect(screen.getByText('Section 4.2: Eligibility Criteria')).toBeDefined();
    expect(screen.getByText('Paragraph 3')).toBeDefined();

    // Extraction confidence score
    expect(screen.getByText('Extraction Confidence: 98%')).toBeDefined();

    // View source button triggers handler
    const viewBtn = screen.getByRole('button', { name: /View source/i });
    fireEvent.click(viewBtn);
    expect(handleViewSource).toHaveBeenCalledWith(sampleEvidence);
  });

  it('never invents confidence score when not supplied', () => {
    const evidenceWithoutConfidence: Evidence = {
      id: 'cit-no-conf',
      excerptQuote: 'Statutory excerpt without machine confidence score.',
      documentTitle: 'Official Gazette',
      pageNumber: 5,
    };

    render(<EvidencePanel evidenceList={[evidenceWithoutConfidence]} />);

    expect(screen.getByText(/Statutory excerpt without machine confidence score/i)).toBeDefined();
    // Confidence score text must NOT be present
    expect(screen.queryByText(/Confidence:/i)).toBeNull();
  });

  it('visually distinguishes AI interpretation, Source evidence, and Metadata with explicit tags', () => {
    render(<EvidencePanel evidenceList={[sampleEvidence]} />);

    expect(screen.getByText('Source evidence')).toBeDefined();
    expect(screen.getByText('Metadata')).toBeDefined();
  });

  it('renders SourceReferences with unique pages and sections', () => {
    render(
      <SourceReferences
        document={sampleDoc}
        citations={[sampleEvidence]}
      />
    );

    expect(screen.getByText('Statutory Source Provenance')).toBeDefined();
    expect(screen.getByText('1 Verified Excerpts')).toBeDefined();
    expect(screen.getByText('p. 14')).toBeDefined();
    expect(screen.getByText('Section 4.2: Eligibility Criteria')).toBeDefined();
  });
});

describe('Phase 5B: AnalysisTabs Keyboard Accessibility & ARIA Semantics', () => {
  it('renders tablist with proper role, aria-selected, and tabindex', () => {
    const handleTabChange = vi.fn();
    render(
      <AnalysisTabs
        activeTab="overview"
        onTabChange={handleTabChange}
        counts={{ findings: 3, insights: 2, evidence: 5 }}
      />
    );

    const tablist = screen.getByRole('tablist');
    expect(tablist).toBeDefined();

    const overviewTab = screen.getByRole('tab', { name: /Overview/i });
    expect(overviewTab.getAttribute('aria-selected')).toBe('true');
    expect(overviewTab.getAttribute('tabindex')).toBe('0');

    const summaryTab = screen.getByRole('tab', { name: /Summary/i });
    expect(summaryTab.getAttribute('aria-selected')).toBe('false');
    expect(summaryTab.getAttribute('tabindex')).toBe('-1');
  });

  it('supports arrow-key navigation (ArrowRight, ArrowLeft, Home, End)', () => {
    const handleTabChange = vi.fn();
    render(
      <AnalysisTabs
        activeTab="overview"
        onTabChange={handleTabChange}
      />
    );

    const overviewTab = screen.getByRole('tab', { name: /Overview/i });

    // ArrowRight advances to 'summary'
    fireEvent.keyDown(overviewTab, { key: 'ArrowRight' });
    expect(handleTabChange).toHaveBeenCalledWith('summary');

    // ArrowLeft wraps around to 'brief' (last tab)
    fireEvent.keyDown(overviewTab, { key: 'ArrowLeft' });
    expect(handleTabChange).toHaveBeenCalledWith('brief');

    // End jumps to last tab ('brief')
    fireEvent.keyDown(overviewTab, { key: 'End' });
    expect(handleTabChange).toHaveBeenCalledWith('brief');

    // Home jumps to first tab ('overview')
    fireEvent.keyDown(overviewTab, { key: 'Home' });
    expect(handleTabChange).toHaveBeenCalledWith('overview');
  });
});

describe('Phase 5B: Document Lifecycle States in DocumentAnalysisPage', () => {
  it('renders unanalyzed state with [Analyze Document] button', async () => {
    const unanalyzedDoc: Document = {
      id: 'doc-unanalyzed',
      title: 'Unanalyzed Gazette 2024',
      status: 'uploaded',
    };

    const { DocumentAnalysisPage } = await import('../pages/DocumentAnalysisPage');
    const { documentsApi } = await import('../services/api/documentsApi');
    vi.spyOn(documentsApi, 'getDocumentById').mockResolvedValueOnce(unanalyzedDoc);

    render(
      <MemoryRouter>
        <DocumentAnalysisPage documentId="doc-unanalyzed" />
      </MemoryRouter>
    );

    // Shows not analyzed empty state
    await screen.findByText('Statutory Analysis Pending');
    expect(screen.getByRole('button', { name: /Analyze Document/i })).toBeDefined();
  });

  it('renders processing state with only real pipeline stages from API', async () => {
    const processingDoc: Document = {
      id: 'doc-proc',
      title: 'Processing Policy 2024',
      status: 'processing',
      stages: [
        { stage: 'upload', label: 'File Upload & Integrity Check', status: 'completed' },
        { stage: 'ocr_extraction', label: 'PDF Text Extraction & Cleaning', status: 'in_progress' },
        { stage: 'synthesis', label: 'Policy Intelligence Synthesis', status: 'pending' },
      ],
    };

    const { DocumentAnalysisPage } = await import('../pages/DocumentAnalysisPage');
    const { documentsApi } = await import('../services/api/documentsApi');
    vi.spyOn(documentsApi, 'getDocumentById').mockResolvedValueOnce(processingDoc);

    render(
      <MemoryRouter>
        <DocumentAnalysisPage documentId="doc-proc" />
      </MemoryRouter>
    );

    await screen.findByText('Statutory Synthesis Pipeline in Progress');
    expect(screen.getByText('File Upload & Integrity Check')).toBeDefined();
    expect(screen.getByText('PDF Text Extraction & Cleaning')).toBeDefined();
    expect(screen.getByText('Policy Intelligence Synthesis')).toBeDefined();
  });
});

