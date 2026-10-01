import React from 'react';
import { BookOpen, ShieldCheck } from 'lucide-react';
import type { Document, Evidence } from '../../types';

export interface SourceReferencesProps {
  document: Document;
  citations: Evidence[];
}

export const SourceReferences: React.FC<SourceReferencesProps> = ({
  document: doc,
  citations,
}) => {
  // Collect unique pages cited
  const uniquePages = Array.from(
    new Set(citations.map((c) => c.pageNumber).filter((p): p is number => p !== undefined))
  ).sort((a, b) => a - b);

  // Collect unique sections cited
  const uniqueSections = Array.from(
    new Set(citations.map((c) => c.sectionHeading).filter((s): s is string => Boolean(s)))
  );

  return (
    <div
      className="card-meta"
      style={{
        borderRadius: 'var(--radius-md)',
        backgroundColor: 'var(--gov-meta-surface)',
        border: '1px solid var(--gov-meta-border)',
        padding: '1.5rem',
      }}
      data-testid="source-references-card"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <BookOpen size={18} style={{ color: 'var(--gov-navy-900)' }} aria-hidden="true" />
        <h3 style={{ fontSize: '1.0625rem', color: 'var(--gov-navy-950)', margin: 0 }}>
          Statutory Source Provenance
        </h3>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--gov-slate-200)', paddingBottom: '0.5rem' }}>
          <span style={{ color: 'var(--gov-slate-600)' }}>Document Title:</span>
          <span style={{ fontWeight: 600, color: 'var(--gov-navy-950)', textAlign: 'right', maxWidth: '60%' }}>
            {doc.title}
          </span>
        </div>

        {doc.issuingMinistry && (
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--gov-slate-200)', paddingBottom: '0.5rem' }}>
            <span style={{ color: 'var(--gov-slate-600)' }}>Issuing Authority:</span>
            <span style={{ fontWeight: 600, color: 'var(--gov-navy-950)', textAlign: 'right' }}>
              {doc.issuingMinistry}
            </span>
          </div>
        )}

        {doc.publicationDate && (
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--gov-slate-200)', paddingBottom: '0.5rem' }}>
            <span style={{ color: 'var(--gov-slate-600)' }}>Gazette Date:</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--gov-slate-800)' }}>
              {doc.publicationDate}
            </span>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--gov-slate-200)', paddingBottom: '0.5rem' }}>
          <span style={{ color: 'var(--gov-slate-600)' }}>Citations Extracted:</span>
          <span style={{ fontWeight: 700, color: '#15803d' }}>
            {citations.length} Verified Excerpts
          </span>
        </div>

        {uniquePages.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--gov-slate-200)', paddingBottom: '0.5rem' }}>
            <span style={{ color: 'var(--gov-slate-600)' }}>Pages Referenced:</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: 'var(--gov-slate-800)' }}>
              {uniquePages.map((p) => `p. ${p}`).join(', ')}
            </span>
          </div>
        )}

        {uniqueSections.length > 0 && (
          <div>
            <span style={{ color: 'var(--gov-slate-600)', display: 'block', marginBottom: '0.35rem' }}>
              Indexed Statutory Sections:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {uniqueSections.map((sec, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: '0.75rem',
                    backgroundColor: 'var(--gov-white)',
                    border: '1px solid var(--gov-slate-200)',
                    padding: '0.15rem 0.45rem',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--gov-slate-700)',
                  }}
                >
                  {sec}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          marginTop: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          fontSize: '0.75rem',
          color: '#15803d',
          fontWeight: 600,
        }}
      >
        <ShieldCheck size={14} aria-hidden="true" />
        <span>Statutory Provenance Register Verified</span>
      </div>
    </div>
  );
};
