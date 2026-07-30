import { useEffect, useRef, useState } from 'react';
import { motion, useSpring, useTransform } from 'motion/react';
import { useReducedMotion } from './useReducedMotion';
import { MOTION_DURATION } from './motionTokens';

interface CountUpValueProps {
  value: number;
  format?: (n: number) => string;
  className?: string;
  duration?: number;
  /** Delay color reveal until near end of count */
  toneClass?: string;
}

export function CountUpValue({
  value,
  format = (n) => String(Math.round(n)),
  className = '',
  duration = MOTION_DURATION.countUp,
  toneClass,
}: CountUpValueProps) {
  const reduced = useReducedMotion();
  const spring = useSpring(reduced ? value : 0, {
    stiffness: 80,
    damping: 20,
    duration: reduced ? 0 : duration * 1000,
  });
  const display = useTransform(spring, (latest) => format(latest));
  const [showTone, setShowTone] = useState(reduced);

  useEffect(() => {
    spring.set(value);
    if (reduced || !toneClass) {
      setShowTone(true);
      return;
    }
    setShowTone(false);
    const timer = window.setTimeout(() => setShowTone(true), duration * 700);
    return () => window.clearTimeout(timer);
  }, [value, spring, reduced, toneClass, duration]);

  if (reduced) {
    return <span className={`${className} ${toneClass ?? ''}`.trim()}>{format(value)}</span>;
  }

  return (
    <motion.span
      className={`${className} ${showTone && toneClass ? toneClass : ''}`.trim()}
    >
      <motion.span>{display}</motion.span>
    </motion.span>
  );
}

/** Parses numeric prefix from formatted currency strings like "$1,234" or "-$500". */
export function parseNumericValue(raw: string | number): number {
  if (typeof raw === 'number') return raw;
  const cleaned = raw.replace(/[^0-9.-]/g, '');
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

interface AnimatedStatValueProps {
  value: string | number;
  className?: string;
  toneClass?: string;
}

export function AnimatedStatValue({ value, className = '', toneClass }: AnimatedStatValueProps) {
  const reduced = useReducedMotion();
  const isString = typeof value === 'string';
  const numeric = isString ? parseNumericValue(value) : value;
  const prefixRef = useRef(isString ? String(value).replace(/[\d.,-]/g, '') : '');

  if (isString && !/\d/.test(String(value))) {
    return <span className={`${className} ${toneClass ?? ''}`.trim()}>{value}</span>;
  }

  const format = (n: number) => {
    if (!isString) return String(Math.round(n));
    const prefix = prefixRef.current;
    const abs = Math.abs(n);
    const formatted = abs.toLocaleString('en-US', { maximumFractionDigits: 0 });
    const sign = n < 0 ? '-' : String(value).includes('+') ? '+' : '';
    return `${sign}${prefix}${formatted}`;
  };

  if (reduced) {
    return <span className={`${className} ${toneClass ?? ''}`.trim()}>{value}</span>;
  }

  return (
    <CountUpValue
      value={numeric}
      format={format}
      className={className}
      toneClass={toneClass}
    />
  );
}
