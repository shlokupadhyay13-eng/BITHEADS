import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import axe from 'axe-core';
import { AuthProvider } from '../context/AuthContext';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { DashboardPage } from '../pages/DashboardPage';
import { DocumentListPage } from '../pages/DocumentListPage';
import { QuestionsPage } from '../pages/QuestionsPage';
import { CrossPolicyComparePage } from '../pages/CrossPolicyComparePage';
import { PolicyBriefExportPage } from '../pages/PolicyBriefExportPage';
import { DocumentHeader } from '../components/analysis/DocumentHeader';
import { AnalysisTabs } from '../components/analysis/AnalysisTabs';
import { SummaryPanel } from '../components/analysis/SummaryPanel';
import { EvidencePanel } from '../components/analysis/EvidencePanel';
import { QuestionResultView } from '../components/qa/QuestionResultView';
import { ComparisonResultsView } from '../components/compare/ComparisonResultsView';
import { ResearchBriefView } from '../components/brief/ResearchBriefView';
import { Modal } from '../components/common/Modal';
import { UploadModal } from '../components/documents/UploadModal';
import type { Document, Analysis, QuestionResponse, Comparison, ResearchBrief } from '../types';

// Helper to run axe-core on a rendered DOM node with WCAG 2.2 AA rules
async function checkA11y(container: HTMLElement) {
  const results = await axe.run(container, {
    rules: {
      // In virtual/JSDOM/happy-dom environments, color contrast measurements require real layout geometry
      'color-contrast': { enabled: false },
    },
  });

  if (results.violations.length > 0) {
    console.error('Axe violations found:', JSON.stringify(results.violations.map(v => ({ id: v.id, description: v.description, nodes: v.nodes.map(n => n.html) })), null, 2));
  }

  return results.violations;
}

const mockDoc: Document = {
  id: 'doc-test-100',
  title: 'Statutory Telecommunications & Network Security Framework',
  issuingMinistry: 'Ministry of Communications',
  publicationDate: '2024-05-10',
  category: 'technology_ai',
  status: 'ready',
  fileSize: 1048576,
  pageCount: 42,
};

const mockAnalysis: Analysis = {
  documentId: 'doc-test-100',
  executiveSummary: 'This guideline mandates network resilience audits.',
  findings: [
    {
      id: 'f-1',
      title: 'Mandatory Threat Reporting',
      summary: 'Entities must report incidents within 6 hours.',
      mandateLevel: 'mandatory',
    },
  ],
  keyPoints: ['Incident reporting in 6 hours.', 'Annual third-party security audits.'],
  limitations: ['Applies only to Tier 1 licensed service providers.'],
};

const mockQa: QuestionResponse = {
  id: 'qa-1',
  question: 'What are the incident notification windows?',
  answer: 'Statutory entities must notify the nodal agency within 6 hours.',
  evidence: [
    {
      id: 'ev-1',
      documentTitle: 'Telecommunications Framework',
      pageNumber: 12,
      sectionHeading: 'Section 4.1',
      excerptQuote: 'Notice must be provided within six hours of incident discovery.',
    },
  ],
};

const mockComparison: Comparison = {
  query: 'Compare regulatory incident thresholds',
  documentIds: ['doc-1', 'doc-2'],
  synthesizedAnswer: 'Both frameworks require rapid disclosure.',
  similarities: ['Both enforce rapid incident notification.'],
  differences: ['Fine structures vary between civil penalties and license suspension.'],
  comparisonMatrix: [
    {
      comparisonTopic: 'Incident Notification',
      findings: [
        {
          documentId: 'doc-1',
          documentTitle: 'Telecommunications Framework',
          findingSummary: 'Mandatory 6-hour window.',
        },
        {
          documentId: 'doc-2',
          documentTitle: 'DPDP Rules',
          findingSummary: 'Mandatory 72-hour window.',
        },
      ],
    },
  ],
};

const mockBrief: ResearchBrief = {
  id: 'brief-a11y',
  title: 'Executive Brief on Network Security',
  topic: 'Cybersecurity Mandates',
  ministry: 'Ministry of Communications',
  gazetteDate: '2024-05-10',
  executiveSummary: 'Executive overview of cybersecurity statutory compliance.',
  keyFindings: [
    {
      id: 'kf-1',
      title: 'Audit Requirement',
      summary: 'Annual audits mandatory.',
    },
  ],
  policyAnalysis: 'Comprehensive policy analysis.',
};

describe('PHASE 6-7 — Automated Accessibility Audit (axe-core)', () => {
  it('passes axe accessibility tests on LoginPage', async () => {
    const { container } = render(
      <MemoryRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>
    );

    const violations = await checkA11y(container);
    expect(violations.length).toBe(0);
  });

  it('passes axe accessibility tests on RegisterPage', async () => {
    const { container } = render(
      <MemoryRouter>
        <AuthProvider>
          <RegisterPage />
        </AuthProvider>
      </MemoryRouter>
    );

    const violations = await checkA11y(container);
    expect(violations.length).toBe(0);
  });

  it('passes axe accessibility tests on DashboardPage', async () => {
    const { container } = render(
      <MemoryRouter>
        <AuthProvider>
          <DashboardPage />
        </AuthProvider>
      </MemoryRouter>
    );

    const violations = await checkA11y(container);
    expect(violations.length).toBe(0);
  });

  it('passes axe accessibility tests on DocumentListPage', async () => {
    const { container } = render(
      <MemoryRouter>
        <DocumentListPage />
      </MemoryRouter>
    );

    const violations = await checkA11y(container);
    expect(violations.length).toBe(0);
  });

  it('passes axe accessibility tests on Document Analysis Components', async () => {
    const { container } = render(
      <MemoryRouter>
        <div>
          <DocumentHeader document={mockDoc} />
          <AnalysisTabs activeTab="overview" onTabChange={() => {}} />
          <div role="tabpanel" id="analysis-panel-overview" aria-labelledby="analysis-tab-overview">
            <SummaryPanel analysis={mockAnalysis} />
            <EvidencePanel
              evidenceList={mockQa.evidence || []}
              onViewSource={() => {}}
            />
          </div>
          <div role="tabpanel" id="analysis-panel-summary" aria-labelledby="analysis-tab-summary" hidden />
          <div role="tabpanel" id="analysis-panel-insights" aria-labelledby="analysis-tab-insights" hidden />
          <div role="tabpanel" id="analysis-panel-evidence" aria-labelledby="analysis-tab-evidence" hidden />
          <div role="tabpanel" id="analysis-panel-questions" aria-labelledby="analysis-tab-questions" hidden />
          <div role="tabpanel" id="analysis-panel-compare" aria-labelledby="analysis-tab-compare" hidden />
          <div role="tabpanel" id="analysis-panel-brief" aria-labelledby="analysis-tab-brief" hidden />
        </div>
      </MemoryRouter>
    );

    const violations = await checkA11y(container);
    expect(violations.length).toBe(0);
  });

  it('passes axe accessibility tests on QuestionsPage and QuestionResultView', async () => {
    const { container: pageContainer } = render(
      <MemoryRouter>
        <QuestionsPage />
      </MemoryRouter>
    );
    const pageViolations = await checkA11y(pageContainer);
    expect(pageViolations.length).toBe(0);

    const { container: resultContainer } = render(
      <MemoryRouter>
        <QuestionResultView result={mockQa} />
      </MemoryRouter>
    );
    const resultViolations = await checkA11y(resultContainer);
    expect(resultViolations.length).toBe(0);
  });

  it('passes axe accessibility tests on CrossPolicyComparePage and ComparisonResultsView', async () => {
    const { container: compareContainer } = render(
      <MemoryRouter>
        <CrossPolicyComparePage />
      </MemoryRouter>
    );
    const pageViolations = await checkA11y(compareContainer);
    expect(pageViolations.length).toBe(0);

    const { container: matrixContainer } = render(
      <MemoryRouter>
        <ComparisonResultsView comparison={mockComparison} />
      </MemoryRouter>
    );
    const matrixViolations = await checkA11y(matrixContainer);
    expect(matrixViolations.length).toBe(0);
  });

  it('passes axe accessibility tests on PolicyBriefExportPage and ResearchBriefView', async () => {
    const { container: briefPageContainer } = render(
      <MemoryRouter>
        <PolicyBriefExportPage />
      </MemoryRouter>
    );
    const pageViolations = await checkA11y(briefPageContainer);
    expect(pageViolations.length).toBe(0);

    const { container: viewContainer } = render(
      <MemoryRouter>
        <ResearchBriefView brief={mockBrief} />
      </MemoryRouter>
    );
    const viewViolations = await checkA11y(viewContainer);
    expect(viewViolations.length).toBe(0);
  });

  it('passes axe accessibility tests on Modal and UploadModal dialogs', async () => {
    const { container: modalContainer } = render(
      <Modal isOpen={true} onClose={() => {}} title="Accessible Test Modal">
        <p>Accessible modal content</p>
      </Modal>
    );
    const modalViolations = await checkA11y(modalContainer);
    expect(modalViolations.length).toBe(0);

    const { container: uploadModalContainer } = render(
      <UploadModal isOpen={true} onClose={() => {}} onUploadSuccess={() => {}} />
    );
    const uploadViolations = await checkA11y(uploadModalContainer);
    expect(uploadViolations.length).toBe(0);
  });
});
