import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  size?: number;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Loading policy data...',
  size = 28,
  className = '',
}) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 1rem',
        gap: '0.75rem',
      }}
    >
      <Loader2
        size={size}
        style={{
          color: 'var(--gov-navy-800)',
          animation: 'spin 1s linear infinite',
        }}
        aria-hidden="true"
      />
      <span style={{ fontSize: '0.875rem', color: 'var(--gov-slate-600)', fontWeight: 500 }}>
        {message}
      </span>
      <span className="sr-only">{message}</span>
    </div>
  );
};
