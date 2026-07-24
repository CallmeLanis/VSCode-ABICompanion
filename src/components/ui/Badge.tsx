import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'orange';
  size?: 'sm' | 'md';
  className?: string;
}

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  className = '',
}: BadgeProps) {
  const variantStyles = {
    default: 'bg-abi-bg-hover text-secondary border-abi-border',
    success: 'bg-abi-success/15 text-positive border-abi-success/30',
    warning: 'bg-abi-warning/15 text-warning border-abi-warning/30',
    danger: 'bg-abi-danger/15 text-negative border-abi-danger/30',
    info: 'bg-abi-bg-hover text-secondary border-abi-border',
    orange: 'bg-abi-orange/15 text-accent border-abi-orange/35',
  };

  // Status geometry is intentionally invariant: variants only alter semantic color.
  const sizeStyles = {
    sm: 'h-6 px-2',
    md: 'h-6 px-2',
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1 rounded-sm border type-badge
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `.replace(/\s+/g, ' ').trim()}
    >
      {children}
    </span>
  );
}

interface TagProps {
  children: React.ReactNode;
  onRemove?: () => void;
  className?: string;
}

export function Tag({ children, onRemove, className = '' }: TagProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1 px-2 py-0.5 rounded-sm
        bg-abi-bg-hover text-abi-text-muted text-sm border border-abi-border
        ${className}
      `.replace(/\s+/g, ' ').trim()}
    >
      {children}
      {onRemove && (
        <button onClick={onRemove} className="hover:text-abi-orange transition-colors">
          ×
        </button>
      )}
    </span>
  );
}

interface ProgressBarProps {
  value: number;
  max?: number;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'orange' | 'info';
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ProgressBar({
  value,
  max = 100,
  variant = 'default',
  showLabel = false,
  size = 'md',
  className = '',
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100);

  const variantStyles = {
    default: 'bg-abi-text-muted',
    success: 'bg-abi-success',
    warning: 'bg-abi-warning',
    danger: 'bg-abi-danger',
    orange: 'bg-abi-orange',
    info: 'bg-abi-info',
  };

  const sizeStyles = {
    sm: 'h-1',
    md: 'h-1.5',
    lg: 'h-2.5',
  };

  return (
    <div className={`w-full ${className}`}>
      <div
        className={`
          w-full bg-abi-bg-hover overflow-hidden rounded-sm
          ${sizeStyles[size]}
        `.replace(/\s+/g, ' ').trim()}
      >
        <div
          className={`
            h-full transition-all duration-300
            ${variantStyles[variant]}
          `.replace(/\s+/g, ' ').trim()}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <p className="text-xs text-abi-text-muted mt-1 text-right font-mono tabular-nums">
          {percentage.toFixed(0)}%
        </p>
      )}
    </div>
  );
}

interface DividerProps {
  className?: string;
}

export function Divider({ className = '' }: DividerProps) {
  return <div className={`h-px bg-abi-border my-4 ${className}`} />;
}
