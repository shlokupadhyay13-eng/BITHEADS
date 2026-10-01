import React from 'react';
import { Link } from 'react-router-dom';
import {
  UploadCloud,
  FileSearch,
  HelpCircle,
  GitCompare,
  BookOpen,
} from 'lucide-react';

export interface QuickActionsProps {
  onUploadClick: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ onUploadClick }) => {
  const actions = [
    {
      id: 'qa-upload',
      label: 'Upload Document',
      description: 'Ingest statutory PDF / gazette',
      icon: UploadCloud,
      onClick: onUploadClick,
      color: 'var(--gov-navy-900)',
      bg: 'var(--gov-navy-50)',
      border: 'var(--gov-navy-200)',
    },
    {
      id: 'qa-analyze',
      label: 'Analyze Policy',
      description: 'Inspect clauses & evidence',
      icon: FileSearch,
      to: '/insights',
      color: '#15803d',
      bg: '#f0fdf4',
      border: '#bbf7d0',
    },
    {
      id: 'qa-ask',
      label: 'Ask a Question',
      description: 'Grounded query with citations',
      icon: HelpCircle,
      to: '/questions',
      color: '#0369a1',
      bg: '#f0f9ff',
      border: '#bae6fd',
    },
    {
      id: 'qa-compare',
      label: 'Compare Policies',
      description: 'Cross-statutory gap matrix',
      icon: GitCompare,
      to: '/compare',
      color: '#7c3aed',
      bg: '#f5f3ff',
      border: '#ddd6fe',
    },
    {
      id: 'qa-brief',
      label: 'Generate Brief',
      description: 'Official legislative memorandum',
      icon: BookOpen,
      to: '/research',
      color: '#b45309',
      bg: '#fffbeb',
      border: '#fde68a',
    },
  ];

  return (
    <div style={{ marginBottom: '2rem' }} data-testid="quick-actions-panel">
      <h2 style={{ fontSize: '1.25rem', color: 'var(--gov-navy-950)', marginBottom: '1rem' }}>
        Quick Actions
      </h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
        }}
      >
        {actions.map((act) => {
          const Icon = act.icon;
          const commonStyles: React.CSSProperties = {
            display: 'flex',
            alignItems: 'center',
            gap: '0.875rem',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--gov-white)',
            border: '1px solid var(--gov-slate-200)',
            textDecoration: 'none',
            color: 'inherit',
            transition: 'transform var(--transition-fast), border-color var(--transition-fast), box-shadow var(--transition-fast)',
            cursor: 'pointer',
            textAlign: 'left',
            boxShadow: 'var(--shadow-sm)',
            width: '100%',
          };

          const innerContent = (
            <>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: act.bg,
                  color: act.color,
                  border: `1px solid ${act.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
                aria-hidden="true"
              >
                <Icon size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--gov-navy-950)' }}>
                  {act.label}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--gov-slate-500)', marginTop: '0.15rem' }}>
                  {act.description}
                </div>
              </div>
            </>
          );

          if (act.to) {
            return (
              <Link
                key={act.id}
                id={act.id}
                to={act.to}
                style={commonStyles}
                className="quick-action-card"
              >
                {innerContent}
              </Link>
            );
          }

          return (
            <button
              key={act.id}
              id={act.id}
              type="button"
              onClick={act.onClick}
              style={{ ...commonStyles, font: 'inherit' }}
              className="quick-action-card"
            >
              {innerContent}
            </button>
          );
        })}
      </div>
    </div>
  );
};
