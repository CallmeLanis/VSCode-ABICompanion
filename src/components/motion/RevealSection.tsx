import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import {
  MOTION_DURATION,
  MOTION_EASE,
  MOTION_OFFSET,
  MOTION_STAGGER,
  revealViewport,
} from './motionTokens';
import { useReducedMotion } from './useReducedMotion';

interface RevealSectionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  /** Skip scroll-trigger; animate on mount (for above-the-fold). */
  immediate?: boolean;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
}

export function RevealSection({
  children,
  className = '',
  delay = 0,
  immediate = false,
  direction = 'up',
}: RevealSectionProps) {
  const reduced = useReducedMotion();

  const offset = direction === 'up'
    ? { y: MOTION_OFFSET.y }
    : direction === 'down'
      ? { y: -MOTION_OFFSET.y }
      : direction === 'left'
        ? { x: MOTION_OFFSET.x }
        : direction === 'right'
          ? { x: -MOTION_OFFSET.x }
          : {};

  const hidden = reduced ? { opacity: 0 } : { opacity: 0, ...offset };
  const visible = { opacity: 1, x: 0, y: 0 };

  return (
    <motion.section
      className={className}
      initial={hidden}
      animate={immediate ? visible : undefined}
      whileInView={immediate ? undefined : visible}
      viewport={revealViewport}
      transition={{
        duration: reduced ? 0.01 : MOTION_DURATION.base,
        ease: MOTION_EASE,
        delay: reduced ? 0 : delay,
      }}
    >
      {children}
    </motion.section>
  );
}

interface StaggerContainerProps {
  children: ReactNode;
  className?: string;
  immediate?: boolean;
  stagger?: number;
}

export function StaggerContainer({
  children,
  className = '',
  immediate = false,
  stagger = MOTION_STAGGER.card,
}: StaggerContainerProps) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial="hidden"
      animate={immediate ? 'visible' : undefined}
      whileInView={immediate ? undefined : 'visible'}
      viewport={revealViewport}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: reduced ? 0 : stagger,
            delayChildren: reduced ? 0 : 0.04,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

interface StaggerItemProps {
  children: ReactNode;
  className?: string;
  direction?: 'up' | 'left' | 'right';
}

export function StaggerItem({
  children,
  className = '',
  direction = 'up',
}: StaggerItemProps) {
  const reduced = useReducedMotion();

  const offset =
    direction === 'left'
      ? { x: -MOTION_OFFSET.x }
      : direction === 'right'
        ? { x: MOTION_OFFSET.x }
        : { y: MOTION_OFFSET.y };

  return (
    <motion.div
      className={className}
      variants={{
        hidden: reduced ? { opacity: 0 } : { opacity: 0, ...offset },
        visible: {
          opacity: 1,
          x: 0,
          y: 0,
          transition: {
            duration: reduced ? 0.01 : MOTION_DURATION.base,
            ease: MOTION_EASE,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}
