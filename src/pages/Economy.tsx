import { useMemo, useState } from 'react';
import {
  calculateProfitCurve,
  calculateSpendBreakdown,
  calculateAmmoUsage,
  calculateConsumableUsage,
} from '../utils/analytics';
import { useRaids } from '../hooks/useStorageQuery';
import { formatCurrency, formatNumber } from '../utils/mockData';
import { PageHeader } from '../components/ui/PageHeader';

type Range = '7d' | '30d' | 'all';

const RANGE_OPTIONS: { id: Range; label: string }[] = [
  { id: '7d', label: '7D' },
  { id: '30d', label: '30D' },
  { id: 'all', label: 'All' },
];

const CHART_WIDTH = 760;
const CHART_HEIGHT = 320;
const CHART_PADDING = 28;

function rangeCutoff(range: Range): number | null {
  if (range === 'all') return null;
  const days = range === '7d' ? 7 : 30;
  return Date.now() - days * 24 * 60 * 60 * 1000;
}

function rangeLabel(range: Range): string {
  if (range === '7d') return 'LAST 7 DAYS';
  if (range === '30d') return 'LAST 30 DAYS';
  return 'ALL RAIDS';
}

export function Economy() {
  const raids = useRaids();
  const [range, setRange] = useState<Range>('all');

  const rangedRaids = useMemo(() => {
    const cutoff = rangeCutoff(range);
    if (cutoff === null) return raids;
    return raids.filter((raid) => raid.timestamp >= cutoff);
  }, [raids, range]);

  const profitCurve = useMemo(() => calculateProfitCurve(rangedRaids), [rangedRaids]);
  const spendBreakdown = useMemo(() => calculateSpendBreakdown(rangedRaids), [rangedRaids]);
  const ammoUsage = useMemo(() => calculateAmmoUsage(rangedRaids, 8), [rangedRaids]);
  const consumableUsage = useMemo(() => calculateConsumableUsage(rangedRaids, 12), [rangedRaids]);

  const { values: cumulativePL, minY, maxY, yAxisTicks, labels } = profitCurve;
  const { segments: spendSegments, total: spendTotal } = spendBreakdown;
  const { rows: ammoRows, totalSpend: ammoTotalSpend } = ammoUsage;
  const { rows: consumableRows, totalSpend: consumableTotalSpend } = consumableUsage;

  const maxAmmoSpend = useMemo(
    () => Math.max(...ammoRows.map((row) => row.total), 1),
    [ammoRows]
  );

  const plotHeight = CHART_HEIGHT - CHART_PADDING * 2;
  const yScale = maxY - minY || 1;

  const chartGeometry = useMemo(() => {
    const toY = (value: number) =>
      CHART_PADDING + plotHeight * (1 - (value - minY) / yScale);

    const toX = (index: number) => {
      if (cumulativePL.length <= 1) return CHART_WIDTH / 2;
      return (index / (cumulativePL.length - 1)) * CHART_WIDTH;
    };

    let linePath = '';
    if (cumulativePL.length === 1) {
      const y = toY(cumulativePL[0]);
      linePath = `M 0 ${y.toFixed(2)} L ${CHART_WIDTH} ${y.toFixed(2)}`;
    } else if (cumulativePL.length > 1) {
      linePath = cumulativePL
        .map((value, index) => {
          const x = toX(index);
          const y = toY(value);
          return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
        })
        .join(' ');
    }

    const areaPath = linePath
      ? `${linePath} L ${CHART_WIDTH} ${CHART_HEIGHT - CHART_PADDING} L 0 ${CHART_HEIGHT - CHART_PADDING} Z`
      : '';

    let peak: { index: number; value: number } | null = null;
    let low: { index: number; value: number } | null = null;
    if (cumulativePL.length > 0) {
      let peakIndex = 0;
      let lowIndex = 0;
      for (let i = 1; i < cumulativePL.length; i += 1) {
        if (cumulativePL[i] > cumulativePL[peakIndex]) peakIndex = i;
        if (cumulativePL[i] < cumulativePL[lowIndex]) lowIndex = i;
      }
      peak = { index: peakIndex, value: cumulativePL[peakIndex] };
      low = { index: lowIndex, value: cumulativePL[lowIndex] };
    }

    let xLabelIndices: number[] = [];
    if (cumulativePL.length === 1) {
      xLabelIndices = [0];
    } else if (cumulativePL.length > 1) {
      xLabelIndices = [
        ...new Set([
          0,
          Math.floor(cumulativePL.length / 4),
          Math.floor(cumulativePL.length / 2),
          Math.floor((cumulativePL.length * 3) / 4),
          cumulativePL.length - 1,
        ]),
      ];
    }

    return {
      toX,
      toY,
      linePath,
      areaPath,
      peak,
      low,
      xLabelIndices,
      zeroY: toY(0),
    };
  }, [cumulativePL, minY, maxY, plotHeight, yScale]);

  const donutOffsets = useMemo(() => {
    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    let offset = 0;
    const safeTotal = spendTotal || 1;
    return spendSegments.map((segment) => {
      const dash = (segment.value / safeTotal) * circumference;
      const current = { dash, offset, circumference };
      offset += dash;
      return current;
    });
  }, [spendSegments, spendTotal]);

  const { toX, toY, linePath, areaPath, peak, low, xLabelIndices, zeroY } = chartGeometry;

  return (
    <div className="space-y-6 page-enter">
      <PageHeader
        eyebrow="Economy intelligence"
        title="Financial overview"
        meta={`${formatNumber(rangedRaids.length)} raids · ${rangeLabel(range)}`}
        actions={
          <div className="filter-tabs">
            {RANGE_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                className={`filter-tab ${range === option.id ? 'active' : ''}`}
                onClick={() => setRange(option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-[60%_40%] gap-4">
        {/* Cumulative P/L */}
        <div className="hud-card rounded-xl p-5 relative">
          <div className="corner-accent top-left" />
          <div className="corner-accent top-right" />
          <div className="corner-accent bottom-left" />
          <div className="corner-accent bottom-right" />

          <div className="flex items-start justify-between mb-5 gap-4">
            <div>
              <p className="hud-label mb-2">CUMULATIVE P/L</p>
              <h2 className="text-2xl font-black text-abi-text font-orbitron">Net Worth Performance</h2>
            </div>
            <span className="hud-label mt-1 shrink-0">{rangeLabel(range)}</span>
          </div>

          {cumulativePL.length === 0 ? (
            <div className="flex h-[320px] items-center justify-center border border-dashed border-abi-border rounded-sm">
              <p className="hud-label">No raid data in this range</p>
            </div>
          ) : (
            <div className="relative">
              <svg
                viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
                className="w-full h-[320px]"
                role="img"
                aria-label="Cumulative profit and loss chart"
              >
                <defs>
                  <linearGradient id="plGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="var(--text-accent)" stopOpacity="0.28" />
                    <stop offset="100%" stopColor="var(--text-accent)" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {[0, 1, 2, 3].map((row) => {
                  const y = CHART_PADDING + (row * plotHeight) / 3;
                  return (
                    <line
                      key={row}
                      x1="0"
                      y1={y}
                      x2={CHART_WIDTH}
                      y2={y}
                      stroke="rgba(255,255,255,0.08)"
                      strokeDasharray="4 6"
                    />
                  );
                })}

                {yAxisTicks.map((value) => {
                  const y = toY(value);
                  return (
                    <text
                      key={value}
                      x="2"
                      y={y + 4}
                      textAnchor="start"
                      fontSize="11"
                      fill="var(--text-muted)"
                      className="tabular-nums"
                    >
                      {value.toLocaleString()}
                    </text>
                  );
                })}

                {zeroY >= CHART_PADDING && zeroY <= CHART_HEIGHT - CHART_PADDING && (
                  <line
                    x1="0"
                    y1={zeroY}
                    x2={CHART_WIDTH}
                    y2={zeroY}
                    stroke="rgba(154,146,136,0.35)"
                    strokeWidth="1"
                  />
                )}

                {linePath && (
                  <>
                    <path d={areaPath} fill="url(#plGradient)" opacity="0.85" />
                    <path
                      d={linePath}
                      fill="none"
                      stroke="var(--text-accent)"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </>
                )}

                {peak && (
                  <g>
                    <circle
                      cx={toX(peak.index)}
                      cy={toY(peak.value)}
                      r="6"
                      fill="var(--text-positive)"
                      stroke="var(--abi-bg)"
                      strokeWidth="2"
                    >
                      <title>{`Peak: ${formatCurrency(peak.value)} at ${labels[peak.index] ?? `R${peak.index + 1}`}`}</title>
                    </circle>
                  </g>
                )}

                {low &&
                  peak &&
                  (low.index !== peak.index || low.value !== peak.value) && (
                    <g>
                      <circle
                        cx={toX(low.index)}
                        cy={toY(low.value)}
                        r="6"
                        fill="var(--text-negative)"
                        stroke="var(--abi-bg)"
                        strokeWidth="2"
                      >
                        <title>{`Low: ${formatCurrency(low.value)} at ${labels[low.index] ?? `R${low.index + 1}`}`}</title>
                      </circle>
                    </g>
                  )}

                {xLabelIndices.map((index) => {
                  const x = toX(index);
                  return (
                    <text
                      key={index}
                      x={x}
                      y={CHART_HEIGHT - 6}
                      textAnchor="middle"
                      fontSize="11"
                      fill="var(--text-muted)"
                      className="tabular-nums"
                    >
                      {labels[index] ?? `R${index + 1}`}
                    </text>
                  );
                })}
              </svg>

              <div className="mt-3 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-abi-orange" />
                  <span className="hud-label">Cumulative</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-abi-success" />
                  <span className="hud-label">
                    Peak {peak ? formatCurrency(peak.value) : '—'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-abi-danger" />
                  <span className="hud-label">
                    Low {low ? formatCurrency(low.value) : '—'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Spend Breakdown Donut */}
        <div className="hud-card rounded-xl p-5 relative">
          <div className="corner-accent top-left" />
          <div className="corner-accent top-right" />
          <div className="corner-accent bottom-left" />
          <div className="corner-accent bottom-right" />

          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="hud-label mb-2">SPEND BREAKDOWN</p>
              <h2 className="text-2xl font-black text-abi-text font-orbitron">Expense Distribution</h2>
            </div>
          </div>

          <div className="flex flex-col items-center gap-6">
            <div className="relative w-full max-w-[280px] h-[280px]">
              <svg viewBox="0 0 220 220" className="w-full h-full" aria-label="Spend breakdown donut">
                <circle
                  cx="110"
                  cy="110"
                  r="80"
                  fill="transparent"
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="20"
                />
                {spendTotal > 0 &&
                  spendSegments.map((segment, index) => {
                    const { dash, offset, circumference } = donutOffsets[index];
                    return (
                      <circle
                        key={segment.label}
                        cx="110"
                        cy="110"
                        r="80"
                        fill="transparent"
                        stroke={segment.color}
                        strokeWidth="20"
                        strokeDasharray={`${dash} ${circumference - dash}`}
                        strokeDashoffset={-offset}
                        strokeLinecap="butt"
                        transform="rotate(-90 110 110)"
                      >
                        <title>{`${segment.label}: ${formatCurrency(segment.value)}`}</title>
                      </circle>
                    );
                  })}
                <text
                  x="110"
                  y="104"
                  textAnchor="middle"
                  fontSize="11"
                  fill="var(--text-muted)"
                  className="hud-label"
                >
                  TOTAL
                </text>
                <text
                  x="110"
                  y="128"
                  textAnchor="middle"
                  fontSize="16"
                  fill="var(--text-primary)"
                  fontWeight="700"
                  className="tabular-nums font-orbitron"
                >
                  {formatCurrency(spendTotal)}
                </text>
              </svg>
            </div>

            <div className="space-y-3 w-full">
              {spendSegments.map((segment) => {
                const pct = spendTotal > 0 ? (segment.value / spendTotal) * 100 : 0;
                return (
                  <div key={segment.label} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className="h-3 w-3 rounded-full shrink-0"
                        style={{ backgroundColor: segment.color }}
                      />
                      <span className="hud-label truncate">{segment.label}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-abi-text-muted tabular-nums">
                        {pct.toFixed(0)}%
                      </span>
                      <span className="text-sm font-semibold text-abi-text tabular-nums">
                        {formatCurrency(segment.value)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Ammo leaderboard — horizontal bars */}
        <div className="hud-card rounded-xl p-5 relative">
          <div className="corner-accent top-left" />
          <div className="corner-accent top-right" />
          <div className="corner-accent bottom-left" />
          <div className="corner-accent bottom-right" />

          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="hud-label mb-2">MOST EXPENSIVE AMMO USAGE</p>
              <h2 className="text-xl font-black text-abi-text font-orbitron">Ammo spend leaderboard</h2>
            </div>
            {ammoRows.length > 0 && (
              <span className="text-sm font-semibold text-abi-danger tabular-nums">
                {formatCurrency(ammoTotalSpend)}
              </span>
            )}
          </div>

          {ammoRows.length === 0 ? (
            <div className="flex h-40 items-center justify-center border border-dashed border-abi-border rounded-sm">
              <p className="hud-label">No ammo spend in this range</p>
            </div>
          ) : (
            <div className="space-y-4">
              {ammoRows.map((row) => {
                const widthPct = Math.max((row.total / maxAmmoSpend) * 100, 4);
                return (
                  <div key={`${row.ammo}-${row.tier}`} className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-abi-text truncate">
                            {row.ammo}
                          </span>
                          <span className="inline-flex items-center rounded-sm border border-abi-orange/50 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.14em] text-abi-orange">
                            {row.tier}
                          </span>
                        </div>
                        <p className="hud-label mt-1">
                          {row.family} · {formatNumber(row.rounds)} rounds · {formatCurrency(row.unit)}/rd
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-abi-danger tabular-nums shrink-0">
                        {formatCurrency(row.total)}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-sm bg-abi-bg overflow-hidden border border-abi-border">
                      <div
                        className="h-full rounded-sm bg-abi-orange transition-[width] duration-300"
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Consumables table */}
        <div className="hud-card rounded-xl p-5 relative">
          <div className="corner-accent top-left" />
          <div className="corner-accent top-right" />
          <div className="corner-accent bottom-left" />
          <div className="corner-accent bottom-right" />

          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="hud-label mb-2">CONSUMABLE SPENDING</p>
              <h2 className="text-xl font-black text-abi-text font-orbitron">Outlay by item</h2>
            </div>
            {consumableRows.length > 0 && (
              <span className="text-sm font-semibold text-abi-danger tabular-nums">
                {formatCurrency(consumableTotalSpend)}
              </span>
            )}
          </div>

          {consumableRows.length === 0 ? (
            <div className="flex h-40 items-center justify-center border border-dashed border-abi-border rounded-sm">
              <p className="hud-label">No consumable spend in this range</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-sm border border-abi-border">
              <div className="grid grid-cols-[1.4fr_1fr_0.7fr_0.9fr_1fr] gap-3 px-4 py-3 hud-label bg-abi-bg-elevated">
                <span>Item</span>
                <span>Subtype</span>
                <span>Qty</span>
                <span>Unit</span>
                <span>Total</span>
              </div>
              <div className="divide-y divide-abi-border">
                {consumableRows.map((row) => (
                  <div
                    key={row.item}
                    className="grid grid-cols-[1.4fr_1fr_0.7fr_0.9fr_1fr] gap-3 px-4 py-4 transition hover:bg-abi-bg-hover"
                  >
                    <span className="text-sm text-abi-text truncate">{row.item}</span>
                    <span className="text-sm text-abi-text-muted">{row.subtype}</span>
                    <span className="text-sm text-abi-text tabular-nums">{formatNumber(row.qty)}</span>
                    <span className="text-sm text-abi-text tabular-nums">{formatCurrency(row.unit)}</span>
                    <span className="text-sm font-semibold text-abi-danger tabular-nums">
                      {formatCurrency(row.total)}
                    </span>
                  </div>
                ))}
                <div className="grid grid-cols-[1.4fr_1fr_0.7fr_0.9fr_1fr] gap-3 px-4 py-3 bg-abi-bg/40">
                  <span className="hud-label">Total</span>
                  <span />
                  <span />
                  <span />
                  <span className="text-sm font-bold text-abi-danger tabular-nums">
                    {formatCurrency(consumableTotalSpend)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
