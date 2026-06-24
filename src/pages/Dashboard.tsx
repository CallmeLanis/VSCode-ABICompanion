import { useMemo, useState } from 'react';
import {
  calculateProfitCurve,
  calculateSpendBreakdown,
} from '../utils/analytics';
import { useStorageQuery } from '../hooks/useStorageQuery';
import { DashboardCard } from '../components/dashboard/DashboardWidgets';
import type { Page } from '../components/Navigation';

interface DashboardProps {
  onNavigate: (page: Page) => void;
}

function formatMoney(value: number) {
  return `$${value.toLocaleString()}`;
}

function getPathFromData(values: number[], min: number, max: number) {
  const width = 760;
  const height = 320;
  const padding = 32;
  const chartHeight = height - padding * 2;

  if (values.length === 0) {
    return '';
  }

  if (values.length === 1) {
    const y = padding + chartHeight * (1 - (values[0] - min) / (max - min || 1));
    return `M 0 ${y.toFixed(2)} L ${width} ${y.toFixed(2)}`;
  }

  return values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = padding + chartHeight * (1 - (value - min) / (max - min || 1));
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');
}

function getPointPosition(index: number, value: number, pointCount: number, min: number, max: number) {
  const width = 760;
  const height = 320;
  const padding = 32;
  const chartHeight = height - padding * 2;
  const x = pointCount <= 1 ? width / 2 : (index / (pointCount - 1)) * width;
  const y = padding + chartHeight * (1 - (value - min) / (max - min || 1));
  return { x, y };
}

function getDonutOffsets(data: { value: number }[], total: number) {
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  if (total <= 0) {
    return data.map(() => ({ dash: 0, offset: 0 }));
  }

  return data.map((segment) => {
    const dash = (segment.value / total) * circumference;
    const current = { dash, offset };
    offset += dash;
    return current;
  });
}

export function Dashboard({}: DashboardProps) {
  const [viewMode, setViewMode] = useState('ECONOMY');
  const profitCurve = useStorageQuery(['raids', 'analytics'], calculateProfitCurve);
  const spendBreakdown = useStorageQuery(['raids', 'analytics'], calculateSpendBreakdown);

  const { values: cumulativePL, labels: cumulativeLabels, minY, maxY, yAxisTicks } = profitCurve;
  const { segments: spendSegments, total: spendTotal } = spendBreakdown;

  const linePath = useMemo(
    () => getPathFromData(cumulativePL, minY, maxY),
    [cumulativePL, minY, maxY],
  );
  const donutOffsets = useMemo(
    () => getDonutOffsets(spendSegments, spendTotal),
    [spendSegments, spendTotal],
  );

  return (
    <div className="space-y-6 dashboard-shell">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="hud-label text-xs tracking-[0.3em] mb-2">ECONOMY VIEW</p>
          <h1 className="text-4xl lg:text-5xl font-black text-abi-text">Tactical Spend Intelligence</h1>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <span className="hud-chip rounded-full px-4 py-2 tracking-[0.24em] text-xs uppercase text-abi-orange border border-abi-orange/25">
            View: {viewMode}
          </span>
          <select
            className="bg-[#111118] border border-abi-border text-sm text-abi-text px-3 py-2 rounded-lg focus:outline-none focus:border-abi-orange"
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
          >
            <option value="OPS">OPS</option>
            <option value="ECONOMY">ECONOMY</option>
            <option value="FIELD">FIELD</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[60%_40%] gap-4">
        <div className="space-y-4">
          <DashboardCard className="min-h-[420px] overflow-hidden">
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="hud-label mb-2">CUMULATIVE P/L</p>
                <h2 className="text-2xl font-black text-abi-text">All Raids</h2>
              </div>
              <span className="text-xs uppercase tracking-[0.28em] text-abi-text-muted mt-1">ALL RAIDS</span>
            </div>
            <div className="relative">
              <svg viewBox="0 0 760 320" className="w-full h-[320px]">
                <defs>
                  <linearGradient id="plGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#ff5500" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="#ff5500" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {[0, 1, 2, 3].map((row) => {
                  const y = 32 + row * 76;
                  return (
                    <g key={row}>
                      <line x1="0" y1={y} x2="760" y2={y} stroke="rgba(255,255,255,0.08)" strokeDasharray="4 6" />
                    </g>
                  );
                })}
                {[0, 1, 2, 3, 4, 5, 6].map((col) => {
                  const x = col * 108.57;
                  return (
                    <g key={col}>
                      <line x1={x} y1="32" x2={x} y2="288" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 5" />
                    </g>
                  );
                })}
                {linePath && (
                  <>
                    <path d={linePath} fill="none" stroke="#ff5500" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    <path d={`${linePath} L 760 288 L 0 288 Z`} fill="url(#plGradient)" opacity="0.8" />
                  </>
                )}
                {cumulativePL.map((value, index) => {
                  const { x, y } = getPointPosition(index, value, cumulativePL.length, minY, maxY);
                  return (
                    <g key={index}>
                      <circle cx={x} cy={y} r="5" fill="#ff5500" />
                      <circle cx={x} cy={y} r="10" fill="transparent">
                        <title>{`${cumulativeLabels[index]} • ${formatMoney(value)}`}</title>
                      </circle>
                    </g>
                  );
                })}
                {cumulativeLabels.map((label, index) => {
                  const x = cumulativeLabels.length <= 1
                    ? 380
                    : (index / (cumulativeLabels.length - 1)) * 760;
                  return (
                    <text key={`${label}-${index}`} x={x} y="306" textAnchor="middle" fontSize="11" fill="#888888">
                      {label}
                    </text>
                  );
                })}
                {yAxisTicks.map((value) => {
                  const y = 32 + (1 - (value - minY) / (maxY - minY || 1)) * 256;
                  return (
                    <text key={value} x="-4" y={y + 4} textAnchor="end" fontSize="11" fill="#888888">
                      {value.toLocaleString()}
                    </text>
                  );
                })}
              </svg>
            </div>
          </DashboardCard>

        </div>

        <div className="space-y-4">
          <DashboardCard className="min-h-[420px] overflow-hidden">
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="hud-label mb-2">SPEND BREAKDOWN</p>
                <h2 className="text-2xl font-black text-abi-text">Expense distribution</h2>
              </div>
            </div>
            <div className="flex flex-col items-center gap-6 md:flex-row md:items-center md:justify-between">
              <div className="relative w-full md:w-[280px] h-[280px]">
                <svg viewBox="0 0 220 220" className="w-full h-full">
                  <circle cx="110" cy="110" r="80" fill="transparent" stroke="rgba(255,255,255,0.08)" strokeWidth="20" />
                  {spendSegments.map((segment, index) => {
                    const radius = 80;
                    const circumference = 2 * Math.PI * radius;
                    const offset = donutOffsets[index].offset;
                    const dash = donutOffsets[index].dash;
                    return (
                      <circle
                        key={segment.label}
                        cx="110"
                        cy="110"
                        r={radius}
                        fill="transparent"
                        stroke={segment.color}
                        strokeWidth="20"
                        strokeDasharray={`${dash} ${circumference - dash}`}
                        strokeDashoffset={-offset}
                        strokeLinecap="butt"
                        transform="rotate(-90 110 110)"
                      >
                        <title>{`${segment.label}: ${formatMoney(segment.value)}`}</title>
                      </circle>
                    );
                  })}
                  <text x="110" y="112" textAnchor="middle" fontSize="14" fill="#ffffff" fontWeight="700">Spend</text>
                  <text x="110" y="132" textAnchor="middle" fontSize="10" fill="#888888">Breakdown</text>
                </svg>
              </div>
              <div className="space-y-3">
                {spendSegments.map((segment) => (
                  <div key={segment.label} className="flex items-center gap-3">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: segment.color }} />
                    <div>
                      <div className="text-sm uppercase tracking-[0.28em] text-abi-text-muted">{segment.label}</div>
                      <div className="text-lg font-semibold text-abi-text">{formatMoney(segment.value)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </DashboardCard>

        </div>
      </div>
    </div>
  );
}
