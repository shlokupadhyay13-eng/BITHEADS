import React, { useState } from 'react';
import { BookOpen, Sparkles, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import type { Citation } from '../../types';
import { Modal } from './Modal';

interface EvidenceCardProps {
  claimTitle?: string;
  claimSummary: string;
  citations: Citation[];
  badgeLabel?: string;
  className?: string;
  id?: string;
}

export const EvidenceCard: React.FC<EvidenceCardProps> = ({
  claimTitle,
  claimSummary,
  citations,
  badgeLabel = 'AI Policy Finding',
  className = '',
  id,
}) => {
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);
  const [isEvidenceExpanded, setIsEvidenceExpanded] = useState<boolean>(true);

  return (
    <div id={id} className={`card ${className}`} style={{ marginBottom: '1.25rem' }}>
      {/* 1. AI Interpretation Surface */}
      <div className="card-ai">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span className="card-ai-badge">
            <Sparkles size={12} aria-hidden="true" />
            {badgeLabel}
          </span>
          {citations.length > 0 && (
            <span style={{ fontSize: '0.75rem', color: 'var(--gov-navy-700)', fontWeight: 600 }}>
              Backed by {citations.length} verified citation{citations.length > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {claimTitle && (
          <h3 style={{ fontSize: '1.05rem', color: 'var(--gov-navy-950)', marginBottom: '0.5rem' }}>
            {claimTitle}
          </h3>
        )}

        <p style={{ color: 'var(--gov-slate-800)', fontSize: '0.9375rem', lineHeight: '1.65', marginBottom: 0 }}>
          {claimSummary}
        </p>
      </div>

      {/* 2. Source Evidence Section (Collapsible with visible evidence pill) */}
      {citations.length > 0 ? (
        <div style={{ marginTop: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--gov-slate-700)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Source Evidence & Direct Excerpts
            </span>
            <button
              type="button"
              onClick={() => setIsEvidenceExpanded(!isEvidenceExpanded)}
              aria-expanded={isEvidenceExpanded}
              aria-controls={`evidence-list-${id || 'card'}`}
              className="btn-ghost btn-sm"
              style={{ fontSize: '0.75rem', gap: '0.25rem', padding: '0.15rem 0.4rem' }}
            >
              <span>{isEvidenceExpanded ? 'Hide citations' : 'Show citations'}</span>
              {isEvidenceExpanded ? <ChevronUp size={14} aria-hidden="true" /> : <ChevronDown size={14} aria-hidden="true" />}
            </button>
          </div>

          {isEvidenceExpanded && (
            <div id={`evidence-list-${id || 'card'}`}>
              {citations.map((citation) => (
                <div key={citation.id} className="card-evidence">
                  <blockquote className="evidence-quote">
                    “{citation.excerptQuote}”
                  </blockquote>

                  <div className="evidence-citation-bar">
                    <span className="citation-pill">
                      <BookOpen size={11} aria-hidden="true" />
                      Page {citation.pageNumber}
                    </span>

                    {citation.sectionHeading && (
                      <span style={{ fontWeight: 600, color: 'var(--gov-slate-800)' }}>
                        {citation.sectionHeading}
                      </span>
                    )}

                    {citation.paragraphNumber !== undefined && (
                      <span>Para {citation.paragraphNumber}</span>
                    )}

                    {citation.confidenceScore !== undefined && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--gov-slate-500)', marginLeft: 'auto' }}>
                        Match confidence: {Math.round(citation.confidenceScore * 100)}%
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => setSelectedCitation(citation)}
                      className="btn-ghost btn-sm"
                      style={{ fontSize: '0.75rem', padding: '0.1rem 0.4rem', textDecoration: 'underline' }}
                    >
                      Inspect Source <ExternalLink size={11} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div style={{ marginTop: '0.5rem', padding: '0.5rem', fontSize: '0.8125rem', color: 'var(--gov-slate-500)', fontStyle: 'italic' }}>
          Note: No primary citations were extracted for this finding.
        </div>
      )}

      {/* Citation Inspection Modal */}
      {selectedCitation && (
        <Modal
          isOpen={!!selectedCitation}
          onClose={() => setSelectedCitation(null)}
          title={`Source Evidence Citation - Page ${selectedCitation.pageNumber}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--gov-slate-500)', fontWeight: 700 }}>
                Document Reference
              </div>
              <div style={{ fontWeight: 600, color: 'var(--gov-navy-950)', fontSize: '0.9375rem' }}>
                {selectedCitation.documentTitle}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--gov-slate-500)' }}>Page:</span>{' '}
                <strong>{selectedCitation.pageNumber}</strong>
              </div>
              {selectedCitation.sectionHeading && (
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--gov-slate-500)' }}>Section:</span>{' '}
                  <strong>{selectedCitation.sectionHeading}</strong>
                </div>
              )}
              {selectedCitation.paragraphNumber && (
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--gov-slate-500)' }}>Paragraph:</span>{' '}
                  <strong>{selectedCitation.paragraphNumber}</strong>
                </div>
              )}
            </div>

            <div className="card-evidence" style={{ margin: 0 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gov-slate-600)', marginBottom: '0.5rem' }}>
                Exact Policy Excerpt:
              </div>
              <div className="evidence-quote">
                “{selectedCitation.excerptQuote}”
              </div>
            </div>

            <p style={{ fontSize: '0.8125rem', color: 'var(--gov-slate-500)', margin: 0 }}>
              This evidence was extracted directly from the verified government text stream.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
};
