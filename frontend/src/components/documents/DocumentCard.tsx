import React from 'react';
import { FileText, Calendar, RotateCcw, ExternalLink } from 'lucide-react';
import type { Document } from '../../types';
import {
  DocumentStatusBadge,
  PolicyCategoryBadge,
  AnalysisStatusBadge,
} from '../common/Badge';
import { Button } from '../common/Button';
import { formatFileSize } from '../../utils/formatters';

export interface DocumentCardProps {
  document: Document;
  onSelect?: (docId: string) => void;
  onRetry?: (docId: string) => void;
  isRetrying?: boolean;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
  document: doc,
  onSelect,
  onRetry,
  isRetrying = false,
}) => {
  const isReady = doc.status === 'ready';
  const isFailed = doc.status === 'failed';

  return (
    <article
      className="card"
      data-testid={`document-card-${doc.id}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.875rem',
        padding: '1.25rem',
        border: '1px solid var(--gov-slate-200)',
        borderRadius: 'var(--radius-md)',
        backgroundColor: 'var(--gov-white)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {/* Header: Title and Category */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', flexWrap: 'wrap' }}>
        <h3
          style={{
            fontSize: '1.0625rem',
            fontWeight: 700,
            color: 'var(--gov-navy-950)',
            margin: 0,
            lineHeight: 1.4,
            flex: '1 1 200px',
          }}
        >
          {doc.title}
        </h3>
        <PolicyCategoryBadge category={doc.category} />
      </div>

      {/* Issuing Ministry & Gazette Date */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.75rem 1.25rem',
          fontSize: '0.8125rem',
          color: 'var(--gov-slate-600)',
          alignItems: 'center',
        }}
      >
        {doc.issuingMinistry && (
          <span style={{ fontWeight: 600, color: 'var(--gov-slate-800)' }}>
            {doc.issuingMinistry}
          </span>
        )}
        {doc.publicationDate && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontFamily: 'var(--font-mono)' }}>
            <Calendar size={13} aria-hidden="true" />
            {doc.publicationDate}
          </span>
        )}
        {doc.fileSize ? (
          <span>{formatFileSize(doc.fileSize)}</span>
        ) : null}
        {doc.pageCount ? (
          <span>{doc.pageCount} pages</span>
        ) : null}
      </div>

      {/* Summary Snippet if present */}
      {doc.summarySnippet && (
        <p
          style={{
            fontSize: '0.875rem',
            color: 'var(--gov-slate-700)',
            lineHeight: 1.5,
            margin: 0,
          }}
        >
          {doc.summarySnippet}
        </p>
      )}

      {/* Status Badges Section */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.5rem 0.75rem',
          alignItems: 'center',
          paddingTop: '0.5rem',
          borderTop: '1px solid var(--gov-slate-100)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--gov-slate-500)' }}>Pipeline:</span>
          <DocumentStatusBadge status={doc.status} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--gov-slate-500)' }}>Analysis:</span>
          <AnalysisStatusBadge status={doc.status} />
        </div>
      </div>

      {/* Failure Reason */}
      {doc.failureReason && (
        <div
          role="alert"
          style={{
            fontSize: '0.8125rem',
            color: 'var(--gov-error-text)',
            backgroundColor: 'var(--gov-error-bg)',
            border: '1px solid var(--gov-error-border)',
            padding: '0.5rem 0.75rem',
            borderRadius: 'var(--radius-sm)',
            lineHeight: 1.4,
          }}
        >
          <strong>Failure Reason:</strong> {doc.failureReason}
        </div>
      )}

      {/* Action Footer */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: 'auto', paddingTop: '0.5rem' }}>
        {isReady ? (
          <Button
            variant="primary"
            size="sm"
            onClick={() => onSelect?.(doc.id)}
            icon={<FileText size={14} aria-hidden="true" />}
          >
            Inspect Analysis
          </Button>
        ) : isFailed ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onRetry?.(doc.id)}
            isLoading={isRetrying}
            loadingText="Retrying Pipeline..."
            icon={<RotateCcw size={14} aria-hidden="true" />}
          >
            Retry Pipeline
          </Button>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onSelect?.(doc.id)}
            icon={<ExternalLink size={14} aria-hidden="true" />}
          >
            Track Status
          </Button>
        )}
      </div>
    </article>
  );
};
