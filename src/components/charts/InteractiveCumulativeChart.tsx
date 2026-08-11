import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { motion } from 'motion/react';
import { useReducedMotion } from '../motion/useReducedMotion';
import { MOTION_DURATION } from '../motion/motionTokens';
import type { ProfitCurvePoint } from '../../types';

interface InteractiveCumulativeChartProps {
  points: ProfitCurvePoint[];
  minY: number;
  maxY: number;
  onRaidClick?: (raidId: string) => void;
  onActiveChange?: (point: ProfitCurvePoint | null) => void;
  className?: string;
}

const WIDTH = 420;
const HEIGHT = 160;
const PAD_X = 4;
const PAD_Y = 10;

function toX(index: number, count: number): number {
  if (count <= 1) return WIDTH / 2;
  return PAD_X + (index / (count - 1)) * (WIDTH - PAD_X * 2);
}

function toY(value: number, minY: number, maxY: number): number {
  const range = maxY - minY || 1;
  return PAD_Y + (HEIGHT - PAD_Y * 2) * (1 - (value - minY) / range);
}

export function InteractiveCumulativeChart({
  points,
  minY,
  maxY,
  onRaidClick,
  onActiveChange,
  className = '',
}: InteractiveCumulativeChartProps) {
  const reduced = useReducedMotion();
  const clipId = useId();
  const svgRef = useRef<SVGSVGElement>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const positive = points.length > 1
    ? points[points.length - 1].cumulative >= points[0].cumulative
    : (points[0]?.cumulative ?? 0) >= 0;

  const stroke = positive ? 'var(--text-positive)' : 'var(--text-negative)';
  const glowTone = positive ? 'is-positive' : 'is-negative';

  const pathD = useMemo(() => {
    if (points.length === 0) return '';
    return points
      .map((point, index) => {
        const x = toX(index, points.length);
        const y = toY(point.cumulative, minY, maxY);
        return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(' ');
  }, [points, minY, maxY]);

  useEffect(() => {
    onActiveChange?.(activeIndex !== null ? points[activeIndex] ?? null : null);
  }, [activeIndex, onActiveChange, points]);

  const resolveIndexFromClientX = useCallback(
    (clientX: number) => {
      const svg = svgRef.current;
      if (!svg || points.length === 0) return null;
      const rect = svg.getBoundingClientRect();
      if (rect.width <= 0) return null;
      const ratio = (clientX - rect.left) / rect.width;
      const x = PAD_X + ratio * (WIDTH - PAD_X * 2);
      let nearest = 0;
      let bestDist = Number.POSITIVE_INFINITY;
      for (let i = 0; i < points.length; i += 1) {
        const dist = Math.abs(toX(i, points.length) - x);
        if (dist < bestDist) {
          bestDist = dist;
          nearest = i;
        }
      }
      return nearest;
    },
    [points],
  );

  const handlePointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    const index = resolveIndexFromClientX(event.clientX);
    if (index !== null) setActiveIndex(index);
  };

  const handlePointerLeave = () => setActiveIndex(null);

  const handleActivate = () => {
    if (activeIndex === null || !onRaidClick) return;
    onRaidClick(points[activeIndex].raidId);
  };

  if (points.length < 2 || !pathD) return null;

  const active = activeIndex !== null ? points[activeIndex] : null;
  const activeX = active ? toX(active.index, points.length) : 0;
  const activeY = active ? toY(active.cumulative, minY, maxY) : 0;

  return (
    <div className={`overview-sparkline-hero ${glowTone} relative h-full w-full ${className}`.trim()}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="overview-sparkline-glow h-full w-full cursor-crosshair"
        role="img"
        aria-label="Cumulative profit across all recorded operations. Hover to inspect each raid."
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onClick={handleActivate}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleActivate();
          }
        }}
        tabIndex={onRaidClick ? 0 : undefined}
      >
        <defs>
          <clipPath id={clipId}>
            <rect x="0" y="0" width={WIDTH} height={HEIGHT} />
          </clipPath>
        </defs>

        <g clipPath={`url(#${clipId})`}>
          {reduced ? (
            <path
              d={pathD}
              fill="none"
              stroke={stroke}
              strokeWidth={2.75}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : (
            <motion.path
              d={pathD}
              fill="none"
              stroke={stroke}
              strokeWidth={2.75}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: MOTION_DURATION.chart, ease: 'easeOut' }}
            />
          )}

          {active && (
            <g pointerEvents="none">
              <line
                x1={activeX}
                y1={PAD_Y}
                x2={activeX}
                y2={HEIGHT - PAD_Y}
                stroke="rgba(var(--abi-orange-rgb), 0.45)"
                strokeWidth={1}
                strokeDasharray="3 4"
              />
              <circle
                cx={activeX}
                cy={activeY}
                r={5.5}
                fill={stroke}
                stroke="var(--abi-bg)"
                strokeWidth={2}
              />
              <circle
                cx={activeX}
                cy={activeY}
                r={10}
                fill={stroke}
                opacity={0.18}
              />
            </g>
          )}
        </g>
      </svg>
    </div>
  );
}
