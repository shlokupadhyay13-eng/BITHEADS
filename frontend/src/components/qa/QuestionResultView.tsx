import React, { useState } from 'react';
import { Sparkles, ShieldCheck, BookOpen, ExternalLink } from 'lucide-react';
import type { QuestionResponse, Evidence } from '../../types';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';

interface QuestionResultViewProps {
  result: QuestionResponse;
}

export const QuestionResultView: React.FC<QuestionResultViewProps> = ({ result }) => {
  const [activeEvidenceModal, setActiveEvidenceModal] = useState<Evidence | null>(null);

  const evidenceList = result.evidence || [];

  // Group evidence into unique sources if source info exists
  const sources = React.useMemo(() => {
    const list: {
      documentTitle?: string;
      pageNumber?: number;
      sectionHeading?: string;
      evidence: Evidence;
    }[] = [];

    const evList = result.evidence || [];
    evList.forEach((ev) => {
      list.push({
        documentTitle: ev.documentTitle || ev.source?.title || 'Policy Record',
        pageNumber: ev.pageNumber || ev.source?.pageNumber,
        sectionHeading: ev.sectionHeading || ev.source?.section,
        evidence: ev,
      });
    });

    return list;
  }, [result.evidence]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} data-testid="qa-result-container">
      {/* 1. Answer (Executive Synthesis) */}
      <section className="card-ai">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span className="card-ai-badge">
            <Sparkles size={12} aria-hidden="true" />
            AI-generated interpretation
          </span>
          {result.generatedAt && (
            <span style={{ fontSize: '0.75rem', color: 'var(--gov-slate-500)' }}>
              Synthesized: {new Date(result.generatedAt).toLocaleDateString()}
            </span>
          )}
        </div>

        <h2 style={{ fontSize: '1.1875rem', color: 'var(--gov-navy-950)', margin: '0 0 0.75rem 0' }}>
          Analytical Answer
        </h2>

        <p style={{ fontSize: '0.9375rem', color: 'var(--gov-slate-900)', lineHeight: 1.7, margin: 0 }}>
          {result.answer}
        </p>
      </section>

      {/* 2. Evidence (Source Passages) */}
      {evidenceList.length > 0 && (
        <section aria-labelledby="evidence-passages-heading">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <ShieldCheck size={20} style={{ color: 'var(--gov-navy-900)' }} aria-hidden="true" />
            <h3 id="evidence-passages-heading" style={{ fontSize: '1.125rem', color: 'var(--gov-navy-950)', margin: 0 }}>
              Grounded Evidence Passages ({evidenceList.length})
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {evidenceList.map((ev, idx) => (
              <div
                key={ev.id || idx}
                className="card"
                style={{
                  padding: '1.25rem',
                  borderLeft: '4px solid var(--gov-navy-800)',
                  backgroundColor: 'var(--gov-white)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      padding: '0.2rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: '#eff6ff',
                      color: '#1d4ed8',
                      border: '1px solid #bfdbfe',
                    }}
                  >
                    <ShieldCheck size={11} aria-hidden="true" />
                    Source evidence
                  </span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {ev.pageNumber != null && (
                      <span className="citation-pill" style={{ fontSize: '0.75rem' }}>
                        <BookOpen size={11} aria-hidden="true" />
                        Page {ev.pageNumber}
                      </span>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveEvidenceModal(ev)}
                      icon={<ExternalLink size={12} aria-hidden="true" />}
                    >
                      View source
                    </Button>
                  </div>
                </div>

                {/* Quoted passage */}
                <blockquote
                  style={{
                    margin: '0.5rem 0',
                    paddingLeft: '0.75rem',
                    borderLeft: '2px solid var(--gov-slate-300)',
                    fontStyle: 'italic',
                    color: 'var(--gov-slate-800)',
                    fontSize: '0.875rem',
                    lineHeight: 1.6,
                  }}
                >
                  “{ev.excerptQuote}”
                </blockquote>

                {/* Section / Document attribution */}
                <div style={{ fontSize: '0.75rem', color: 'var(--gov-slate-500)', marginTop: '0.5rem' }}>
                  {ev.documentTitle && <strong>{ev.documentTitle}</strong>}
                  {ev.sectionHeading && <span> • {ev.sectionHeading}</span>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 3. Sources */}
      {sources.length > 0 && (
        <section aria-labelledby="sources-heading">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <BookOpen size={20} style={{ color: 'var(--gov-navy-900)' }} aria-hidden="true" />
            <h3 id="sources-heading" style={{ fontSize: '1.125rem', color: 'var(--gov-navy-950)', margin: 0 }}>
              Statutory Sources
            </h3>
          </div>

          <div
            className="card"
            style={{
              padding: '1rem',
              backgroundColor: 'var(--gov-slate-50)',
            }}
          >
            <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.875rem', color: 'var(--gov-slate-800)' }}>
              {sources.map((src, i) => (
                <li key={i} style={{ marginBottom: '0.35rem', lineHeight: 1.5 }}>
                  <strong>{src.documentTitle}</strong>
                  {src.sectionHeading && <span> — {src.sectionHeading}</span>}
                  {src.pageNumber != null && <span> (Page {src.pageNumber})</span>}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* View Source Modal */}
      {activeEvidenceModal && (
        <Modal
          isOpen={true}
          onClose={() => setActiveEvidenceModal(null)}
          title="Verifiable Statutory Evidence Source"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div
              style={{
                padding: '0.75rem',
                backgroundColor: 'var(--gov-slate-100)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8125rem',
                color: 'var(--gov-slate-700)',
              }}
            >
              <div>
                <strong>Document:</strong> {activeEvidenceModal.documentTitle || 'Official Record'}
              </div>
              {activeEvidenceModal.pageNumber != null && (
                <div>
                  <strong>Physical Page:</strong> {activeEvidenceModal.pageNumber}
                </div>
              )}
              {activeEvidenceModal.sectionHeading && (
                <div>
                  <strong>Statutory Heading:</strong> {activeEvidenceModal.sectionHeading}
                </div>
              )}
            </div>

            <div>
              <span
                style={{
                  display: 'inline-block',
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: '#1d4ed8',
                  marginBottom: '0.25rem',
                }}
              >
                Exact Source Excerpt
              </span>
              <div
                style={{
                  padding: '1rem',
                  border: '1px solid var(--gov-slate-300)',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--gov-white)',
                  fontFamily: 'serif',
                  fontSize: '0.9375rem',
                  lineHeight: 1.7,
                  color: 'var(--gov-navy-950)',
                }}
              >
                “{activeEvidenceModal.excerptQuote}”
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <Button type="button" variant="secondary" onClick={() => setActiveEvidenceModal(null)}>
                Close Evidence Viewer
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
