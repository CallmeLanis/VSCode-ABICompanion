import type { ReactNode } from 'react';
import { Badge } from './Badge';

type Status = 'EXTRACTED' | 'DIED' | 'FLED' | 'UNKNOWN';

interface StatusBadgeProps {
  status: Status;
  icon?: ReactNode;
  className?: string;
}

const variantByStatus = {
  EXTRACTED: 'success',
  DIED: 'danger',
  FLED: 'warning',
  UNKNOWN: 'warning',
} as const;

export function StatusBadge({ status, icon, className = '' }: StatusBadgeProps) {
  return (
    <Badge variant={variantByStatus[status]} className={className}>
      {icon}
      {status}
    </Badge>
  );
}

