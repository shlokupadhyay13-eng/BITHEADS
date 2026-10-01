import React from 'react';
import {
  ArrowLeft,
  Calendar,
  Building2,
  FileText,
  Sparkles,
} from 'lucide-react';
import type { Document } from '../../types';
import { DocumentStatusBadge, PolicyCategoryBadge } from '../common/Badge';
import { Button } from '../common/Button';
import { formatFileSize } from '../../utils/formatters';

export interface DocumentHeaderProps {
  document: Document;
  onBack?: () => void;
  modelVersion?: string;
  analyzedAt?: string;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

export const DocumentHeader: React.FC<DocumentHeaderProps> = ({
  document: doc,
  onBack,
  modelVersion,
  analyzedAt,
}) => {
  return (
    <header style={{ marginBottom: '1.75rem' }} data-testid="document-header">
      {/* Back button */}
      {onBack && (
        <div style={{ marginBottom: '1rem' }}>
          <Button
            variant="ghost"
            size="sm"
            icon={<ArrowLeft size={16} aria-hidden="true" />}
            onClick={onBack}
            aria-label="Back to Government Document Repository"
          >
            Back to Document Library
          </Button>
        </div>
      )}

      {/* Main Header Box */}
      <div
        className="card"
        style={{
          padding: '1.75rem',
          border: '1px solid var(--gov-slate-200)',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--gov-white)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {/* Top Badges & Status Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
            marginBottom: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <PolicyCategoryBadge category={doc.category} />
            <DocumentStatusBadge status={doc.status} />
          </div>

          {(modelVersion || analyzedAt) && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.75rem',
                color: 'var(--gov-slate-500)',
                backgroundColor: 'var(--gov-slate-50)',
                border: '1px solid var(--gov-slate-200)',
                padding: '0.2rem 0.5rem',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <Sparkles size={12} style={{ color: '#16a34a' }} aria-hidden="true" />
              <span>{modelVersion ? `${modelVersion}` : 'AI Analyzed'}</span>
              {analyzedAt && <span>• {formatDate(analyzedAt)}</span>}
            </div>
          )}
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: '1.625rem',
            color: 'var(--gov-navy-950)',
            lineHeight: 1.35,
            margin: '0 0 0.875rem 0',
          }}
          data-testid="document-title"
        >
          {doc.title}
        </h1>

        {/* Metadata Strip */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '1rem 1.5rem',
            fontSize: '0.875rem',
            color: 'var(--gov-slate-600)',
            paddingTop: '0.75rem',
            borderTop: '1px solid var(--gov-slate-100)',
          }}
        >
          {doc.issuingMinistry && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <Building2 size={15} style={{ color: 'var(--gov-slate-500)' }} aria-hidden="true" />
              <span style={{ fontWeight: 600, color: 'var(--gov-slate-800)' }}>
                {doc.issuingMinistry}
              </span>
            </div>
          )}

          {doc.publicationDate && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <Calendar size={15} style={{ color: 'var(--gov-slate-500)' }} aria-hidden="true" />
              <span style={{ fontFamily: 'var(--font-mono)' }}>
                Gazette Date: {formatDate(doc.publicationDate)}
              </span>
            </div>
          )}

          {(doc.fileSize || doc.pageCount) && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <FileText size={15} style={{ color: 'var(--gov-slate-500)' }} aria-hidden="true" />
              <span>
                {doc.fileSize ? formatFileSize(doc.fileSize) : null}
                {doc.fileSize && doc.pageCount ? ' • ' : null}
                {doc.pageCount ? `${doc.pageCount} pages` : null}
              </span>
            </div>
          )}
        </div>

        {/* Failure alert banner if document ingestion failed */}
        {doc.failureReason && (
          <div
            role="alert"
            style={{
              marginTop: '1rem',
              padding: '0.75rem 1rem',
              backgroundColor: 'var(--gov-error-bg)',
              color: 'var(--gov-error-text)',
              border: '1px solid var(--gov-error-border)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.875rem',
            }}
          >
            <strong>Pipeline Failure Details:</strong> {doc.failureReason}
          </div>
        )}
      </div>
    </header>
  );
};
