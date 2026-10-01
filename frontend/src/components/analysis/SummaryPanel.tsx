import React from 'react';
import {
  FileText,
  AlertTriangle,
  Sparkles,
  CheckCircle,
  ListFilter,
} from 'lucide-react';
import type { Analysis, Finding } from '../../types';
import { MandateLevelBadge } from '../common/Badge';

export interface SummaryPanelProps {
  analysis: Analysis;
  onSelectEvidence?: (finding: Finding) => void;
}

export const SummaryPanel: React.FC<SummaryPanelProps> = ({
  analysis,
  onSelectEvidence,
}) => {
  const findings = analysis.findings || analysis.keyProvisions || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }} data-testid="summary-panel">
      {/* 1. Executive Summary with AI-generated tag */}
      {analysis.executiveSummary && (
        <section
          aria-labelledby="summary-exec-heading"
          className="card-ai"
          style={{
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-sm)',
          }}
          data-testid="executive-summary-section"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span className="card-ai-badge">
              <Sparkles size={12} aria-hidden="true" />
              AI-generated interpretation
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--gov-slate-500)', fontFamily: 'var(--font-mono)' }}>
              Verifiable against source text
            </span>
          </div>

          <h2
            id="summary-exec-heading"
            style={{ fontSize: '1.1875rem', color: 'var(--gov-navy-950)', marginTop: 0, marginBottom: '0.75rem' }}
          >
            Executive Statutory Synthesis
          </h2>

          <p
            style={{
              fontSize: '0.9375rem',
              color: 'var(--gov-slate-800)',
              lineHeight: 1.7,
              margin: 0,
            }}
          >
            {analysis.executiveSummary}
          </p>
        </section>
      )}

      {/* 2. Key Points / Takeaways (render ONLY if supplied) */}
      {analysis.keyPoints && analysis.keyPoints.length > 0 && (
        <section
          aria-labelledby="summary-keypoints-heading"
          className="card"
          style={{
            padding: '1.5rem',
            border: '1px solid var(--gov-slate-200)',
            borderRadius: 'var(--radius-md)',
          }}
          data-testid="key-points-section"
        >
          <h2
            id="summary-keypoints-heading"
            style={{ fontSize: '1.125rem', color: 'var(--gov-navy-950)', marginTop: 0, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <ListFilter size={18} style={{ color: 'var(--gov-navy-800)' }} aria-hidden="true" />
            Key Statutory Provisions & Takeaways
          </h2>

          <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {analysis.keyPoints.map((point, idx) => (
              <li key={`kp-${idx}-${point.slice(0, 15)}`} style={{ fontSize: '0.9375rem', color: 'var(--gov-slate-700)', lineHeight: 1.55 }}>
                {point}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 3. Core Statutory Findings Preview */}
      {findings.length > 0 && (
        <section aria-labelledby="summary-findings-heading">
          <h2
            id="summary-findings-heading"
            style={{ fontSize: '1.125rem', color: 'var(--gov-navy-950)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <FileText size={18} style={{ color: 'var(--gov-navy-800)' }} aria-hidden="true" />
            Extracted Policy Provisions ({findings.length})
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {findings.map((finding) => (
              <article
                key={finding.id}
                className="card"
                style={{
                  padding: '1.25rem',
                  border: '1px solid var(--gov-slate-200)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--gov-white)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '1rem', color: 'var(--gov-navy-950)', margin: 0, fontWeight: 700 }}>
                    {finding.title || finding.summary || 'Statutory Finding'}
                  </h3>
                  {finding.mandateLevel && <MandateLevelBadge level={finding.mandateLevel} />}
                </div>

                {finding.summary && finding.title && (
                  <p style={{ fontSize: '0.875rem', color: 'var(--gov-slate-600)', lineHeight: 1.5, margin: '0 0 0.75rem 0' }}>
                    {finding.summary}
                  </p>
                )}

                {/* Evidence citation count if present */}
                {(finding.citations || finding.evidence) && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--gov-slate-500)', paddingTop: '0.5rem', borderTop: '1px solid var(--gov-slate-100)' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                      <CheckCircle size={13} style={{ color: '#16a34a' }} aria-hidden="true" />
                      {(finding.citations || finding.evidence)?.length || 0} Grounded Evidence Excerpts
                    </span>
                    {onSelectEvidence && (
                      <button
                        type="button"
                        onClick={() => onSelectEvidence(finding)}
                        className="btn-ghost"
                        style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--gov-navy-900)', padding: '0.2rem 0.5rem' }}
                      >
                        Inspect Citations →
                      </button>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      {/* 4. Limitations & Cautionary Warnings (render ONLY if supplied) */}
      {analysis.limitations && analysis.limitations.length > 0 && (
        <section
          aria-labelledby="summary-limitations-heading"
          style={{
            padding: '1.25rem',
            backgroundColor: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: 'var(--radius-md)',
          }}
          data-testid="limitations-warnings-section"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#92400e' }}>
            <AlertTriangle size={18} aria-hidden="true" />
            <h2 id="summary-limitations-heading" style={{ fontSize: '1rem', margin: 0, fontWeight: 700 }}>
              Statutory Interpretive Limitations & OCR Caveats
            </h2>
          </div>

          <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {analysis.limitations.map((item, idx) => (
              <li key={`lim-${idx}-${item.slice(0, 15)}`} style={{ fontSize: '0.875rem', color: '#78350f', lineHeight: 1.5 }}>
                {item}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};
