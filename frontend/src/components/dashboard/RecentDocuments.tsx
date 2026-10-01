import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, FileText, UploadCloud, RotateCcw } from 'lucide-react';
import type { Document } from '../../types';
import {
  DocumentStatusBadge,
  PolicyCategoryBadge,
  AnalysisStatusBadge,
} from '../common/Badge';
import { Button } from '../common/Button';
import { EmptyState } from '../common/EmptyState';
import { SkeletonTableRow } from '../common/Skeleton';

export interface RecentDocumentsProps {
  documents: Document[];
  isLoading?: boolean;
  onUploadClick?: () => void;
  onRetryPipeline?: (docId: string) => void;
  retryingDocId?: string | null;
}

export const RecentDocuments: React.FC<RecentDocumentsProps> = ({
  documents,
  isLoading = false,
  onUploadClick,
  onRetryPipeline,
  retryingDocId,
}) => {
  return (
    <div
      className="card"
      style={{
        padding: '1.5rem',
        border: '1px solid var(--gov-slate-200)',
        borderRadius: 'var(--radius-md)',
        backgroundColor: 'var(--gov-white)',
        marginBottom: '2rem',
      }}
      data-testid="recent-documents-panel"
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.25rem',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.25rem', color: 'var(--gov-navy-950)', margin: 0 }}>
            Recent Statutory Documents
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--gov-slate-600)', margin: '0.25rem 0 0 0' }}>
            Latest policy filings and active regulatory intelligence extractions
          </p>
        </div>

        <Link
          to="/documents"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: 'var(--gov-navy-900)',
            textDecoration: 'none',
          }}
        >
          <span>View All in Library</span>
          <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </div>

      {isLoading ? (
        <div className="table-container" style={{ margin: 0 }}>
          <table className="gov-table" aria-label="Loading recent documents">
            <thead>
              <tr>
                <th scope="col">Document</th>
                <th scope="col">Type</th>
                <th scope="col">Date</th>
                <th scope="col">Processing Status</th>
                <th scope="col">Analysis Status</th>
                <th scope="col" style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              <SkeletonTableRow cols={6} />
              <SkeletonTableRow cols={6} />
              <SkeletonTableRow cols={6} />
            </tbody>
          </table>
        </div>
      ) : documents.length === 0 ? (
        <EmptyState
          title="No documents ingested yet"
          description="Your research repository is currently empty. Ingest your first statutory gazette or policy document to begin automated clause extraction."
          actionLabel="Upload First Policy Document"
          onAction={onUploadClick}
          icon={<UploadCloud size={36} aria-hidden="true" />}
        />
      ) : (
        <div className="table-container" style={{ margin: 0 }}>
          <table
            className="gov-table"
            aria-label="Recent Policy Documents"
            data-testid="recent-documents-table"
          >
            <caption>
              Displaying {documents.length} most recently updated policy document{documents.length === 1 ? '' : 's'}
            </caption>
            <thead>
              <tr>
                <th scope="col" style={{ width: '40%' }}>Document</th>
                <th scope="col" style={{ width: '15%' }}>Type</th>
                <th scope="col" style={{ width: '12%' }}>Date</th>
                <th scope="col" style={{ width: '13%' }}>Processing Status</th>
                <th scope="col" style={{ width: '10%' }}>Analysis Status</th>
                <th scope="col" style={{ textAlign: 'right', width: '10%' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => {
                const isReady = doc.status === 'ready';
                const isFailed = doc.status === 'failed';
                const isRetrying = retryingDocId === doc.id;

                return (
                  <tr key={doc.id} data-testid={`recent-doc-row-${doc.id}`}>
                    <td>
                      <Link
                        to={isReady ? `/insights?id=${doc.id}` : `/documents`}
                        style={{
                          fontWeight: 700,
                          color: 'var(--gov-navy-950)',
                          textDecoration: 'none',
                          lineHeight: 1.4,
                          display: 'block',
                          marginBottom: '0.2rem',
                        }}
                      >
                        {doc.title}
                      </Link>
                      {doc.issuingMinistry && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--gov-slate-500)' }}>
                          {doc.issuingMinistry}
                        </div>
                      )}
                    </td>
                    <td style={{ verticalAlign: 'middle' }}>
                      <PolicyCategoryBadge category={doc.category} />
                    </td>
                    <td
                      style={{
                        whiteSpace: 'nowrap',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.8125rem',
                        verticalAlign: 'middle',
                      }}
                    >
                      {doc.publicationDate || '—'}
                    </td>
                    <td style={{ verticalAlign: 'middle' }}>
                      <DocumentStatusBadge status={doc.status} />
                    </td>
                    <td style={{ verticalAlign: 'middle' }}>
                      <AnalysisStatusBadge status={doc.status} />
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                      {isReady ? (
                        <Link to={`/insights?id=${doc.id}`} style={{ textDecoration: 'none' }}>
                          <Button
                            variant="primary"
                            size="sm"
                            icon={<FileText size={14} aria-hidden="true" />}
                            aria-label={`Inspect analysis for ${doc.title}`}
                          >
                            Inspect
                          </Button>
                        </Link>
                      ) : isFailed ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => onRetryPipeline?.(doc.id)}
                          isLoading={isRetrying}
                          loadingText="Retrying..."
                          icon={<RotateCcw size={14} aria-hidden="true" />}
                          aria-label={`Retry processing for ${doc.title}`}
                        >
                          Retry
                        </Button>
                      ) : (
                        <Link to="/documents" style={{ textDecoration: 'none' }}>
                          <Button variant="secondary" size="sm">
                            Track
                          </Button>
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
