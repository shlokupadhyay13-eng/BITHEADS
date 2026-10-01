import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from 'lucide-react';

interface AlertProps {
  variant?: 'info' | 'warning' | 'error' | 'success';
  title?: string;
  children: React.ReactNode;
  onDismiss?: () => void;
  className?: string;
  id?: string;
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  children,
  onDismiss,
  className = '',
  id,
}) => {
  const isErrorOrWarning = variant === 'error' || variant === 'warning';
  const role = isErrorOrWarning ? 'alert' : 'status';

  const getIcon = () => {
    switch (variant) {
      case 'error':
        return <AlertCircle size={20} aria-hidden="true" style={{ color: 'var(--gov-error-text)', flexShrink: 0 }} />;
      case 'warning':
        return <AlertTriangle size={20} aria-hidden="true" style={{ color: 'var(--gov-warning-text)', flexShrink: 0 }} />;
      case 'success':
        return <CheckCircle size={20} aria-hidden="true" style={{ color: 'var(--gov-success-text)', flexShrink: 0 }} />;
      case 'info':
      default:
        return <Info size={20} aria-hidden="true" style={{ color: 'var(--gov-info-text)', flexShrink: 0 }} />;
    }
  };

  return (
    <div
      id={id}
      role={role}
      aria-live={isErrorOrWarning ? 'assertive' : 'polite'}
      className={`alert alert-${variant} ${className}`}
    >
      {getIcon()}
      <div style={{ flex: 1 }}>
        {title && (
          <div style={{ fontWeight: 700, marginBottom: '0.25rem', color: 'inherit' }}>
            {title}
          </div>
        )}
        <div style={{ fontSize: '0.875rem' }}>{children}</div>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss alert"
          className="btn-ghost"
          style={{ padding: '0.2rem', margin: '-0.25rem -0.25rem 0 0', borderRadius: '4px' }}
        >
          <X size={16} aria-hidden="true" />
        </button>
      )}
    </div>
  );
};
