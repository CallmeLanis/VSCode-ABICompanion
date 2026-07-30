import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { MOTION_DURATION, MOTION_EASE } from './motionTokens';
import { useReducedMotion } from './useReducedMotion';

interface PageTransitionProps {
  pageKey: string;
  children: ReactNode;
  className?: string;
}

export function PageTransition({ pageKey, children, className = '' }: PageTransitionProps) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      key={pageKey}
      className={className}
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduced ? 0.01 : MOTION_DURATION.base,
        ease: MOTION_EASE,
      }}
    >
      {children}
    </motion.div>
  );
}
