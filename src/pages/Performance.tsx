import { useMemo, type ReactNode } from 'react';
import { Crosshair, Skull, Target, TrendingDown, TrendingUp } from 'lucide-react';
import { calculatePerformanceIntelligence } from '../utils/analytics';
import { generatePerformanceRecommendations, MIN_OPERATIONAL_HISTORY } from '../utils/intelligence';
import { useRoiRaids } from '../hooks/useStorageQuery';
import { formatCurrency, formatNumber, formatPercentage } from '../utils/mockData';
import {
  Caption,
  DataValue,
  MapName,
  MetaLabel,
  PageHeader,
  RoiViewToggle,
  StatCard,
} from '../components/ui';
import { RecommendationList } from '../components/intelligence/RecommendationCard';
import {
  AnimatedPath,
  RevealSection,
  StaggerContainer,
  StaggerItem,
} from '../components/motion';
import type { PerformanceInsight } from '../types';

const CHART_WIDTH = 760;
const CHART_HEIGHT = 320;
const CHART_PADDING = 32;

function buildLinePath(values: number[], width: number, height: number, padding: number): string {
  if (values.length === 0) return '';
  const drawHeight = height - padding * 2;
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 0);
  const range = max - min || 1;

  if (values.length === 1) {
    const y = padding + drawHeight * (1 - (values[0] - min) / range);
    return `M 0 ${y.toFixed(2)} L ${width} ${y.toFixed(2)}`;
  }

  return values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = padding + drawHeight * (1 - (value - min) / range);
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');
}

function zeroLineY(values: number[], height: number, padding: number): number {
  const drawHeight = height - padding * 2;
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 0);
  const range = max - min || 1;
  return padding + drawHeight * (1 - (0 - min) / range);
}

export function Performance() {
  const raids = useRoiRaids();
  const performance = useMemo(() => calculatePerformanceIntelligence(raids), [raids]);
  const recommendations = useMemo(() => generatePerformanceRecommendations(raids), [raids]);

  const { combat, maps, modes, strengths, weaknesses, risk, profitTrend, roiTrend } = performance;

  const profitPath = useMemo(
    () => buildLinePath(profitTrend, CHART_WIDTH, CHART_HEIGHT, CHART_PADDING),
    [profitTrend]
  );
  const roiPath = useMemo(
    () => buildLinePath(roiTrend, CHART_WIDTH, CHART_HEIGHT, CHART_PADDING),
    [roiTrend]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Combat intelligence"
        title="Performance"
        meta={`${formatNumber(combat.totalOperations)} operations analyzed`}
        actions={<RoiViewToggle />}
      />

      <RevealSection immediate delay={0.04}>
      <section aria-label="Combat intelligence" className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StaggerContainer className="contents xl:contents" immediate>
          <StaggerItem><StatCard
          label="Extraction rate"
          value={formatPercentage(combat.extractionRate)}
          subValue={`${formatNumber(combat.totalOperations)} operations`}
          icon={<Target size={18} />}
        /></StaggerItem>
          <StaggerItem><StatCard
          label="Total kills"
          value={formatNumber(combat.totalKills)}
          subValue={`${combat.averageKills.toFixed(1)} avg per raid`}
          icon={<Crosshair size={18} />}
        /></StaggerItem>
          <StaggerItem><StatCard
          label="Kills per extract"
          value={combat.killsPerExtract.toFixed(1)}
          subValue="Combat efficiency on clears"
          icon={<Skull size={18} />}
        /></StaggerItem>
          <StaggerItem><StatCard
          label="Avg net per raid"
          value={formatCurrency(combat.averageNetPerRaid)}
          subValue={`${formatPercentage(combat.deathRate)} KIA rate`}
          icon={<TrendingUp size={18} />}
        /></StaggerItem>
        </StaggerContainer>
      </section>
      </RevealSection>

      <RevealSection delay={0.06}>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <InsightPanel title="Strengths" insights={strengths} variant="positive" direction="left" />
        <InsightPanel title="Weaknesses" insights={weaknesses} variant="negative" direction="right" />
      </div>
      </RevealSection>

      <RevealSection delay={0.08}>
      {/* Map & mode analysis */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <AnalysisTable
          title="Map analysis"
          subtitle="Theater performance"
          emptyLabel="No map data yet"
          headers={['Map', 'Raids', 'Extract', 'Avg net', 'Best mode']}
          rows={maps.map(row => ({
            key: row.map,
            cells: [
              <MapName key="map">{row.map}</MapName>,
              formatNumber(row.raids),
              formatPercentage(row.extractionRate),
              formatCurrency(row.averageProfit),
              row.bestMode ?? '—',
            ],
            tone: row.averageProfit >= 0 ? 'positive' : 'negative',
          }))}
        />
        <AnalysisTable
          title="Mode analysis"
          subtitle="Ruleset efficiency"
          emptyLabel="No mode data yet"
          headers={['Mode', 'Raids', 'Extract', 'Avg net', 'Avg ROI']}
          rows={modes.map(row => ({
            key: row.mode,
            cells: [
              row.mode,
              formatNumber(row.raids),
              formatPercentage(row.extractionRate),
              formatCurrency(row.averageProfit),
              formatPercentage(row.averageROI),
            ],
            tone: row.averageProfit >= 0 ? 'positive' : 'negative',
          }))}
        />
      </div>
      </RevealSection>

      <RevealSection delay={0.1}>
      {/* Risk analysis */}
      <div className="hud-card rounded-xl p-5 relative">
        <div className="corner-accent top-left" />
        <div className="corner-accent top-right" />
        <div className="corner-accent bottom-left" />
        <div className="corner-accent bottom-right" />

        <div className="mb-5">
          <p className="hud-label mb-2">RISK ANALYSIS</p>
          <h2 className="text-xl font-black text-abi-text font-orbitron">Survival & exposure</h2>
        </div>

        {raids.length === 0 ? (
          <div className="flex h-32 items-center justify-center border border-dashed border-abi-border">
            <p className="hud-label">No operational data</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-px border border-abi-border bg-abi-border sm:grid-cols-3 xl:grid-cols-6">
            <RiskMetric label="Dry streak" value={`${risk.currentDryStreak} ops`} tone={risk.currentDryStreak >= 3 ? 'negative' : 'primary'} />
            <RiskMetric label="KIA rate" value={formatPercentage(risk.deathRate)} tone={risk.deathRate >= 50 ? 'negative' : 'primary'} />
            <RiskMetric label="Recent extract" value={formatPercentage(risk.recentExtractionRate)} tone={risk.recentExtractionRate >= 50 ? 'positive' : 'warning'} />
            <RiskMetric label="Prior extract" value={formatPercentage(risk.priorExtractionRate)} />
            <RiskMetric
              label="Extract trend"
              value={`${risk.extractionTrendDelta >= 0 ? '+' : ''}${risk.extractionTrendDelta.toFixed(0)} pts`}
              tone={risk.extractionTrendDelta >= 0 ? 'positive' : 'negative'}
            />
            <RiskMetric
              label="Highest risk map"
              value={risk.highestRiskMap ?? '—'}
              subValue={risk.highestRiskMap ? formatPercentage(risk.highestRiskMapExtractRate) : undefined}
              tone="warning"
            />
          </div>
        )}
      </div>
      </RevealSection>

      <RevealSection delay={0.12}>
      {/* Trend charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TrendChart
          label="PER-RAID VARIANCE"
          title="Net profit trend"
          values={profitTrend}
          path={profitPath}
          formatY={(v) => `${(v / 1_000_000).toFixed(1)}M`}
          stroke="var(--text-positive)"
          gradientId="perfGradient"
          gradientColor="var(--text-positive)"
        />
        <TrendChart
          label="RETURN EFFICIENCY"
          title="ROI trend"
          values={roiTrend}
          path={roiPath}
          formatY={(v) => `${v.toFixed(0)}%`}
          stroke="var(--text-accent)"
          gradientId="roiPerfGradient"
          gradientColor="var(--text-accent)"
        />
      </div>
      </RevealSection>

      <RevealSection delay={0.14}>
      {/* Recommendation panel */}
      <div className="hud-card rounded-xl p-5 relative">
        <div className="corner-accent top-left" />
        <div className="corner-accent top-right" />
        <div className="corner-accent bottom-left" />
        <div className="corner-accent bottom-right" />

        <div className="mb-5">
          <p className="hud-label mb-2">RECOMMENDATION ENGINE</p>
          <h2 className="text-xl font-black text-abi-text font-orbitron">Operational guidance</h2>
        </div>

        <RecommendationList
          recommendations={recommendations}
          hasEnoughHistory={raids.length >= MIN_OPERATIONAL_HISTORY}
          insufficientDescription={`At least ${MIN_OPERATIONAL_HISTORY} operations are required for performance guidance.`}
        />
      </div>
      </RevealSection>
    </div>
  );
}

function InsightPanel({
  title,
  insights,
  variant,
  direction = 'up',
}: {
  title: string;
  insights: PerformanceInsight[];
  variant: 'positive' | 'negative';
  direction?: 'left' | 'right' | 'up';
}) {
  const Icon = variant === 'positive' ? TrendingUp : TrendingDown;
  const accent = variant === 'positive' ? 'text-positive' : 'text-negative';

  return (
    <RevealSection direction={direction}>
    <div className="hud-card rounded-xl p-5 relative">
      <div className="corner-accent top-left" />
      <div className="corner-accent top-right" />
      <div className="corner-accent bottom-left" />
      <div className="corner-accent bottom-right" />

      <div className={`mb-4 flex items-center gap-2 ${accent}`}>
        <Icon size={16} aria-hidden />
        <h3 className="type-heading text-primary">{title}</h3>
      </div>

      {insights.length === 0 ? (
        <Caption tone="muted">
          {variant === 'positive'
            ? 'Not enough data to identify clear strengths yet.'
            : 'No critical weaknesses detected in current data.'}
        </Caption>
      ) : (
        <ul className="space-y-3">
          {insights.map(insight => (
            <li key={insight.id} className="border-l-2 border-abi-border pl-3">
              <p className="type-body text-primary">{insight.label}</p>
              <Caption tone="muted" className="mt-[var(--space-value-meta)] block">
                {insight.evidence}
              </Caption>
            </li>
          ))}
        </ul>
      )}
    </div>
    </RevealSection>
  );
}

function AnalysisTable({
  title,
  subtitle,
  headers,
  rows,
  emptyLabel,
}: {
  title: string;
  subtitle: string;
  headers: string[];
  rows: { key: string; cells: (string | ReactNode)[]; tone: 'positive' | 'negative' }[];
  emptyLabel: string;
}) {
  return (
    <div className="hud-card rounded-xl p-5 relative">
      <div className="corner-accent top-left" />
      <div className="corner-accent top-right" />
      <div className="corner-accent bottom-left" />
      <div className="corner-accent bottom-right" />

      <div className="mb-4">
        <p className="hud-label mb-2">{title.toUpperCase()}</p>
        <Caption tone="muted">{subtitle}</Caption>
      </div>

      {rows.length === 0 ? (
        <div className="flex h-32 items-center justify-center border border-dashed border-abi-border">
          <p className="hud-label">{emptyLabel}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-abi-border">
          <div
            className="grid gap-3 px-4 py-3 type-label text-secondary bg-abi-bg-elevated"
            style={{ gridTemplateColumns: `repeat(${headers.length}, minmax(0, 1fr))` }}
          >
            {headers.map(h => <span key={h}>{h}</span>)}
          </div>
          <div className="divide-y divide-abi-border">
            {rows.map(row => (
              <div
                key={row.key}
                className="grid gap-3 px-4 py-3 transition hover:bg-abi-bg-hover"
                style={{ gridTemplateColumns: `repeat(${headers.length}, minmax(0, 1fr))` }}
              >
                {row.cells.map((cell, i) => {
                  const isMetricCol = i >= 3;
                  const metricTone = row.tone === 'positive' ? 'text-positive' : 'text-negative';
                  return (
                    <span
                      key={i}
                      className={`text-sm ${isMetricCol ? `font-semibold ${metricTone}` : 'text-primary'}`}
                    >
                      {typeof cell === 'string' ? (
                        i === 0 ? <span className="uppercase">{cell}</span> : cell
                      ) : (
                        cell
                      )}
                    </span>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RiskMetric({
  label,
  value,
  subValue,
  tone = 'primary',
}: {
  label: string;
  value: string;
  subValue?: string;
  tone?: 'primary' | 'positive' | 'negative' | 'warning';
}) {
  return (
    <div className="bg-abi-bg-card p-3">
      <MetaLabel className="mb-[var(--space-label-value)] block">{label}</MetaLabel>
      <DataValue
        tone={tone}
        className={`block truncate ${label === 'Dry streak' && tone === 'negative' ? 'animate-pulse' : ''}`}
      >
        {value}
      </DataValue>
      {subValue && (
        <Caption tone="muted" className="mt-[var(--space-value-meta)] block">{subValue}</Caption>
      )}
    </div>
  );
}

function TrendChart({
  label,
  title,
  values,
  path,
  formatY,
  stroke,
  gradientId,
  gradientColor,
}: {
  label: string;
  title: string;
  values: number[];
  path: string;
  formatY: (v: number) => string;
  stroke: string;
  gradientId: string;
  gradientColor: string;
}) {
  const chartDrawHeight = CHART_HEIGHT - CHART_PADDING * 2;

  return (
    <div className="hud-card rounded-xl p-5 relative">
      <div className="corner-accent top-left" />
      <div className="corner-accent top-right" />
      <div className="corner-accent bottom-left" />
      <div className="corner-accent bottom-right" />

      <div className="mb-5">
        <p className="hud-label mb-2">{label}</p>
        <h2 className="text-xl font-black text-abi-text font-orbitron">{title}</h2>
      </div>

      {values.length === 0 ? (
        <div className="flex h-[320px] items-center justify-center border border-dashed border-abi-border">
          <p className="hud-label">No trend data</p>
        </div>
      ) : (
        <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} className="w-full h-[320px]" role="img">
          <defs>
            <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={gradientColor} stopOpacity="0.15" />
              <stop offset="100%" stopColor={gradientColor} stopOpacity="0" />
            </linearGradient>
          </defs>

          {[0, 1, 2, 3].map(row => {
            const y = CHART_PADDING + (row * chartDrawHeight) / 3;
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

          <line
            x1="0"
            y1={zeroLineY(values, CHART_HEIGHT, CHART_PADDING)}
            x2={CHART_WIDTH}
            y2={zeroLineY(values, CHART_HEIGHT, CHART_PADDING)}
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="1"
          />

          {path && (
            <>
              <AnimatedPath
                d={path}
                stroke={stroke}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d={`${path} L ${CHART_WIDTH} ${CHART_HEIGHT - CHART_PADDING} L 0 ${CHART_HEIGHT - CHART_PADDING} Z`}
                fill={`url(#${gradientId})`}
                opacity="0.6"
              />
            </>
          )}

          {[Math.min(...values, 0), 0, Math.max(...values, 0)].map((value, i) => {
            const min = Math.min(...values, 0);
            const max = Math.max(...values, 0);
            const range = max - min || 1;
            const y = CHART_PADDING + chartDrawHeight * (1 - (value - min) / range);
            return (
              <text key={i} x="-4" y={y + 4} textAnchor="end" fontSize="11" fill="var(--text-muted)">
                {formatY(value)}
              </text>
            );
          })}
        </svg>
      )}
    </div>
  );
}
