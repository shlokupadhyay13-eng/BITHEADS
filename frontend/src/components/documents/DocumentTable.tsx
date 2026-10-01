import React from 'react';
import { FileText, RotateCcw, ExternalLink } from 'lucide-react';
import type { Document } from '../../types';
import {
  DocumentStatusBadge,
  PolicyCategoryBadge,
  AnalysisStatusBadge,
} from '../common/Badge';
import { Button } from '../common/Button';
import { DocumentCard } from './DocumentCard';
import { formatFileSize } from '../../utils/formatters';

export interface DocumentTableProps {
  documents: Document[];
  onSelectDocument?: (docId: string) => void;
  onRetryPipeline?: (docId: string) => void;
  retryingDocId?: string | null;
  caption?: string;
}

export const DocumentTable: React.FC<DocumentTableProps> = ({
  documents,
  onSelectDocument,
  onRetryPipeline,
  retryingDocId = null,
  caption,
}) => {
  const tableCaption =
    caption ||
    `Showing ${documents.length} official policy document${documents.length === 1 ? '' : 's'} catalogued in repository`;

  return (
    <div data-testid="document-collection">
      {/* Desktop Accessible Table (hidden on mobile via CSS) */}
      <div className="table-container document-table-view">
        <table
          className="gov-table"
          aria-label="Government Policy Document Library"
          data-testid="document-table"
        >
          <caption>{tableCaption}</caption>
          <thead>
            <tr>
              <th scope="col" style={{ width: '38%' }}>
                Document
              </th>
              <th scope="col" style={{ width: '15%' }}>
                Type
              </th>
              <th scope="col" style={{ width: '12%' }}>
                Date
              </th>
              <th scope="col" style={{ width: '14%' }}>
                Status
              </th>
              <th scope="col" style={{ width: '11%' }}>
                Analysis
              </th>
              <th scope="col" style={{ textAlign: 'right', width: '10%' }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => {
              const isReady = doc.status === 'ready';
              const isFailed = doc.status === 'failed';
              const isRetrying = retryingDocId === doc.id;

              return (
                <tr key={doc.id} data-testid={`document-row-${doc.id}`}>
                  {/* Document Column (Title, Snippet, Metadata) */}
                  <td>
                    <div
                      style={{
                        fontWeight: 700,
                        color: 'var(--gov-navy-950)',
                        marginBottom: '0.25rem',
                        lineHeight: 1.4,
                      }}
                    >
                      {doc.title}
                    </div>
                    {doc.summarySnippet && (
                      <div
                        style={{
                          fontSize: '0.8125rem',
                          color: 'var(--gov-slate-600)',
                          lineHeight: '1.45',
                          marginBottom: '0.35rem',
                        }}
                      >
                        {doc.summarySnippet}
                      </div>
                    )}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        fontSize: '0.75rem',
                        color: 'var(--gov-slate-500)',
                      }}
                    >
                      {doc.issuingMinistry && (
                        <span>
                          <strong>Ministry:</strong> {doc.issuingMinistry}
                        </span>
                      )}
                      {doc.fileSize && (
                        <span>
                          <strong>Size:</strong> {formatFileSize(doc.fileSize)}
                        </span>
                      )}
                      {doc.pageCount && (
                        <span>
                          <strong>Pages:</strong> {doc.pageCount}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Type Column (Category badge with icon + text) */}
                  <td style={{ verticalAlign: 'middle' }}>
                    <PolicyCategoryBadge category={doc.category} />
                  </td>

                  {/* Date Column (Publication date) */}
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

                  {/* Status Column (Pipeline status badge + optional error) */}
                  <td style={{ verticalAlign: 'middle' }}>
                    <DocumentStatusBadge status={doc.status} />
                    {doc.failureReason && (
                      <div
                        role="alert"
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--gov-error-text)',
                          marginTop: '0.25rem',
                          maxWidth: '200px',
                          lineHeight: 1.3,
                        }}
                      >
                        {doc.failureReason}
                      </div>
                    )}
                  </td>

                  {/* Analysis Column (Analysis status badge) */}
                  <td style={{ verticalAlign: 'middle' }}>
                    <AnalysisStatusBadge status={doc.status} />
                  </td>

                  {/* Actions Column */}
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                    {isReady ? (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => onSelectDocument?.(doc.id)}
                        icon={<FileText size={14} aria-hidden="true" />}
                        aria-label={`Inspect analysis for ${doc.title}`}
                      >
                        Inspect Analysis
                      </Button>
                    ) : isFailed ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onRetryPipeline?.(doc.id)}
                        isLoading={isRetrying}
                        loadingText="Retrying..."
                        icon={<RotateCcw size={14} aria-hidden="true" />}
                        aria-label={`Retry ingestion pipeline for ${doc.title}`}
                      >
                        Retry Pipeline
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onSelectDocument?.(doc.id)}
                        icon={<ExternalLink size={14} aria-hidden="true" />}
                        aria-label={`Track processing status for ${doc.title}`}
                      >
                        Track Status
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Accessible Card List (shown on <=768px via CSS) */}
      <div className="document-card-view" data-testid="document-mobile-cards">
        {documents.map((doc) => (
          <DocumentCard
            key={doc.id}
            document={doc}
            onSelect={onSelectDocument}
            onRetry={onRetryPipeline}
            isRetrying={retryingDocId === doc.id}
          />
        ))}
      </div>
    </div>
  );
};
