import React from 'react';
import {
  ShieldCheck,
  BookOpen,
  X,
} from 'lucide-react';
import type { Evidence } from '../../types';

export interface EvidencePanelProps {
  evidenceList: Evidence[];
  selectedEvidence?: Evidence | null;
  onClearSelection?: () => void;
  onViewSource?: (evidence: Evidence) => void;
  isSidePanel?: boolean;
}

export const EvidencePanel: React.FC<EvidencePanelProps> = ({
  evidenceList,
  selectedEvidence,
  onClearSelection,
  onViewSource,
  isSidePanel = false,
}) => {
  const displayList = selectedEvidence ? [selectedEvidence] : evidenceList;

  if (displayList.length === 0) {
    return (
      <div
        className="card"
        style={{
          padding: '2rem 1.5rem',
          textAlign: 'center',
          backgroundColor: 'var(--gov-slate-50)',
          borderRadius: 'var(--radius-md)',
          border: '1px dashed var(--gov-slate-300)',
          color: 'var(--gov-slate-600)',
        }}
        data-testid="no-evidence-notice"
      >
        <ShieldCheck size={32} style={{ color: 'var(--gov-slate-400)', marginBottom: '0.5rem' }} aria-hidden="true" />
        <h3 style={{ fontSize: '1rem', color: 'var(--gov-navy-950)', margin: '0 0 0.25rem 0' }}>
          No Citation Excerpts Pinned
        </h3>
        <p style={{ fontSize: '0.8125rem', margin: 0 }}>
          Select any provision or finding from the left panel to inspect its verbatim source attribution.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
      }}
      data-testid="evidence-panel"
    >
      {/* Panel Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldCheck size={18} style={{ color: 'var(--gov-navy-900)' }} aria-hidden="true" />
          <h2
            style={{
              fontSize: isSidePanel ? '1.0625rem' : '1.25rem',
              color: 'var(--gov-navy-950)',
              margin: 0,
              fontWeight: 700,
            }}
          >
            {selectedEvidence ? 'Pinned Statutory Evidence' : `Source Evidence Register (${evidenceList.length})`}
          </h2>
        </div>

        {selectedEvidence && onClearSelection && (
          <button
            type="button"
            onClick={onClearSelection}
            className="btn-ghost"
            style={{
              fontSize: '0.75rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              color: 'var(--gov-slate-600)',
              padding: '0.2rem 0.4rem',
            }}
          >
            <X size={14} aria-hidden="true" />
            Show All
          </button>
        )}
      </div>

      {/* List of Evidence Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {displayList.map((cit, idx) => (
          <div
            key={cit.id || idx}
            className="card-evidence"
            style={{
              margin: 0,
              border: '1px solid var(--gov-evidence-border)',
              borderLeft: '4px solid var(--gov-evidence-quote-border)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--gov-evidence-surface)',
              padding: '1.25rem',
              boxShadow: 'var(--shadow-sm)',
            }}
            data-testid={`evidence-card-${cit.id || idx}`}
          >
            {/* Visual separation label: Source evidence */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.5rem',
                marginBottom: '0.75rem',
              }}
            >
              <span
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  padding: '0.15rem 0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--gov-evidence-badge-bg)',
                  color: 'var(--gov-evidence-badge-text)',
                  border: '1px solid var(--gov-evidence-badge-border)',
                }}
              >
                Source evidence
              </span>

              {/* Zero fabrication rule: only show confidenceScore if explicitly supplied */}
              {cit.confidenceScore !== undefined && (
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--gov-slate-600)',
                    backgroundColor: 'var(--gov-slate-100)',
                    padding: '0.1rem 0.4rem',
                    borderRadius: '2px',
                  }}
                >
                  Extraction Confidence: {(cit.confidenceScore * 100).toFixed(0)}%
                </span>
              )}
            </div>

            {/* Quoted Passage */}
            <blockquote
              className="evidence-quote"
              style={{
                margin: '0 0 0.875rem 0',
                fontFamily: 'var(--font-serif)',
                fontSize: '0.9375rem',
                lineHeight: 1.65,
                color: 'var(--gov-evidence-text)',
              }}
            >
              "{cit.excerptQuote}"
            </blockquote>

            {/* Statutory Metadata Section with Metadata tag */}
            <div
              style={{
                paddingTop: '0.75rem',
                borderTop: '1px solid var(--gov-evidence-border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    padding: '0.1rem 0.35rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--gov-meta-surface)',
                    color: 'var(--gov-slate-600)',
                    border: '1px solid var(--gov-meta-border)',
                  }}
                >
                  Metadata
                </span>

                {cit.documentTitle && (
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--gov-slate-800)' }}>
                    {cit.documentTitle}
                  </span>
                )}
              </div>

              {/* Citations Coordinates */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.35rem 0.5rem',
                  fontSize: '0.75rem',
                  color: 'var(--gov-slate-600)',
                }}
              >
                {cit.pageNumber !== undefined && (
                  <span className="citation-pill">Page {cit.pageNumber}</span>
                )}
                {cit.sectionHeading && (
                  <span className="citation-pill">{cit.sectionHeading}</span>
                )}
                {cit.paragraphNumber !== undefined && (
                  <span className="citation-pill">Paragraph {cit.paragraphNumber}</span>
                )}
              </div>

              {/* [View source] action */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                <button
                  type="button"
                  onClick={() => onViewSource?.(cit)}
                  className="btn-ghost"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.75rem',
                    color: 'var(--gov-navy-900)',
                    fontWeight: 600,
                    padding: '0.25rem 0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--gov-navy-200)',
                    backgroundColor: 'var(--gov-white)',
                  }}
                >
                  <BookOpen size={13} aria-hidden="true" />
                  <span>View source</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
