import type { HTMLAttributes, ReactNode } from 'react';

type Tone = 'primary' | 'secondary' | 'muted' | 'positive' | 'negative' | 'warning' | 'accent';

const toneClass: Record<Tone, string> = {
  primary: 'text-primary',
  secondary: 'text-secondary',
  muted: 'text-muted',
  positive: 'text-positive',
  negative: 'text-negative',
  warning: 'text-warning',
  accent: 'text-accent',
};

interface TypographyProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  tone?: Tone;
}

export function DisplayValue({
  children,
  tone = 'primary',
  className = '',
  size = 'l',
  ...props
}: TypographyProps & { size?: 'xl' | 'l' }) {
  return (
    <span className={`type-display-${size} ${toneClass[tone]} ${className}`.trim()} {...props}>
      {children}
    </span>
  );
}

export function DataValue({ children, tone = 'primary', className = '', ...props }: TypographyProps) {
  return (
    <span className={`type-data ${toneClass[tone]} ${className}`.trim()} {...props}>
      {children}
    </span>
  );
}

export function MapName({ children, tone = 'primary', className = '', ...props }: TypographyProps) {
  return (
    <span className={`type-heading ${toneClass[tone]} ${className}`.trim()} {...props}>
      {children}
    </span>
  );
}

export function MetaLabel({ children, tone = 'secondary', className = '', ...props }: TypographyProps) {
  return (
    <span className={`type-label ${toneClass[tone]} ${className}`.trim()} {...props}>
      {children}
    </span>
  );
}

export function BodyText({ children, tone = 'primary', className = '', ...props }: TypographyProps) {
  return (
    <span className={`type-body ${toneClass[tone]} ${className}`.trim()} {...props}>
      {children}
    </span>
  );
}

export function Caption({ children, tone = 'secondary', className = '', ...props }: TypographyProps) {
  return (
    <span className={`type-caption ${toneClass[tone]} ${className}`.trim()} {...props}>
      {children}
    </span>
  );
}

export type { Tone };
