import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { Document } from '../types';
import { DocumentCard } from '../components/documents/DocumentCard';
import { DocumentTable } from '../components/documents/DocumentTable';
import {
  validateUploadFile,
  validateUploadMetadata,
  MAX_FILE_SIZE_BYTES,
} from '../utils/uploadValidation';
import { UploadModal } from '../components/documents/UploadModal';
import { StatisticsGrid } from '../components/dashboard/StatisticsGrid';
import { RecentDocuments } from '../components/dashboard/RecentDocuments';
import { ActivityPanel } from '../components/dashboard/ActivityPanel';
import { EmptyState } from '../components/common/EmptyState';
import { Alert } from '../components/common/Alert';
import { Skeleton, SkeletonCard } from '../components/common/Skeleton';
import {
  DocumentStatusBadge,
  PolicyCategoryBadge,
  AnalysisStatusBadge,
} from '../components/common/Badge';

// Sample mock documents for testing
const mockDocs: Document[] = [
  {
    id: 'doc-001',
    title: 'National Green Hydrogen Mission SIGHT Guidelines',
    issuingMinistry: 'Ministry of New and Renewable Energy',
    publicationDate: '2024-03-15',
    category: 'energy',
    fileSize: 4280192,
    pageCount: 68,
    status: 'ready',
    uploadedAt: '2024-04-10T09:30:00Z',
    summarySnippet: 'Financial subsidy regime covering domestic electrolyser manufacturing.',
    stages: [
      { stage: 'upload', label: 'File Upload', status: 'completed', startedAt: '2024-04-10T09:30:00Z' },
      { stage: 'synthesis', label: 'Intelligence Synthesis', status: 'completed', startedAt: '2024-04-10T09:33:00Z' },
    ],
  },
  {
    id: 'doc-002',
    title: 'Digital Personal Data Protection Rules',
    issuingMinistry: 'Ministry of Electronics and Information Technology',
    publicationDate: '2024-02-20',
    category: 'technology_ai',
    fileSize: 2150400,
    pageCount: 34,
    status: 'processing',
    uploadedAt: '2024-04-12T14:15:00Z',
    stages: [
      { stage: 'upload', label: 'File Upload', status: 'completed', startedAt: '2024-04-12T14:15:00Z' },
      { stage: 'ocr_extraction', label: 'PDF Text Extraction', status: 'in_progress', startedAt: '2024-04-12T14:15:05Z' },
    ],
  },
  {
    id: 'doc-003',
    title: 'Urban Telemedicine Interoperability Standards',
    issuingMinistry: 'Ministry of Health and Family Welfare',
    publicationDate: '2023-11-28',
    category: 'healthcare',
    fileSize: 3145728,
    pageCount: 48,
    status: 'failed',
    failureReason: 'Corrupted font encoding tables encountered on pages 14-18.',
    uploadedAt: '2024-04-14T08:20:00Z',
  },
];

describe('Phase 5A: DocumentCard & DocumentTable Components', () => {
  it('renders DocumentCard with title, category, date, and status badges', () => {
    const handleSelect = vi.fn();
    render(
      <DocumentCard document={mockDocs[0]} onSelect={handleSelect} />
    );

    expect(screen.getByText('National Green Hydrogen Mission SIGHT Guidelines')).toBeDefined();
    expect(screen.getByText('Ministry of New and Renewable Energy')).toBeDefined();
    expect(screen.getByText('2024-03-15')).toBeDefined();
    expect(screen.getByText('Energy & Renewables')).toBeDefined();
    expect(screen.getByText('Ready & Analyzed')).toBeDefined();
    expect(screen.getByText('Synthesized & Grounded')).toBeDefined();

    // Inspect Analysis button
    const inspectBtn = screen.getByRole('button', { name: /Inspect Analysis/i });
    fireEvent.click(inspectBtn);
    expect(handleSelect).toHaveBeenCalledWith('doc-001');
  });

  it('renders failure reason and retry button for failed document card', () => {
    const handleRetry = vi.fn();
    render(
      <DocumentCard document={mockDocs[2]} onRetry={handleRetry} />
    );

    expect(screen.getByText(/Corrupted font encoding tables/i)).toBeDefined();
    expect(screen.getByText('Ingestion Failed')).toBeDefined();
    const retryBtn = screen.getByRole('button', { name: /Retry Pipeline/i });
    fireEvent.click(retryBtn);
    expect(handleRetry).toHaveBeenCalledWith('doc-003');
  });

  it('renders DocumentTable with accessible caption and scoped column headers', () => {
    render(
      <DocumentTable documents={mockDocs} />
    );

    // Caption check
    const caption = screen.getByText(/Showing 3 official policy documents/i);
    expect(caption).toBeDefined();

    // Scoped header checks
    expect(screen.getByRole('columnheader', { name: 'Document' })).toBeDefined();
    expect(screen.getByRole('columnheader', { name: 'Type' })).toBeDefined();
    expect(screen.getByRole('columnheader', { name: 'Date' })).toBeDefined();
    expect(screen.getByRole('columnheader', { name: 'Status' })).toBeDefined();
    expect(screen.getByRole('columnheader', { name: 'Analysis' })).toBeDefined();
    expect(screen.getByRole('columnheader', { name: 'Actions' })).toBeDefined();

    // Table rows rendered
    expect(screen.getByTestId('document-row-doc-001')).toBeDefined();
    expect(screen.getByTestId('document-row-doc-002')).toBeDefined();
    expect(screen.getByTestId('document-row-doc-003')).toBeDefined();

    // Mobile view container also populated
    expect(screen.getByTestId('document-mobile-cards')).toBeDefined();
  });

  it('verifies status badges use icon + text, never color alone (WCAG 2.2 AA)', () => {
    const { container } = render(
      <div>
        <DocumentStatusBadge status="ready" />
        <DocumentStatusBadge status="processing" />
        <DocumentStatusBadge status="failed" />
        <PolicyCategoryBadge category="environmental" />
        <AnalysisStatusBadge status="ready" />
      </div>
    );

    // Text content present
    expect(screen.getByText('Ready & Analyzed')).toBeDefined();
    expect(screen.getByText('Processing Pipeline')).toBeDefined();
    expect(screen.getByText('Ingestion Failed')).toBeDefined();
    expect(screen.getByText('Environment & Climate')).toBeDefined();
    expect(screen.getByText('Synthesized & Grounded')).toBeDefined();

    // SVG icons are embedded within badges
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThanOrEqual(5);
  });
});

describe('Phase 5A: Upload Frontend Validation (UX Only)', () => {
  it('rejects empty or null file', () => {
    expect(validateUploadFile(null).isValid).toBe(false);
    expect(validateUploadFile(null).error).toContain('Please choose a statutory policy document');

    const emptyFile = new File([''], 'empty.pdf', { type: 'application/pdf' });
    const res = validateUploadFile(emptyFile);
    expect(res.isValid).toBe(false);
    expect(res.error).toContain('The selected file is empty (0 bytes)');
  });

  it('rejects files exceeding maximum size (50MB)', () => {
    const oversizedFile = {
      name: 'large_gazette.pdf',
      size: MAX_FILE_SIZE_BYTES + 1024,
      type: 'application/pdf',
    } as unknown as File;

    const res = validateUploadFile(oversizedFile);
    expect(res.isValid).toBe(false);
    expect(res.error).toContain('exceeds the maximum statutory limit of 50 MB');
  });

  it('rejects unsupported file extensions', () => {
    const exeFile = new File(['fake binary'], 'malicious.exe', { type: 'application/x-msdownload' });
    const zipFile = new File(['fake archive'], 'archive.zip', { type: 'application/zip' });

    expect(validateUploadFile(exeFile).isValid).toBe(false);
    expect(validateUploadFile(exeFile).error).toContain('Unsupported file format');

    expect(validateUploadFile(zipFile).isValid).toBe(false);
    expect(validateUploadFile(zipFile).error).toContain('Unsupported file format');
  });

  it('accepts valid PDF, DOCX, and TXT files under 50MB', () => {
    const validPdf = new File(['%PDF-1.4 statutory text content'], 'policy.pdf', { type: 'application/pdf' });
    const validDocx = new File(['docx content'], 'memorandum.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    const validTxt = new File(['plain gazette text'], 'gazette.txt', { type: 'text/plain' });

    expect(validateUploadFile(validPdf).isValid).toBe(true);
    expect(validateUploadFile(validDocx).isValid).toBe(true);
    expect(validateUploadFile(validTxt).isValid).toBe(true);
  });

  it('validates upload metadata fields', () => {
    // Missing title
    const missingTitle = validateUploadMetadata({
      title: '',
      issuingMinistry: 'Ministry of Power',
      publicationDate: '2024-01-01',
    });
    expect(missingTitle.title).toContain('Document title is required');

    // Title too short
    const shortTitle = validateUploadMetadata({
      title: 'ab',
      issuingMinistry: 'Ministry of Power',
      publicationDate: '2024-01-01',
    });
    expect(shortTitle.title).toContain('at least 3 characters');

    // Missing ministry
    const missingMinistry = validateUploadMetadata({
      title: 'Valid Statutory Policy Title',
      issuingMinistry: '   ',
      publicationDate: '2024-01-01',
    });
    expect(missingMinistry.ministry).toContain('Issuing ministry or regulatory authority is required');

    // Missing date
    const missingDate = validateUploadMetadata({
      title: 'Valid Statutory Policy Title',
      issuingMinistry: 'Ministry of Power',
      publicationDate: '',
    });
    expect(missingDate.pubDate).toContain('Official gazette or publication date is required');

    // Completely valid
    const valid = validateUploadMetadata({
      title: 'Valid Statutory Policy Title',
      issuingMinistry: 'Ministry of Power',
      publicationDate: '2024-01-01',
    });
    expect(Object.keys(valid).length).toBe(0);
  });
});

describe('Phase 5A: Upload Modal Keyboard and Screen Reader Accessibility', () => {
  it('renders accessible live region and dropzone with specs', () => {
    const handleClose = vi.fn();
    const handleSuccess = vi.fn();

    render(
      <UploadModal
        isOpen={true}
        onClose={handleClose}
        onUploadSuccess={handleSuccess}
        existingDocuments={mockDocs}
      />
    );

    // Dialog title
    expect(screen.getByText('Ingest Statutory Policy Document')).toBeDefined();

    // Supported formats and size limit announcement
    expect(screen.getByText(/Supported formats:/i)).toBeDefined();
    expect(screen.getByText(/50 MB/i)).toBeDefined();

    // Dropzone accessible button
    const dropzone = screen.getByTestId('file-dropzone');
    expect(dropzone.getAttribute('role')).toBe('button');
    expect(dropzone.getAttribute('tabindex')).toBe('0');

    // Live region for screen readers
    const liveRegion = screen.getByTestId('upload-aria-live');
    expect(liveRegion.getAttribute('aria-live')).toBe('polite');
  });

  it('triggers duplicate warning when existing document title is typed', () => {
    render(
      <UploadModal
        isOpen={true}
        onClose={vi.fn()}
        onUploadSuccess={vi.fn()}
        existingDocuments={mockDocs}
      />
    );

    const titleInput = screen.getByLabelText(/Official Statutory Title/i);
    fireEvent.change(titleInput, { target: { value: 'National Green Hydrogen Mission SIGHT Guidelines' } });

    expect(screen.getByText(/already exists in the workspace/i)).toBeDefined();
  });
});

describe('Phase 5A: Dashboard StatisticsGrid & Metrics Grounding', () => {
  it('renders live metrics and clearly labels mock/demo metrics', () => {
    render(
      <StatisticsGrid
        metrics={{
          totalDocuments: 8,
          recentAnalyses: 5,
          questionsAsked: 14,
          researchBriefs: 3,
        }}
        isLoading={false}
      />
    );

    // Live API metrics
    expect(screen.getByText('8')).toBeDefined();
    expect(screen.getByText('5')).toBeDefined();
    const liveBadges = screen.getAllByText('Live API Repository');
    expect(liveBadges.length).toBeGreaterThan(0);

    // Demo / mock labeled metrics
    expect(screen.getByText('14')).toBeDefined();
    expect(screen.getByText('3')).toBeDefined();
    const demoBadges = screen.getAllByText('Demo / Workspace Telemetry');
    expect(demoBadges.length).toBeGreaterThan(0);
  });

  it('renders skeleton cards when loading', () => {
    render(<StatisticsGrid metrics={{ totalDocuments: 0, recentAnalyses: 0 }} isLoading={true} />);
    const skeletonGrid = screen.getByTestId('statistics-grid-skeleton');
    expect(skeletonGrid.getAttribute('aria-busy')).toBe('true');
  });

  it('renders RecentDocuments with table and empty state', () => {
    const handleUploadClick = vi.fn();
    const { rerender } = render(
      <MemoryRouter>
        <RecentDocuments documents={mockDocs} isLoading={false} />
      </MemoryRouter>
    );

    expect(screen.getByTestId('recent-documents-panel')).toBeDefined();
    expect(screen.getByTestId('recent-documents-table')).toBeDefined();
    expect(screen.getByText('Recent Statutory Documents')).toBeDefined();

    // Rerender with empty docs to verify empty state action
    rerender(
      <MemoryRouter>
        <RecentDocuments documents={[]} isLoading={false} onUploadClick={handleUploadClick} />
      </MemoryRouter>
    );

    expect(screen.getByText('No documents ingested yet')).toBeDefined();
    const uploadBtn = screen.getByRole('button', { name: /Upload First Policy Document/i });
    fireEvent.click(uploadBtn);
    expect(handleUploadClick).toHaveBeenCalledTimes(1);
  });
});

describe('Phase 5A: ActivityPanel Real Events Integrity', () => {
  it('renders only real events derived from actual loaded documents', () => {
    render(<ActivityPanel documents={mockDocs} isLoading={false} />);

    // Should include real events for the mock documents
    expect(screen.getAllByText('Document Ingestion Initiated').length).toBeGreaterThan(0);
    expect(screen.getByText('Policy Intelligence Synthesized')).toBeDefined();
    expect(screen.getByText('Pipeline Stage: PDF Text Extraction')).toBeDefined();
    expect(screen.getByText('Extraction Pipeline Failed')).toBeDefined();
  });

  it('renders empty message when no documents exist', () => {
    render(<ActivityPanel documents={[]} isLoading={false} />);
    expect(screen.getByText(/No workspace activity recorded yet/i)).toBeDefined();
  });
});

describe('Phase 5A: Empty and Error States', () => {
  it('renders EmptyState with title, description, and next action', () => {
    const handleAction = vi.fn();
    render(
      <EmptyState
        title="No policy documents match your criteria"
        description="Try adjusting your sector filter or clearing search."
        actionLabel="Clear Filters"
        onAction={handleAction}
      />
    );

    expect(screen.getByText('No policy documents match your criteria')).toBeDefined();
    expect(screen.getByText('Try adjusting your sector filter or clearing search.')).toBeDefined();

    const actionBtn = screen.getByRole('button', { name: 'Clear Filters' });
    fireEvent.click(actionBtn);
    expect(handleAction).toHaveBeenCalledTimes(1);
  });

  it('renders Alert component with error role and contents', () => {
    render(
      <Alert variant="error" title="Ingestion Pipeline Failure">
        Network connection timed out after 30000ms.
      </Alert>
    );

    expect(screen.getByText('Ingestion Pipeline Failure')).toBeDefined();
    expect(screen.getByText('Network connection timed out after 30000ms.')).toBeDefined();
    expect(screen.getByRole('alert')).toBeDefined();
  });

  it('renders accessible Skeleton loaders with role="status"', () => {
    render(
      <div>
        <Skeleton width="100px" height="20px" aria-label="Loading document statistics" />
        <SkeletonCard />
      </div>
    );

    const statuses = screen.getAllByRole('status');
    expect(statuses.length).toBeGreaterThanOrEqual(1);
  });
});
