import React from 'react';

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
    transition-all duration-200
  `;

  const hoverStyles = hover
    ? 'hover:border-abi-orange/50 hover:shadow-glow-sm cursor-pointer hover:-translate-y-1'
    : '';

  const glowStyles = glow
    ? 'shadow-glow border-abi-orange/30'
    : '';

  const animatedStyles = animated
    ? 'animate-float'
    : '';

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
}: StatCardProps) {
  const trendColors = {
    up: 'text-green-400',
    down: 'text-red-400',
    neutral: 'text-abi-text-muted',
  };

  return (
    <Card
      className={`p-4 relative overflow-hidden group ${className}`}
      hover={!!onClick}
      glow={glow}
      onClick={onClick}
    >
      {/* Scanline accent on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute w-full h-1 bg-gradient-to-b from-abi-orange/20 to-transparent animate-scan-line" />
        </div>
      </div>

      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-abi-text-muted text-xs uppercase tracking-wider mb-1">
            {label}
          </p>
          <p className="text-2xl font-bold text-abi-text">
            {value}
          </p>
          {subValue && (
            <p className="text-sm text-abi-text-dim mt-1">
              {subValue}
            </p>
          )}
          {trendValue && (
            <p className={`text-xs mt-1 ${trend ? trendColors[trend] : ''}`}>
              {trend === 'up' && '↑'}
              {trend === 'down' && '↓'}
              {trendValue}
            </p>
          )}
        </div>
        {icon && (
          <div className="text-abi-orange opacity-60 group-hover:opacity-100 transition-opacity">
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
        <h3 className="text-lg font-semibold text-abi-text">{title}</h3>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </Card>
  );
}
