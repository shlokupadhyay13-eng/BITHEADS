import React from 'react';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
  style?: React.CSSProperties;
  'aria-label'?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '1rem',
  borderRadius,
  className = '',
  style,
  'aria-label': ariaLabel = 'Loading content...',
}) => {
  return (
    <div
      role="status"
      aria-label={ariaLabel}
      className={`skeleton ${className}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius: borderRadius !== undefined ? (typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius) : undefined,
        ...style,
      }}
    >
      <span className="sr-only">{ariaLabel}</span>
    </div>
  );
};

export const SkeletonCard: React.FC<{ height?: number | string }> = ({ height = 120 }) => (
  <div className="card" style={{ padding: '1.25rem', height, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Skeleton width="45%" height="0.875rem" />
      <Skeleton width="32px" height="32px" borderRadius="var(--radius-sm)" />
    </div>
    <Skeleton width="60%" height="1.75rem" style={{ margin: '0.75rem 0' }} />
    <Skeleton width="80%" height="0.75rem" />
  </div>
);

export const SkeletonTableRow: React.FC<{ cols?: number }> = ({ cols = 6 }) => (
  <tr>
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i}>
        <Skeleton width={i === 0 ? '75%' : '50%'} height="1.125rem" />
      </td>
    ))}
  </tr>
);
