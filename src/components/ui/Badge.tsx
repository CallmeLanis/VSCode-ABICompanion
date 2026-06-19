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
    default: 'bg-abi-bg-hover text-abi-text-muted border-abi-border',
    success: 'bg-green-900/30 text-green-400 border-green-700/30',
    warning: 'bg-yellow-900/30 text-yellow-400 border-yellow-700/30',
    danger: 'bg-red-900/30 text-red-400 border-red-700/30',
    info: 'bg-blue-900/30 text-blue-400 border-blue-700/30',
    orange: 'bg-abi-orange/20 text-abi-orange border-abi-orange/30',
  };

  const sizeStyles = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-1 text-sm',
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1 rounded border font-medium
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

export function Tag({
  children,
  onRemove,
  className = '',
}: TagProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1 px-2 py-0.5 rounded
        bg-abi-bg-hover text-abi-text-muted text-sm
        ${className}
      `.replace(/\s+/g, ' ').trim()}
    >
      {children}
      {onRemove && (
        <button
          onClick={onRemove}
          className="hover:text-abi-orange transition-colors"
        >
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
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500',
    orange: 'bg-abi-orange',
    info: 'bg-blue-500',
  };

  const sizeStyles = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  return (
    <div className={`w-full ${className}`}>
      <div
        className={`
          w-full bg-abi-bg-hover rounded-full overflow-hidden
          ${sizeStyles[size]}
        `.replace(/\s+/g, ' ').trim()}
      >
        <div
          className={`
            h-full rounded-full transition-all duration-300
            ${variantStyles[variant]}
          `.replace(/\s+/g, ' ').trim()}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <p className="text-xs text-abi-text-muted mt-1 text-right">
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
  return (
    <div className={`h-px bg-abi-border my-4 ${className}`} />
  );
}
