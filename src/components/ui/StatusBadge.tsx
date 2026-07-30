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
  UNKNOWN: 'warning',
} as const;

export function StatusBadge({ status, icon, className = '' }: StatusBadgeProps) {
  const displayStatus = status === 'FLED' ? 'DIED' : status;

  return (
    <Badge variant={variantByStatus[displayStatus]} className={className}>
      {status === 'FLED' ? '✗' : icon}
      {displayStatus}
    </Badge>
  );
}

