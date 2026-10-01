import React from 'react';
import { Sparkles, CheckCircle2, AlertOctagon, BookOpen } from 'lucide-react';
import type { Comparison, Document } from '../../types';

interface ComparisonResultsViewProps {
  comparison: Comparison;
  docA?: Document;
  docB?: Document;
}

export const ComparisonResultsView: React.FC<ComparisonResultsViewProps> = ({
  comparison,
  docA,
  docB,
}) => {
  const rows = comparison.comparisonMatrix || comparison.matrix || [];
  const similarities = comparison.similarities || [];
  const differences = comparison.differences || [];

  const docATitle = docA?.title || rows[0]?.findings[0]?.documentTitle || 'Document A';
  const docBTitle = docB?.title || rows[0]?.findings[1]?.documentTitle || 'Document B';
  const docAId = docA?.id || rows[0]?.findings[0]?.documentId || '';
  const docBId = docB?.id || rows[0]?.findings[1]?.documentId || '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }} data-testid="comparison-results-container">
      {/* 1. Executive Synthesis */}
      {comparison.synthesizedAnswer && (
        <section className="card-ai">
          <span className="card-ai-badge">
            <Sparkles size={12} aria-hidden="true" />
            AI-generated interpretation
          </span>
          <h2 style={{ fontSize: '1.25rem', color: 'var(--gov-navy-950)', margin: '0 0 0.5rem 0' }}>
            Cross-Policy Comparative Synthesis
          </h2>
          <p style={{ fontSize: '0.9375rem', color: 'var(--gov-slate-900)', lineHeight: 1.7, margin: 0 }}>
            {comparison.synthesizedAnswer}
          </p>
        </section>
      )}

      {/* 2. Similarities & Differences Grids (Only rendered when present from the API) */}
      {(similarities.length > 0 || differences.length > 0) && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {/* Similarities */}
          {similarities.length > 0 && (
            <section
              className="card"
              style={{
                padding: '1.5rem',
                borderTop: '4px solid #16a34a',
                backgroundColor: 'var(--gov-white)',
              }}
              data-testid="comparison-similarities"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <CheckCircle2 size={18} style={{ color: '#16a34a' }} aria-hidden="true" />
                <h3 style={{ fontSize: '1.0625rem', color: 'var(--gov-navy-950)', margin: 0 }}>
                  Statutory Similarities
                </h3>
              </div>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--gov-slate-800)' }}>
                {similarities.map((item, idx) => (
                  <li key={`sim-${idx}-${item.slice(0, 15)}`} style={{ marginBottom: '0.5rem' }}>
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Differences */}
          {differences.length > 0 && (
            <section
              className="card"
              style={{
                padding: '1.5rem',
                borderTop: '4px solid #d97706',
                backgroundColor: 'var(--gov-white)',
              }}
              data-testid="comparison-differences"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <AlertOctagon size={18} style={{ color: '#d97706' }} aria-hidden="true" />
                <h3 style={{ fontSize: '1.0625rem', color: 'var(--gov-navy-950)', margin: 0 }}>
                  Statutory Differences
                </h3>
              </div>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--gov-slate-800)' }}>
                {differences.map((item, idx) => (
                  <li key={`diff-${idx}-${item.slice(0, 15)}`} style={{ marginBottom: '0.5rem' }}>
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      {/* 3. Per-Criterion Table (Desktop) / Stacked Layout (Mobile) */}
      <section aria-labelledby="per-criterion-heading">
        <h2 id="per-criterion-heading" style={{ fontSize: '1.25rem', color: 'var(--gov-navy-950)', marginBottom: '1rem' }}>
          Per-Criterion Comparative Matrix
        </h2>

        {/* Desktop View: Accessible Table with Proper Headers */}
        <div className="comparison-desktop-table table-container">
          <table className="gov-table" aria-label="Per-Criterion Policy Comparison Matrix">
            <caption className="sr-only">
              Direct comparison between {docATitle} and {docBTitle} across evaluated criteria.
            </caption>
            <thead>
              <tr>
                <th scope="col" style={{ width: '22%' }}>
                  Statutory Criterion
                </th>
                <th scope="col" style={{ width: '39%' }}>
                  {docATitle}
                </th>
                <th scope="col" style={{ width: '39%' }}>
                  {docBTitle}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => {
                const findingA =
                  row.findings.find((f) => f.documentId === docAId) || row.findings[0];
                const findingB =
                  row.findings.find((f) => f.documentId === docBId) || (row.findings.length > 1 ? row.findings[1] : undefined);

                return (
                  <tr key={row.criterionId || idx}>
                    <th scope="row" style={{ fontWeight: 700, color: 'var(--gov-navy-950)', background: 'var(--gov-slate-50)' }}>
                      {row.comparisonTopic}
                    </th>
                    <td>
                      {findingA?.findingSummary ? (
                        <div>
                          <div style={{ lineHeight: 1.5, marginBottom: '0.35rem' }}>
                            {findingA.findingSummary}
                          </div>
                          {findingA.citations?.map((cit) => (
                            <div key={cit.id} className="card-evidence" style={{ padding: '0.4rem 0.6rem', marginTop: '0.35rem' }}>
                              <span style={{ fontSize: '0.75rem', fontStyle: 'italic', display: 'block', marginBottom: '0.2rem' }}>
                                “{cit.excerptQuote}”
                              </span>
                              {cit.pageNumber != null && (
                                <span className="citation-pill" style={{ fontSize: '0.6875rem' }}>
                                  <BookOpen size={10} aria-hidden="true" />
                                  Page {cit.pageNumber}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--gov-slate-400)', fontStyle: 'italic', fontSize: '0.875rem' }}>
                          Not specified in document
                        </span>
                      )}
                    </td>
                    <td>
                      {findingB?.findingSummary ? (
                        <div>
                          <div style={{ lineHeight: 1.5, marginBottom: '0.35rem' }}>
                            {findingB.findingSummary}
                          </div>
                          {findingB.citations?.map((cit) => (
                            <div key={cit.id} className="card-evidence" style={{ padding: '0.4rem 0.6rem', marginTop: '0.35rem' }}>
                              <span style={{ fontSize: '0.75rem', fontStyle: 'italic', display: 'block', marginBottom: '0.2rem' }}>
                                “{cit.excerptQuote}”
                              </span>
                              {cit.pageNumber != null && (
                                <span className="citation-pill" style={{ fontSize: '0.6875rem' }}>
                                  <BookOpen size={10} aria-hidden="true" />
                                  Page {cit.pageNumber}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--gov-slate-400)', fontStyle: 'italic', fontSize: '0.875rem' }}>
                          Not specified in document
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile View: Stacked Layout */}
        <div className="comparison-mobile-stacked">
          {rows.map((row, idx) => {
            const findingA =
              row.findings.find((f) => f.documentId === docAId) || row.findings[0];
            const findingB =
              row.findings.find((f) => f.documentId === docBId) || (row.findings.length > 1 ? row.findings[1] : undefined);

            return (
              <div
                key={row.criterionId || idx}
                className="card"
                style={{
                  padding: '1.25rem',
                  marginBottom: '1rem',
                  border: '1px solid var(--gov-slate-300)',
                }}
              >
                <div
                  style={{
                    fontWeight: 800,
                    fontSize: '1rem',
                    color: 'var(--gov-navy-950)',
                    borderBottom: '2px solid var(--gov-navy-900)',
                    paddingBottom: '0.5rem',
                    marginBottom: '1rem',
                  }}
                >
                  {row.comparisonTopic}
                </div>

                {/* Sub-card Document A */}
                <div style={{ marginBottom: '1rem' }}>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: 'var(--gov-navy-800)',
                      marginBottom: '0.25rem',
                    }}
                  >
                    {docATitle}:
                  </div>
                  {findingA?.findingSummary ? (
                    <div style={{ fontSize: '0.875rem', lineHeight: 1.5, color: 'var(--gov-slate-800)' }}>
                      {findingA.findingSummary}
                      {findingA.citations?.map((c) => (
                        <div key={c.id} className="card-evidence" style={{ padding: '0.35rem 0.5rem', marginTop: '0.35rem' }}>
                          <div style={{ fontSize: '0.75rem', fontStyle: 'italic' }}>“{c.excerptQuote}”</div>
                          {c.pageNumber != null && (
                            <span className="citation-pill" style={{ fontSize: '0.625rem', marginTop: '0.2rem' }}>
                              Page {c.pageNumber}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span style={{ color: 'var(--gov-slate-400)', fontStyle: 'italic', fontSize: '0.8125rem' }}>
                      Not specified in document
                    </span>
                  )}
                </div>

                {/* Sub-card Document B */}
                <div>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: 'var(--gov-navy-800)',
                      marginBottom: '0.25rem',
                    }}
                  >
                    {docBTitle}:
                  </div>
                  {findingB?.findingSummary ? (
                    <div style={{ fontSize: '0.875rem', lineHeight: 1.5, color: 'var(--gov-slate-800)' }}>
                      {findingB.findingSummary}
                      {findingB.citations?.map((c) => (
                        <div key={c.id} className="card-evidence" style={{ padding: '0.35rem 0.5rem', marginTop: '0.35rem' }}>
                          <div style={{ fontSize: '0.75rem', fontStyle: 'italic' }}>“{c.excerptQuote}”</div>
                          {c.pageNumber != null && (
                            <span className="citation-pill" style={{ fontSize: '0.625rem', marginTop: '0.2rem' }}>
                              Page {c.pageNumber}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span style={{ color: 'var(--gov-slate-400)', fontStyle: 'italic', fontSize: '0.8125rem' }}>
                      Not specified in document
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
