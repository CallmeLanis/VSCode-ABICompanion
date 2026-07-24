import React from 'react';

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
}

export function PageHeader({ eyebrow, title, meta, actions }: PageHeaderProps) {
  return (
    <header className="page-header">
      <div>
        <p className="page-header__eyebrow type-label text-accent">{eyebrow}</p>
        <h1 className="page-header__title">{title}</h1>
        {meta && <div className="page-header__meta type-caption text-secondary mt-[var(--space-value-meta)]">{meta}</div>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </header>
  );
}
