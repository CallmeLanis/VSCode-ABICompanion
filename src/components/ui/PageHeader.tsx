import React from 'react';
import { motion } from 'motion/react';
import { MOTION_DURATION, MOTION_EASE } from '../motion/motionTokens';
import { useReducedMotion } from '../motion/useReducedMotion';

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
}

export function PageHeader({ eyebrow, title, meta, actions }: PageHeaderProps) {
  const reduced = useReducedMotion();

  return (
    <header className="page-header">
      <div>
        <motion.p
          className="page-header__eyebrow type-label text-accent"
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: MOTION_DURATION.fast, ease: MOTION_EASE }}
        >
          {eyebrow}
        </motion.p>
        <motion.h1
          className="page-header__title"
          initial={reduced ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: MOTION_DURATION.base, ease: MOTION_EASE, delay: reduced ? 0 : 0.04 }}
        >
          {title}
        </motion.h1>
        {meta && (
          <motion.div
            className="page-header__meta type-caption text-secondary mt-[var(--space-value-meta)]"
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: MOTION_DURATION.base, ease: MOTION_EASE, delay: reduced ? 0 : 0.08 }}
          >
            {meta}
          </motion.div>
        )}
      </div>
      {actions && (
        <motion.div
          className="flex items-center gap-2 shrink-0"
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: MOTION_DURATION.base, ease: MOTION_EASE, delay: reduced ? 0 : 0.08 }}
        >
          {actions}
        </motion.div>
      )}
    </header>
  );
}
