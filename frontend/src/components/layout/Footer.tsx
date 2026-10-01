import React from 'react';
import { ShieldCheck, Info } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer
      role="contentinfo"
      style={{
        backgroundColor: 'var(--gov-slate-900)',
        color: 'var(--gov-slate-400)',
        borderTop: '1px solid var(--gov-slate-800)',
        padding: '2.5rem 0 2rem',
        marginTop: 'auto',
        fontSize: '0.875rem',
      }}
    >
      <div className="container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '2rem',
            marginBottom: '2rem',
          }}
        >
          <div>
            <h3 style={{ color: 'var(--gov-white)', fontSize: '1rem', marginBottom: '0.75rem' }}>
              PolicyIntelligence Architecture
            </h3>
            <p style={{ color: 'var(--gov-slate-400)', fontSize: '0.8125rem', lineHeight: '1.6' }}>
              Designed strictly for public policy researchers, legislative analysts, and legal compliance officers. Built upon verifiable source attribution principles where every AI-assisted finding maps to explicit statutory text excerpts and page numbers.
            </p>
          </div>

          <div>
            <h3 style={{ color: 'var(--gov-white)', fontSize: '1rem', marginBottom: '0.75rem' }}>
              Verification Standards
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8125rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={16} style={{ color: '#86efac' }} aria-hidden="true" />
                <span>Zero Hallucination Policy: No unbacked claims rendered</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Info size={16} style={{ color: '#7dd3fc' }} aria-hidden="true" />
                <span>Distinct Separation: AI Synthesis vs. Verifiable Source Text</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={16} style={{ color: '#86efac' }} aria-hidden="true" />
                <span>WCAG 2.2 Level AA Accessible Interface</span>
              </div>
            </div>
          </div>

          <div>
            <h3 style={{ color: 'var(--gov-white)', fontSize: '1rem', marginBottom: '0.75rem' }}>
              Statutory Disclaimer
            </h3>
            <p style={{ color: 'var(--gov-slate-400)', fontSize: '0.8125rem', lineHeight: '1.6' }}>
              This platform provides automated computational synthesis of uploaded public policy documents. For legal enforcement, legislative filing, or regulatory dispute resolution, researchers must verify claims against the official gazette of publication.
            </p>
          </div>
        </div>

        <div
          style={{
            borderTop: '1px solid var(--gov-slate-800)',
            paddingTop: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            fontSize: '0.75rem',
            color: 'var(--gov-slate-500)',
          }}
        >
          <div>
            © 2026 AI Research & Knowledge Discovery Hackathon • Government Policies & Reports Analyser
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <span>Frontend Tier (Person 2)</span>
            <span>•</span>
            <span>Express / AI Services (Person 3)</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
