import React from 'react';
import { AnimatedStatValue } from '../motion/CountUpValue';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  animated?: boolean;
  onClick?: () => void;
}

export function Card({
  children,
  className = '',
  hover = false,
  glow = false,
  animated = false,
  onClick,
}: CardProps) {
  const baseStyles = `
    bg-abi-bg-card border border-abi-border rounded-xl
    shadow-card transition-colors duration-200
  `;

  const hoverStyles = hover
    ? 'hover:border-abi-orange/45 cursor-pointer hover:bg-abi-bg-hover'
    : '';

  const glowStyles = glow ? 'shadow-glow-sm border-abi-orange/35' : '';

  const animatedStyles = animated ? 'animate-float' : '';

  return (
    <div
      className={`
        ${baseStyles}
        ${hoverStyles}
        ${glowStyles}
        ${animatedStyles}
        ${className}
      `.replace(/\s+/g, ' ').trim()}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  className?: string;
  onClick?: () => void;
  glow?: boolean;
  /** Count-up animation for numeric KPI values */
  animate?: boolean;
}

export function StatCard({
  label,
  value,
  subValue,
  icon,
  trend,
  trendValue,
  className = '',
  onClick,
  glow = false,
  animate = true,
}: StatCardProps) {
  const trendColors = {
    up: 'text-positive',
    down: 'text-negative',
    neutral: 'text-secondary',
  };

  return (
    <Card
      className={`p-4 relative overflow-hidden group ${className}`}
      hover={!!onClick}
      glow={glow}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="type-label text-secondary mb-[var(--space-label-value)]">
            {label}
          </p>
          <p className="type-display-l text-primary">
            {animate ? (
              <AnimatedStatValue
                value={value}
                toneClass={trend ? trendColors[trend] : undefined}
              />
            ) : (
              value
            )}
          </p>
          {subValue && (
            <p className="type-caption text-muted mt-[var(--space-value-meta)]">{subValue}</p>
          )}
          {trendValue && (
            <p className={`type-caption mt-[var(--space-value-meta)] ${trend ? trendColors[trend] : ''}`}>
              {trend === 'up' && '↑ '}
              {trend === 'down' && '↓ '}
              {trendValue}
            </p>
          )}
        </div>
        {icon && (
          <div className="text-abi-orange opacity-70 group-hover:opacity-100 transition-opacity shrink-0">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}

interface SectionCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export function SectionCard({
  title,
  children,
  className = '',
  action,
}: SectionCardProps) {
  return (
    <Card className={`p-0 ${className}`}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-abi-border">
        <h3 className="type-heading text-primary">
          {title}
        </h3>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </Card>
  );
}
