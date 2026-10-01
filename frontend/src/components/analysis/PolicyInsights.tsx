import React from 'react';
import {
  AlertTriangle,
  Users,
  Coins,
  Clock,
  CheckCircle,
  Lightbulb,
} from 'lucide-react';
import type { Analysis, Evidence } from '../../types';
import { StakeholderImpactBadge } from '../common/Badge';

export interface PolicyInsightsProps {
  analysis: Analysis;
  onSelectEvidence?: (evidence: Evidence) => void;
}

export const PolicyInsights: React.FC<PolicyInsightsProps> = ({
  analysis,
  onSelectEvidence,
}) => {
  const risks = analysis.insights || analysis.risksAndGaps || [];
  const stakeholders = analysis.stakeholderImpacts || [];
  const metrics = analysis.extractedMetrics || [];

  // Determine which categories actually exist in returned data
  const hasRisks = risks.length > 0;
  const hasStakeholders = stakeholders.length > 0;
  const hasFundingOrMetrics = metrics.length > 0;

  // Additional dynamic categories if backend supplies a categories record
  const dynamicCategories = (analysis as any).categories as Record<string, string | string[]> | undefined;
  const hasDynamicCategories = dynamicCategories && Object.keys(dynamicCategories).length > 0;

  if (!hasRisks && !hasStakeholders && !hasFundingOrMetrics && !hasDynamicCategories) {
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
        data-testid="no-insights-notice"
      >
        No specific regulatory insights or risk categories returned for this document.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }} data-testid="policy-insights-panel">
      {/* 1. Funding & Financial Metrics Category (ONLY rendered if returned) */}
      {hasFundingOrMetrics && (
        <section aria-labelledby="insights-funding-heading">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Coins size={20} style={{ color: '#b45309' }} aria-hidden="true" />
            <h2 id="insights-funding-heading" style={{ fontSize: '1.1875rem', color: 'var(--gov-navy-950)', margin: 0 }}>
              Funding, Budgetary Allocations & Program Targets
            </h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '1rem',
            }}
          >
            {metrics.map((metric, idx) => (
              <div
                key={metric.label || `metric-${idx}`}
                className="card"
                style={{
                  padding: '1.25rem',
                  border: '1px solid var(--gov-slate-200)',
                  backgroundColor: 'var(--gov-white)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div style={{ fontSize: '0.8125rem', color: 'var(--gov-slate-600)', fontWeight: 600, marginBottom: '0.35rem' }}>
                  {metric.label}
                </div>
                <div style={{ fontSize: '1.625rem', fontWeight: 700, color: 'var(--gov-navy-950)', marginBottom: '0.25rem' }}>
                  {metric.value} <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--gov-slate-500)' }}>{metric.unit}</span>
                </div>
                {metric.citations && metric.citations.length > 0 && onSelectEvidence && (
                  <button
                    type="button"
                    onClick={() => onSelectEvidence(metric.citations![0])}
                    className="btn-ghost"
                    style={{ fontSize: '0.75rem', padding: '0.2rem 0', color: 'var(--gov-navy-900)', fontWeight: 600 }}
                  >
                    View Statutory Source Citation →
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 2. Target Population & Stakeholder Obligations (ONLY rendered if returned) */}
      {hasStakeholders && (
        <section aria-labelledby="insights-stakeholder-heading">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Users size={20} style={{ color: 'var(--gov-navy-800)' }} aria-hidden="true" />
            <h2 id="insights-stakeholder-heading" style={{ fontSize: '1.1875rem', color: 'var(--gov-navy-950)', margin: 0 }}>
              Target Population & Stakeholder Obligations ({stakeholders.length})
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {stakeholders.map((stakeholder) => (
              <div
                key={stakeholder.id}
                className="card"
                style={{
                  padding: '1.25rem',
                  border: '1px solid var(--gov-slate-200)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--gov-white)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '1rem', color: 'var(--gov-navy-950)', margin: 0, fontWeight: 700 }}>
                    {stakeholder.groupName || 'Stakeholder Cohort'}
                  </h3>
                  {stakeholder.impactType && (
                    <StakeholderImpactBadge impactType={stakeholder.impactType} />
                  )}
                </div>

                <p style={{ fontSize: '0.9375rem', color: 'var(--gov-slate-700)', lineHeight: 1.55, margin: '0 0 0.5rem 0' }}>
                  {stakeholder.description}
                </p>

                {stakeholder.complianceDeadline && (
                  <div style={{ fontSize: '0.8125rem', color: 'var(--gov-slate-600)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Clock size={13} aria-hidden="true" />
                    <span>Statutory Deadline: <strong>{stakeholder.complianceDeadline}</strong></span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 3. Statutory Risks, Ambiguities & Enforcement Gaps (ONLY rendered if returned) */}
      {hasRisks && (
        <section aria-labelledby="insights-risks-heading">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <AlertTriangle size={20} style={{ color: '#dc2626' }} aria-hidden="true" />
            <h2 id="insights-risks-heading" style={{ fontSize: '1.1875rem', color: 'var(--gov-navy-950)', margin: 0 }}>
              Identified Regulatory Risks & Statutory Gaps ({risks.length})
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {risks.map((risk) => (
              <div
                key={risk.id}
                style={{
                  padding: '1.25rem',
                  backgroundColor: 'var(--gov-white)',
                  border: '1px solid var(--gov-slate-200)',
                  borderLeft: `4px solid ${
                    risk.severity === 'high' ? '#dc2626' : risk.severity === 'medium' ? '#d97706' : '#2563eb'
                  }`,
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      padding: '0.15rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor:
                        risk.severity === 'high'
                          ? 'var(--gov-error-bg)'
                          : risk.severity === 'medium'
                          ? 'var(--gov-warning-bg)'
                          : 'var(--gov-info-bg)',
                      color:
                        risk.severity === 'high'
                          ? 'var(--gov-error-text)'
                          : risk.severity === 'medium'
                          ? 'var(--gov-warning-text)'
                          : 'var(--gov-info-text)',
                      border: '1px solid transparent',
                    }}
                  >
                    Severity: {risk.severity || 'Medium'} • Category: {risk.category?.replace(/_/g, ' ') || 'Regulatory Ambiguity'}
                  </span>

                  {risk.citations && risk.citations.length > 0 && onSelectEvidence && (
                    <button
                      type="button"
                      onClick={() => onSelectEvidence(risk.citations![0])}
                      className="btn-ghost"
                      style={{ fontSize: '0.75rem', color: 'var(--gov-navy-900)', fontWeight: 600, padding: '0.2rem 0.4rem' }}
                    >
                      Inspect Source Grounding →
                    </button>
                  )}
                </div>

                <p style={{ fontSize: '0.9375rem', color: 'var(--gov-slate-800)', lineHeight: 1.6, margin: '0 0 0.75rem 0' }}>
                  {risk.description}
                </p>

                {risk.suggestedRemediation && (
                  <div
                    style={{
                      padding: '0.75rem 1rem',
                      backgroundColor: 'var(--gov-slate-50)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--gov-slate-200)',
                      fontSize: '0.8125rem',
                      color: 'var(--gov-slate-700)',
                    }}
                  >
                    <div style={{ fontWeight: 700, color: 'var(--gov-navy-950)', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Lightbulb size={14} style={{ color: '#d97706' }} aria-hidden="true" />
                      Suggested Remediation:
                    </div>
                    {risk.suggestedRemediation}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. Dynamic Categories (e.g. objectives, implementation, timelines, agencies, eligibility, scope, outcomes, changes) */}
      {hasDynamicCategories &&
        Object.entries(dynamicCategories).map(([categoryKey, content]) => {
          if (!content || (Array.isArray(content) && content.length === 0)) return null;

          return (
            <section key={categoryKey} aria-labelledby={`insights-${categoryKey}-heading`}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <CheckCircle size={18} style={{ color: 'var(--gov-navy-800)' }} aria-hidden="true" />
                <h2
                  id={`insights-${categoryKey}-heading`}
                  style={{ fontSize: '1.125rem', color: 'var(--gov-navy-950)', margin: 0, textTransform: 'capitalize' }}
                >
                  {categoryKey.replace(/_/g, ' ')}
                </h2>
              </div>

              <div
                className="card"
                style={{
                  padding: '1.25rem',
                  border: '1px solid var(--gov-slate-200)',
                  backgroundColor: 'var(--gov-white)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                {Array.isArray(content) ? (
                  <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {content.map((item, i) => (
                      <li key={i} style={{ fontSize: '0.9375rem', color: 'var(--gov-slate-800)', lineHeight: 1.55 }}>
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ fontSize: '0.9375rem', color: 'var(--gov-slate-800)', lineHeight: 1.6, margin: 0 }}>
                    {content}
                  </p>
                )}
              </div>
            </section>
          );
        })}
    </div>
  );
};
