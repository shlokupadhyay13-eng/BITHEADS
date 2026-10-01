import React from 'react';
import { FileQuestion } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  id?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  icon,
  id,
}) => {
  return (
    <div
      id={id}
      style={{
        textAlign: 'center',
        padding: '3rem 1.5rem',
        background: 'var(--gov-white)',
        border: '1px dashed var(--gov-slate-300)',
        borderRadius: 'var(--radius-md)',
        margin: '1.5rem 0',
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          padding: '1rem',
          borderRadius: '50%',
          backgroundColor: 'var(--gov-slate-100)',
          color: 'var(--gov-slate-500)',
          marginBottom: '1rem',
        }}
      >
        {icon || <FileQuestion size={36} aria-hidden="true" />}
      </div>

      <h3 style={{ fontSize: '1.125rem', color: 'var(--gov-navy-950)', marginBottom: '0.5rem' }}>
        {title}
      </h3>

      <p
        style={{
          color: 'var(--gov-slate-600)',
          fontSize: '0.9375rem',
          maxWidth: '480px',
          margin: '0 auto 1.5rem',
        }}
      >
        {description}
      </p>

      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
