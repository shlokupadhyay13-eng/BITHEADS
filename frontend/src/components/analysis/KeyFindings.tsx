import React from 'react';
import {
  ShieldAlert,
  Calendar,
  Building2,
} from 'lucide-react';
import type { Finding, Evidence } from '../../types';
import { MandateLevelBadge } from '../common/Badge';

export interface KeyFindingsProps {
  findings: Finding[];
  onSelectEvidence?: (evidence: Evidence) => void;
  selectedEvidenceId?: string | null;
}

export const KeyFindings: React.FC<KeyFindingsProps> = ({
  findings,
  onSelectEvidence,
  selectedEvidenceId,
}) => {
  if (findings.length === 0) {
    return (
      <div
        style={{
          padding: '2.5rem 1.5rem',
          textAlign: 'center',
          backgroundColor: 'var(--gov-slate-50)',
          borderRadius: 'var(--radius-md)',
          border: '1px dashed var(--gov-slate-300)',
          color: 'var(--gov-slate-600)',
        }}
        data-testid="no-findings-notice"
      >
        No specific key provisions were synthesized for this policy document.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} data-testid="key-findings-list">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', color: 'var(--gov-navy-950)', margin: 0 }}>
          Statutory Provisions & Mandates ({findings.length})
        </h2>
        <span style={{ fontSize: '0.8125rem', color: 'var(--gov-slate-500)' }}>
          Directly grounded in legislative source text
        </span>
      </div>

      {findings.map((finding) => {
        const citations = finding.citations || finding.evidence || [];

        return (
          <article
            key={finding.id}
            className="card"
            style={{
              padding: '1.5rem',
              border: '1px solid var(--gov-slate-200)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--gov-white)',
              boxShadow: 'var(--shadow-sm)',
            }}
            data-testid={`finding-card-${finding.id}`}
          >
            {/* Finding Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '0.75rem',
                flexWrap: 'wrap',
                marginBottom: '0.75rem',
              }}
            >
              <h3
                style={{
                  fontSize: '1.0625rem',
                  color: 'var(--gov-navy-950)',
                  margin: 0,
                  lineHeight: 1.4,
                  fontWeight: 700,
                  flex: '1 1 280px',
                }}
              >
                {finding.title || finding.summary || 'Statutory Provision'}
              </h3>

              {finding.mandateLevel && (
                <MandateLevelBadge level={finding.mandateLevel} />
              )}
            </div>

            {/* Summary / Clause interpretation */}
            {finding.summary && finding.title && (
              <div style={{ marginBottom: '1rem' }}>
                <span className="card-ai-badge" style={{ marginBottom: '0.4rem', fontSize: '0.6875rem' }}>
                  AI-generated interpretation
                </span>
                <p style={{ fontSize: '0.9375rem', color: 'var(--gov-slate-800)', lineHeight: 1.6, margin: 0 }}>
                  {finding.summary}
                </p>
              </div>
            )}

            {/* Statutory Metadata Strip */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.75rem 1.25rem',
                fontSize: '0.8125rem',
                color: 'var(--gov-slate-600)',
                padding: '0.75rem 0',
                borderTop: '1px solid var(--gov-slate-100)',
                borderBottom: citations.length > 0 ? '1px solid var(--gov-slate-100)' : 'none',
                marginBottom: citations.length > 0 ? '1rem' : 0,
              }}
            >
              {finding.effectiveDate && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Calendar size={13} style={{ color: 'var(--gov-slate-500)' }} aria-hidden="true" />
                  <span>Effective Date: <strong>{finding.effectiveDate}</strong></span>
                </div>
              )}

              {finding.enforcingAgency && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Building2 size={13} style={{ color: 'var(--gov-slate-500)' }} aria-hidden="true" />
                  <span>Enforcing Agency: <strong>{finding.enforcingAgency}</strong></span>
                </div>
              )}
            </div>

            {/* Penalties or Consequences if supplied */}
            {finding.penaltiesOrConsequences && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  backgroundColor: 'var(--gov-error-bg)',
                  border: '1px solid var(--gov-error-border)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8125rem',
                  color: 'var(--gov-error-text)',
                  marginBottom: '1rem',
                  lineHeight: 1.45,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, marginBottom: '0.2rem' }}>
                  <ShieldAlert size={14} aria-hidden="true" />
                  <span>Statutory Penalties & Enforcement Consequences</span>
                </div>
                <div>{finding.penaltiesOrConsequences}</div>
              </div>
            )}

            {/* Verifiable Citations (Source Evidence) */}
            {citations.length > 0 && (
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--gov-slate-500)', marginBottom: '0.5rem' }}>
                  Direct Statutory Quotations ({citations.length})
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {citations.map((cit) => {
                    const isSelected = selectedEvidenceId === cit.id;

                    return (
                      <div
                        key={cit.id}
                        className="card-evidence"
                        style={{
                          margin: 0,
                          outline: isSelected ? '2px solid var(--gov-navy-800)' : 'none',
                          transition: 'outline var(--transition-fast)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <span
                            style={{
                              fontSize: '0.6875rem',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              padding: '0.1rem 0.4rem',
                              borderRadius: 'var(--radius-sm)',
                              backgroundColor: 'var(--gov-evidence-badge-bg)',
                              color: 'var(--gov-evidence-badge-text)',
                              border: '1px solid var(--gov-evidence-badge-border)',
                            }}
                          >
                            Source evidence
                          </span>

                          {cit.confidenceScore !== undefined && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--gov-slate-500)', fontFamily: 'var(--font-mono)' }}>
                              Confidence: {(cit.confidenceScore * 100).toFixed(0)}%
                            </span>
                          )}
                        </div>

                        <blockquote className="evidence-quote" style={{ margin: '0 0 0.5rem 0' }}>
                          "{cit.excerptQuote}"
                        </blockquote>

                        <div className="evidence-citation-bar">
                          {cit.documentTitle && (
                            <span className="citation-pill">Doc: {cit.documentTitle}</span>
                          )}
                          {cit.pageNumber && (
                            <span className="citation-pill">Page {cit.pageNumber}</span>
                          )}
                          {cit.sectionHeading && (
                            <span className="citation-pill">{cit.sectionHeading}</span>
                          )}
                          {cit.paragraphNumber && (
                            <span className="citation-pill">Para {cit.paragraphNumber}</span>
                          )}

                          {onSelectEvidence && (
                            <button
                              type="button"
                              onClick={() => onSelectEvidence(cit)}
                              className="btn-ghost"
                              style={{
                                marginLeft: 'auto',
                                fontSize: '0.75rem',
                                color: 'var(--gov-navy-900)',
                                fontWeight: 600,
                                padding: '0.2rem 0.4rem',
                              }}
                            >
                              Pin to Evidence Panel →
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
};
