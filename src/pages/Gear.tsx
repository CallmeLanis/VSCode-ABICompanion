import { useMemo } from 'react';
import { Shield, ShieldAlert, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { calculateGearIntelligence } from '../utils/analytics';
import { generateGearRecommendations, MIN_OPERATIONAL_HISTORY } from '../utils/intelligence';
import { useRoiRaids } from '../hooks/useStorageQuery';
import { formatCurrency, formatPercentage } from '../utils/mockData';
import {
  Caption,
  DataValue,
  MapName,
  MetaLabel,
  PageHeader,
  RoiViewToggle,
  StatCard,
  StatusBadge,
} from '../components/ui';
import { RecommendationList } from '../components/intelligence/RecommendationCard';
import {
  AnimatedBar,
  AnimatedPath,
  RevealSection,
  StaggerContainer,
  StaggerItem,
} from '../components/motion';
import { STATUS_ICONS } from '../data/constants';
import type { LoadoutCard } from '../types';

const CHART_WIDTH = 760;
const CHART_HEIGHT = 240;
const CHART_PADDING = 28;

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

export function Gear() {
  const raids = useRoiRaids();
  const gear = useMemo(() => calculateGearIntelligence(raids), [raids]);
  const recommendations = useMemo(() => generateGearRecommendations(raids), [raids]);

  const { summary, loadouts, roiComparison, usageHistory, performanceHistory } = gear;
  const maxRoi = useMemo(
    () => Math.max(...roiComparison.map(r => Math.abs(r.averageROI)), 1),
    [roiComparison]
  );
  const perfPath = useMemo(
    () => buildLinePath(performanceHistory, CHART_WIDTH, CHART_HEIGHT, CHART_PADDING),
    [performanceHistory]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Loadout workshop"
        title="Gear"
        meta={`${summary.extractedCount + summary.kiaCount} geared operations`}
        actions={<RoiViewToggle />}
      />

      <RevealSection immediate delay={0.04}>
      <section aria-label="Gear summary" className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StaggerContainer className="contents xl:contents" immediate>
          <StaggerItem><StatCard label="Gear brought" value={formatCurrency(summary.totalGearValueBrought)} subValue="Lifetime loadout value" icon={<Wallet size={18} />} /></StaggerItem>
          <StaggerItem><StatCard label="Gear lost" value={formatCurrency(summary.totalGearValueLost)} subValue={`${summary.kiaCount} KIA operations`} icon={<ShieldAlert size={18} />} /></StaggerItem>
          <StaggerItem><StatCard label="Gear rescued" value={formatCurrency(summary.totalGearValueRescued)} subValue={`Best rescue ${formatPercentage(summary.bestRescuePercentage)}`} icon={<Shield size={18} />} /></StaggerItem>
          <StaggerItem><StatCard label="Recovery rate" value={formatPercentage(summary.recoveryRate)} subValue={`Worst rescue ${formatPercentage(summary.worstRescuePercentage)}`} icon={<TrendingUp size={18} />} /></StaggerItem>
        </StaggerContainer>
      </section>
      </RevealSection>

      <RevealSection delay={0.06}>
      <section aria-label="Loadout cards">
        <div className="mb-3">
          <MetaLabel tone="accent" className="block mb-1">Loadout tiers</MetaLabel>
          <Caption tone="muted">Grouped by gear value investment band</Caption>
        </div>

        {loadouts.length === 0 ? (
          <div className="grid min-h-[180px] place-items-center border border-dashed border-abi-border bg-abi-bg/35 p-6 text-center">
            <Caption tone="secondary">Log raids with gear value to populate loadout intelligence.</Caption>
          </div>
        ) : (
          <StaggerContainer className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            {loadouts.map(loadout => (
              <StaggerItem key={loadout.id}>
                <LoadoutCardPanel loadout={loadout} />
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
      </section>
      </RevealSection>

      <RevealSection delay={0.08}>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="hud-card rounded-xl p-5 relative">
          <div className="corner-accent top-left" />
          <div className="corner-accent top-right" />
          <div className="corner-accent bottom-left" />
          <div className="corner-accent bottom-right" />

          <div className="mb-5">
            <p className="hud-label mb-2">ROI COMPARISON</p>
            <h2 className="text-xl font-black text-abi-text font-orbitron">Loadout efficiency</h2>
          </div>

          {roiComparison.length === 0 ? (
            <div className="flex h-40 items-center justify-center border border-dashed border-abi-border">
              <p className="hud-label">No loadout data</p>
            </div>
          ) : (
            <div className="space-y-4">
              {roiComparison.map(row => {
                const widthPct = Math.max((Math.abs(row.averageROI) / maxRoi) * 100, 4);
                const positive = row.averageROI >= 0;
                return (
                  <div key={row.id}>
                    <div className="flex items-baseline justify-between gap-3 mb-1.5">
                      <MetaLabel>{row.label}</MetaLabel>
                      <DataValue tone={positive ? 'positive' : 'negative'}>
                        {formatPercentage(row.averageROI)}
                      </DataValue>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-sm border border-abi-border bg-abi-bg relative">
                      <AnimatedBar
                        widthPercent={widthPct}
                        className={`absolute inset-y-0 left-0 h-full ${positive ? 'bg-abi-success' : 'bg-abi-danger'}`}
                      />
                    </div>
                    <Caption tone="muted" className="mt-1 block">{row.usage} deployments</Caption>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="hud-card rounded-xl p-5 relative">
          <div className="corner-accent top-left" />
          <div className="corner-accent top-right" />
          <div className="corner-accent bottom-left" />
          <div className="corner-accent bottom-right" />

          <div className="mb-5">
            <p className="hud-label mb-2">PERFORMANCE HISTORY</p>
            <h2 className="text-xl font-black text-abi-text font-orbitron">Cumulative gear net</h2>
          </div>

          {performanceHistory.length === 0 ? (
            <div className="flex h-[240px] items-center justify-center border border-dashed border-abi-border">
              <p className="hud-label">No performance history</p>
            </div>
          ) : (
            <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} className="w-full h-[240px]" role="img">
              <defs>
                <linearGradient id="gearPerfGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="var(--text-accent)" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="var(--text-accent)" stopOpacity="0" />
                </linearGradient>
              </defs>
              {perfPath && (
                <>
                  <AnimatedPath
                    d={perfPath}
                    stroke="var(--text-accent)"
                    strokeWidth={2}
                    strokeLinecap="round"
                  />
                  <path
                    d={`${perfPath} L ${CHART_WIDTH} ${CHART_HEIGHT - CHART_PADDING} L 0 ${CHART_HEIGHT - CHART_PADDING} Z`}
                    fill="url(#gearPerfGradient)"
                    opacity="0.6"
                  />
                </>
              )}
            </svg>
          )}
        </div>
      </div>

      {/* Usage history */}
      <div className="hud-card rounded-xl p-5 relative">
        <div className="corner-accent top-left" />
        <div className="corner-accent top-right" />
        <div className="corner-accent bottom-left" />
        <div className="corner-accent bottom-right" />

        <div className="mb-5">
          <p className="hud-label mb-2">USAGE HISTORY</p>
          <h2 className="text-xl font-black text-abi-text font-orbitron">Recent loadout deployments</h2>
        </div>

        {usageHistory.length === 0 ? (
          <div className="flex h-32 items-center justify-center border border-dashed border-abi-border">
            <p className="hud-label">No usage history</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-abi-border">
            <div className="grid grid-cols-[minmax(0,1fr)_auto_auto_auto_auto] gap-3 px-4 py-3 type-label text-secondary bg-abi-bg-elevated">
              <span>Operation</span>
              <span>Gear</span>
              <span>Invest</span>
              <span>Net</span>
              <span>Status</span>
            </div>
            <div className="divide-y divide-abi-border max-h-[360px] overflow-y-auto">
              {usageHistory.map(row => (
                <div
                  key={row.raidId}
                  className="grid grid-cols-[minmax(0,1fr)_auto_auto_auto_auto] items-center gap-3 px-4 py-3 hover:bg-abi-bg-hover transition-colors"
                >
                  <div className="min-w-0">
                    <MapName className="block truncate">{row.map}</MapName>
                    <Caption tone="muted" className="mt-[var(--space-value-meta)] block">
                      {row.mode} · {new Date(row.timestamp).toLocaleDateString('en-US')}
                    </Caption>
                  </div>
                  <DataValue>{formatCurrency(row.gearValue)}</DataValue>
                  <DataValue>{formatCurrency(row.investment)}</DataValue>
                  <DataValue tone={row.netProfit >= 0 ? 'positive' : 'negative'}>
                    {formatCurrency(row.netProfit)}
                  </DataValue>
                  <StatusBadge status={row.status} icon={STATUS_ICONS[row.status]} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      </RevealSection>

      <RevealSection delay={0.1}>
      {/* Recommendations */}
      <div className="hud-card rounded-xl p-5 relative">
        <div className="corner-accent top-left" />
        <div className="corner-accent top-right" />
        <div className="corner-accent bottom-left" />
        <div className="corner-accent bottom-right" />

        <div className="mb-5">
          <p className="hud-label mb-2">LOADOUT GUIDANCE</p>
          <h2 className="text-xl font-black text-abi-text font-orbitron">Gear recommendations</h2>
        </div>

        <RecommendationList
          recommendations={recommendations}
          hasEnoughHistory={raids.length >= MIN_OPERATIONAL_HISTORY}
          insufficientDescription={`At least ${MIN_OPERATIONAL_HISTORY} operations are required for loadout guidance.`}
        />
      </div>
      </RevealSection>
    </div>
  );
}

function LoadoutCardPanel({ loadout }: { loadout: LoadoutCard }) {
  const trendUp = loadout.trendDelta >= 0;

  return (
    <div className="hud-card p-4 relative">
      <div className="corner-accent top-left" />
      <div className="corner-accent top-right" />
      <div className="corner-accent bottom-left" />
      <div className="corner-accent bottom-right" />

      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <MetaLabel tone="accent" className="block mb-1">{loadout.label}</MetaLabel>
          <Caption tone="muted">{loadout.usage} deployments</Caption>
        </div>
        <span className={`inline-flex items-center gap-0.5 type-caption ${trendUp ? 'text-positive' : 'text-negative'}`}>
          {trendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {trendUp ? '+' : ''}{formatCurrency(loadout.trendDelta)}
        </span>
      </div>

      <DataValue
        tone={loadout.averageProfit >= 0 ? 'positive' : 'negative'}
        className="block text-lg"
      >
        {formatCurrency(loadout.averageProfit)}
      </DataValue>
      <Caption tone="muted" className="mt-[var(--space-value-meta)] block">Avg net per raid</Caption>

      <div className="mt-4 grid grid-cols-2 gap-px border border-abi-border bg-abi-border">
        <div className="bg-abi-bg-card p-2.5">
          <MetaLabel className="block mb-1">ROI</MetaLabel>
          <DataValue tone={loadout.averageROI >= 0 ? 'positive' : 'negative'}>
            {formatPercentage(loadout.averageROI)}
          </DataValue>
        </div>
        <div className="bg-abi-bg-card p-2.5">
          <MetaLabel className="block mb-1">Extract</MetaLabel>
          <DataValue tone={loadout.extractionRate >= 50 ? 'positive' : 'warning'}>
            {formatPercentage(loadout.extractionRate)}
          </DataValue>
        </div>
        <div className="bg-abi-bg-card p-2.5">
          <MetaLabel className="block mb-1">Avg invest</MetaLabel>
          <DataValue>{formatCurrency(loadout.averageInvestment)}</DataValue>
        </div>
        <div className="bg-abi-bg-card p-2.5">
          <MetaLabel className="block mb-1">Top map</MetaLabel>
          <DataValue className="truncate block">{loadout.topMap ?? '—'}</DataValue>
        </div>
      </div>
    </div>
  );
}
