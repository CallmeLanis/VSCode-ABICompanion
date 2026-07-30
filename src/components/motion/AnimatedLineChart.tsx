import { motion } from 'motion/react';
import { useReducedMotion } from './useReducedMotion';
import { MOTION_DURATION } from './motionTokens';

interface AnimatedPathProps {
  d: string;
  className?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  strokeLinecap?: 'round' | 'butt' | 'square';
  strokeLinejoin?: 'round' | 'bevel' | 'miter';
  opacity?: number;
}

export function AnimatedPath({
  d,
  className = '',
  fill = 'none',
  stroke = 'var(--abi-orange)',
  strokeWidth = 2,
  strokeLinecap,
  strokeLinejoin,
  opacity,
}: AnimatedPathProps) {
  const reduced = useReducedMotion();

  if (!d) return null;

  if (reduced) {
    return (
      <path
        d={d}
        className={className}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap={strokeLinecap}
        strokeLinejoin={strokeLinejoin}
        opacity={opacity}
      />
    );
  }

  return (
    <motion.path
      d={d}
      className={className}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap={strokeLinecap}
      strokeLinejoin={strokeLinejoin}
      opacity={opacity}
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: opacity ?? 1 }}
      transition={{ duration: MOTION_DURATION.chart, ease: 'easeOut' }}
    />
  );
}

interface AnimatedLineChartProps {
  path: string;
  width: number;
  height: number;
  className?: string;
  stroke?: string;
  strokeWidth?: number;
}

export function AnimatedLineChart({
  path,
  width,
  height,
  className = '',
  stroke = 'var(--abi-orange)',
  strokeWidth = 2,
}: AnimatedLineChartProps) {
  const reduced = useReducedMotion();

  if (!path) return null;

  if (reduced) {
    return (
      <svg width={width} height={height} className={className} aria-hidden>
        <path d={path} fill="none" stroke={stroke} strokeWidth={strokeWidth} />
      </svg>
    );
  }

  return (
    <svg width={width} height={height} className={className} aria-hidden>
      <motion.path
        d={path}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: MOTION_DURATION.chart, ease: 'easeOut' }}
      />
    </svg>
  );
}

interface AnimatedBarProps {
  widthPercent: number;
  className?: string;
  delay?: number;
  mode?: 'width' | 'flex';
}

export function AnimatedBar({
  widthPercent,
  className = '',
  delay = 0,
  mode = 'width',
}: AnimatedBarProps) {
  const reduced = useReducedMotion();
  const target = mode === 'flex'
    ? { flexBasis: `${widthPercent}%` }
    : { width: `${widthPercent}%` };
  const initial = mode === 'flex'
    ? { flexBasis: reduced ? `${widthPercent}%` : '0%' }
    : { width: reduced ? `${widthPercent}%` : '0%' };

  return (
    <motion.div
      className={className}
      initial={initial}
      whileInView={target}
      viewport={{ once: true, amount: 0.5 }}
      transition={{
        duration: reduced ? 0.01 : MOTION_DURATION.slow,
        ease: 'easeOut',
        delay: reduced ? 0 : delay,
      }}
      style={mode === 'flex' ? { flexShrink: 0 } : undefined}
    />
  );
}
