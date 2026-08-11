import { useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { MOTION_DURATION, MOTION_EASE } from './motionTokens';
import { useReducedMotion } from './useReducedMotion';

interface StepTransitionProps {
  stepKey: string | number;
  children: ReactNode;
  className?: string;
  direction?: 'forward' | 'back';
}

/** Slide + fade between wizard steps (Mission Debrief). */
export function StepTransition({
  stepKey,
  children,
  className = '',
  direction = 'forward',
}: StepTransitionProps) {
  const reduced = useReducedMotion();
  const x = direction === 'forward' ? 12 : -12;

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={stepKey}
        className={className}
        initial={{ opacity: 0, x, y: 4, scale: 0.995 }}
        animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
        exit={{ opacity: 0, x: -x, y: -2, scale: 0.995 }}
        transition={{ duration: MOTION_DURATION.step, ease: MOTION_EASE }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

interface LiveKPIProps {
  label: string;
  value: number;
  format?: (n: number) => string;
  tone?: 'default' | 'positive' | 'negative';
}

export function LiveKPI({ label, value, format, tone = 'default' }: LiveKPIProps) {
  const reduced = useReducedMotion();
  const display = format ? format(value) : value.toLocaleString();
  const toneClass =
    tone === 'positive' ? 'text-positive' : tone === 'negative' ? 'text-negative' : 'text-abi-text';

  return (
    <div>
      <p className="text-xs text-abi-text-dim mb-1">{label}</p>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.p
          key={display}
          className={`text-sm font-bold tabular-nums ${toneClass}`}
          initial={reduced ? false : { opacity: 0, y: 5, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduced ? undefined : { opacity: 0, y: -4, scale: 0.98 }}
          transition={{
            duration: reduced ? 0 : MOTION_DURATION.fast,
            ease: MOTION_EASE,
          }}
        >
          {display}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

interface ExpandPanelProps {
  open: boolean;
  children: ReactNode;
  className?: string;
}

export function ExpandPanel({ open, children, className = '' }: ExpandPanelProps) {
  const reduced = useReducedMotion();
  const [settledOpen, setSettledOpen] = useState(false);

  if (reduced) {
    return open ? <div className={className}>{children}</div> : null;
  }

  return (
    <AnimatePresence
      initial={false}
      onExitComplete={() => setSettledOpen(false)}
    >
      {open && (
        <motion.div
          className={className}
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: MOTION_DURATION.base, ease: MOTION_EASE }}
          style={{ overflow: settledOpen ? 'visible' : 'hidden' }}
          onAnimationStart={() => setSettledOpen(false)}
          onAnimationComplete={() => {
            if (open) setSettledOpen(true);
          }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface CrossfadeContentProps {
  contentKey: string | number;
  children: ReactNode;
  className?: string;
}

export function CrossfadeContent({ contentKey, children, className = '' }: CrossfadeContentProps) {
  const reduced = useReducedMotion();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={contentKey}
        className={className}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: MOTION_DURATION.fast }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
