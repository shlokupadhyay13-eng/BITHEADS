import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  loadingText,
  icon,
  disabled,
  className = '',
  type = 'button',
  ...props
}) => {
  const sizeClass = size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : '';

  return (
    <button
      type={type}
      className={`btn btn-${variant} ${sizeClass} ${className}`}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2
            size={16}
            className="animate-spin"
            aria-hidden="true"
            style={{ animation: 'spin 1s linear infinite' }}
          />
          <span>{loadingText || children}</span>
        </>
      ) : (
        <>
          {icon && <span aria-hidden="true" style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>}
          <span>{children}</span>
        </>
      )}
    </button>
  );
};
