import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { MOTION_DURATION, MOTION_EASE, MOTION_STAGGER } from './motionTokens';
import { useReducedMotion } from './useReducedMotion';

interface StaggerListProps {
  children: ReactNode;
  className?: string;
  cap?: number;
}

/** Stagger direct children — caps animation after N items for performance. */
export function StaggerList({
  children,
  className = '',
  cap = MOTION_STAGGER.listCap,
}: StaggerListProps) {
  const reduced = useReducedMotion();
  const items = Array.isArray(children) ? children : [children];

  return (
    <div className={className}>
      {items.map((child, index) => (
        <motion.div
          key={index}
          initial={reduced ? false : { opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{
            duration: reduced || index >= cap ? 0.01 : MOTION_DURATION.base,
            delay: reduced || index >= cap ? 0 : index * MOTION_STAGGER.row,
            ease: MOTION_EASE,
          }}
        >
          {child}
        </motion.div>
      ))}
    </div>
  );
}

interface AnimatedEmptyStateIconProps {
  children: ReactNode;
  className?: string;
}

/** Single pulse on empty-state icon, then stop. */
export function AnimatedEmptyStateIcon({ children, className = '' }: AnimatedEmptyStateIconProps) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduced ? false : { opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: reduced ? 0.01 : MOTION_DURATION.slow, ease: MOTION_EASE }}
    >
      {children}
    </motion.div>
  );
}
