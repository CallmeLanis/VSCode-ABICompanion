import { motion } from 'motion/react';
import { useReducedMotion } from './useReducedMotion';
import { MOTION_DURATION } from './motionTokens';

interface SparklineDrawProps {
  values: number[];
  width?: number;
  height?: number;
  className?: string;
  positive?: boolean;
  glow?: boolean;
}

export function SparklineDraw({
  values,
  width = 280,
  height = 48,
  className = '',
  positive = true,
  glow = false,
}: SparklineDrawProps) {
  const reduced = useReducedMotion();

  if (values.length === 0) return null;

  const min = Math.min(...values, 0);
  const max = Math.max(...values, 0);
  const range = max - min || 1;
  const padding = 2;
  const drawHeight = height - padding * 2;

  const points = values.map((value, index) => {
    const x = values.length === 1 ? width / 2 : (index / (values.length - 1)) * width;
    const y = padding + drawHeight * (1 - (value - min) / range);
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });

  const pathD = `M ${points.join(' L ')}`;
  const stroke = positive ? 'var(--text-positive)' : 'var(--text-negative)';
  const strokeWidth = glow ? 2.75 : 2;
  const svgClass = [className, glow ? 'overview-sparkline-glow' : ''].filter(Boolean).join(' ');

  if (reduced) {
    return (
      <svg width={width} height={height} className={svgClass} aria-hidden>
        <path d={pathD} fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <svg width={width} height={height} className={svgClass} aria-hidden>
      <motion.path
        d={pathD}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: MOTION_DURATION.chart, ease: 'easeOut' }}
      />
    </svg>
  );
}
