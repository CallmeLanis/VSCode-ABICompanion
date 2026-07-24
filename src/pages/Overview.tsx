import { useMemo, useState, type ReactNode } from 'react';
import { Star, MapPin, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import { useRaids, useHighlights, useStoredSessions, useDashboardAnalytics } from '../hooks/useStorageQuery';
import { formatCurrency, formatPercentage, formatNumber } from '../utils/mockData';
import { PageHeader } from '../components/ui/PageHeader';
import { Badge, Caption, DataValue, DisplayValue, EmptyState, MapName, MetaLabel, type Tone } from '../components/ui';

interface OverviewProps {
  onRaidClick: (raidId: string) => void;
}

export function Overview({ onRaidClick }: OverviewProps) {
  const analytics = useDashboardAnalytics();
  const raids = useRaids();
  const highlights = useHighlights();
  const sessions = useStoredSessions();
  const [showMoreMetrics, setShowMoreMetrics] = useState(false);

  const recentRaids = useMemo(() => {
    return [...raids]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 8);
  }, [raids]);

  const profitSpark = useMemo(() => {
    const sorted = [...raids].sort((a, b) => a.timestamp - b.timestamp).slice(-12);
    let cum = 0;
    return sorted.map((r) => {
      cum += r.netProfit;
      return cum;
    });
  }, [raids]);

  const latestHighlight = useMemo(() => {
    const sorted = [...highlights].sort((a, b) => b.timestamp - a.timestamp);
    return sorted[0];
  }, [highlights]);

  const bestSession = useMemo(() => {
    return [...sessions].sort((a, b) => b.totalProfit - a.totalProfit)[0];
  }, [sessions]);

  const latestHighlightRaid = latestHighlight
    ? raids.find((r) => r.id === latestHighlight.raidId)
    : null;

  const totalAmmoSpent = useMemo(
    () => raids.reduce((sum, r) => sum + r.ammo.reduce((aSum, a) => aSum + a.totalCost, 0), 0),
    [raids]
  );
  const totalConsumablesSpent = useMemo(
    () =>
      raids.reduce((sum, r) => sum + r.consumables.reduce((cSum, c) => cSum + c.totalCost, 0), 0),
    [raids]
  );

  const worstRaid = useMemo(() => {
    if (raids.length === 0) return null;
    return [...raids].sort((a, b) => a.netProfit - b.netProfit)[0];
  }, [raids]);

  const bestRaidToday = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayRaids = raids.filter((r) => r.timestamp >= today.getTime());
    return todayRaids.sort((a, b) => b.netProfit - a.netProfit)[0];
  }, [raids]);

  const lastUpdate = recentRaids[0]
    ? new Date(recentRaids[0].timestamp).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'No raids yet';

  return (
    <div className="space-y-6 page-enter">
      <PageHeader
        eyebrow="Tactical overview"
        title="Mission control"
        meta={`${formatNumber(analytics.totalRaids)} raids · updated ${lastUpdate}`}
        actions={
          <Badge variant="orange" className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-abi-success animate-pulse" />
            Local
          </Badge>
        }
      />

      {/* Primary KPI strip — 4 only */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <MetricCard
          label="Lifetime profit"
          value={formatCurrency(analytics.lifetimeProfit)}
          color={analytics.lifetimeProfit >= 0 ? 'green' : 'red'}
          accent
          spark={profitSpark}
        />
        <MetricCard
          label="Extraction rate"
          value={formatPercentage(analytics.extractionRate)}
          color="orange"
          subValue={`${formatNumber(analytics.totalExtracted)} / ${formatNumber(analytics.totalRaids)}`}
        />
        <MetricCard
          label="Average ROI"
          value={formatPercentage(analytics.averageROI)}
          color={analytics.averageROI >= 0 ? 'green' : 'red'}
        />
        <MetricCard
          label="Total raids"
          value={formatNumber(analytics.totalRaids)}
          color="white"
          subValue={analytics.dryStreak > 0 ? `Dry streak ${analytics.dryStreak} KIA` : 'On streak'}
        />
      </div>

      <button
        type="button"
        onClick={() => setShowMoreMetrics((v) => !v)}
        className="font-mono text-[10px] uppercase tracking-[0.14em] text-abi-text-muted hover:text-abi-orange inline-flex items-center gap-1.5 transition-colors"
      >
        {showMoreMetrics ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        {showMoreMetrics ? 'Hide secondary metrics' : 'Show secondary metrics'}
      </button>

      {showMoreMetrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 animate-fade-in">
          <MetricCard
            label="Avg loot value"
            value={formatCurrency(analytics.averageLootValue)}
            color="white"
          />
          <MetricCard
            label="Best raid today"
            value={bestRaidToday ? formatCurrency(bestRaidToday.netProfit) : '$0'}
            color="green"
          />
          <MetricCard label="Dry streak" value={`${analytics.dryStreak} KIA`} color="white" />
          <MetricCard
            label="Extracted"
            value={formatNumber(analytics.totalExtracted)}
            subValue={`of ${formatNumber(analytics.totalRaids)}`}
            color="green"
          />
        </div>
      )}

      {/* Asymmetric hero: highlight dominates */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-3">
        <Panel title="Latest highlight" className="min-h-[200px]">
          {latestHighlightRaid ? (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="orange" className="inline-flex items-center gap-1">
                  <Star size={10} />
                  Highlight
                </Badge>
                <Caption tone="secondary">
                  {latestHighlightRaid.map} — {latestHighlightRaid.mode}
                </Caption>
                <Caption tone="muted" className="ml-auto">
                  {new Date(latestHighlightRaid.timestamp).toLocaleDateString('en-US')}
                </Caption>
              </div>

              <DisplayValue
                size="xl"
                tone={latestHighlightRaid.netProfit >= 0 ? 'positive' : 'negative'}
              >
                {formatCurrency(latestHighlightRaid.netProfit)}
              </DisplayValue>

              <div className="grid grid-cols-3 gap-2">
                <MiniStat label="Kills" value={String(latestHighlightRaid.kills)} />
                <MiniStat
                  label="ROI"
                  value={formatPercentage(latestHighlightRaid.roi)}
                  tone="green"
                />
                <MiniStat label="Map" value={latestHighlightRaid.map.split(' ')[0]} />
              </div>

              <button
                type="button"
                onClick={() => onRaidClick(latestHighlightRaid.id)}
                className="type-caption text-accent hover:underline"
              >
                Open raid detail →
              </button>
            </div>
          ) : (
            <EmptyState
              icon={<Star size={28} />}
              title="No highlights yet"
              description="High-profit or high-kill raids will appear here automatically."
            />
          )}
        </Panel>

        <Panel title="Best session">
          {bestSession ? (
            <div className="space-y-4 h-full flex flex-col">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="success" className="inline-flex items-center gap-1">
                  <TrendingUp size={10} />
                  Top session
                </Badge>
                <Caption tone="secondary">
                  {bestSession.raidCount} raids
                </Caption>
              </div>

              <DisplayValue tone="positive">
                {formatCurrency(bestSession.totalProfit)}
              </DisplayValue>

              <div className="grid grid-cols-2 gap-2 mt-auto">
                <MiniStat label="Raids" value={String(bestSession.raidCount)} />
                <MiniStat
                  label="Extract rate"
                  value={formatPercentage(bestSession.extractionRate)}
                  tone="green"
                />
              </div>
            </div>
          ) : (
            <p className="text-abi-text-muted text-sm font-mono">No sessions recorded</p>
          )}
        </Panel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Panel title="Economy snapshot">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <EconomyRow
              label="Lifetime profit"
              value={formatCurrency(analytics.lifetimeProfit)}
              color="green"
            />
            <EconomyRow
              label="Average raid net"
              value={formatCurrency(analytics.lifetimeProfit / (analytics.totalRaids || 1))}
            />
            <EconomyRow label="Ammo spending" value={formatCurrency(totalAmmoSpent)} />
            <EconomyRow
              label="Consumables spending"
              value={formatCurrency(totalConsumablesSpent)}
            />
            <EconomyRow
              label="Best today"
              value={bestRaidToday ? formatCurrency(bestRaidToday.netProfit) : '$0'}
              color="green"
            />
            <EconomyRow
              label="Worst raid"
              value={worstRaid ? formatCurrency(worstRaid.netProfit) : '$0'}
              color="red"
            />
          </div>
        </Panel>

        <Panel title="Recent raids">
          {recentRaids.length === 0 ? (
            <EmptyState
              icon={<MapPin size={28} />}
              title="No raids logged"
              description="Open Raids and log your first extraction to populate mission control."
            />
          ) : (
            <div className="relative pl-3 space-y-0 max-h-[320px] overflow-y-auto">
              <div className="absolute left-[7px] top-2 bottom-2 w-px bg-abi-border" />
              {recentRaids.map((raid) => (
                <button
                  key={raid.id}
                  type="button"
                  onClick={() => onRaidClick(raid.id)}
                  className="relative w-full flex items-center justify-between py-2.5 pl-5 pr-2 text-left group hover:bg-abi-bg-hover/60 rounded-md transition-colors"
                >
                  <span
                    className={`absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full border ${
                      raid.status === 'EXTRACTED'
                        ? 'bg-abi-success border-abi-success'
                        : 'bg-abi-danger border-abi-danger'
                    }`}
                  />
                  <div className="min-w-0">
                    <MapName className="block uppercase truncate group-hover:text-accent transition-colors">
                      {raid.map}
                    </MapName>
                    <Caption className="block mt-[var(--space-value-meta)]">
                      {new Date(raid.timestamp).toLocaleDateString('en-US')} · {raid.mode}
                    </Caption>
                  </div>
                  <div className="text-right shrink-0 pl-3">
                    <DataValue tone={raid.netProfit >= 0 ? 'positive' : 'negative'}>
                      {formatCurrency(raid.netProfit)}
                    </DataValue>
                    <Caption className="block mt-[var(--space-value-meta)] uppercase">
                      {raid.status}
                    </Caption>
                  </div>
                </button>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}

function Panel({
  title,
  children,
  className = '',
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`hud-card p-5 relative ${className}`}>
      <div className="corner-accent top-left" />
      <div className="corner-accent top-right" />
      <div className="corner-accent bottom-left" />
      <div className="corner-accent bottom-right" />
      <h3 className="hud-heading mb-4">{title}</h3>
      {children}
    </div>
  );
}

function MiniStat({
  label,
  value,
  tone = 'white',
}: {
  label: string;
  value: string;
  tone?: 'white' | 'green';
}) {
  return (
    <div className="bg-abi-bg/50 rounded-md p-3 border border-abi-border/60">
      <MetaLabel className="block mb-[var(--space-label-value)]">{label}</MetaLabel>
      <DataValue tone={tone === 'green' ? 'positive' : 'primary'}>{value}</DataValue>
    </div>
  );
}

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const w = 120;
  const h = 28;
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / range) * (h - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  const positive = values[values.length - 1] >= values[0];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-7 mt-3 opacity-80" aria-hidden>
      <polyline
        fill="none"
        stroke={positive ? 'var(--text-positive)' : 'var(--text-negative)'}
        strokeWidth="1.5"
        points={points}
      />
    </svg>
  );
}

function MetricCard({
  label,
  value,
  subValue,
  color = 'white',
  accent = false,
  spark,
}: {
  label: string;
  value: string;
  subValue?: string;
  color?: 'white' | 'orange' | 'green' | 'red';
  accent?: boolean;
  spark?: number[];
}) {
  const tones: Record<'white' | 'orange' | 'green' | 'red', Tone> = {
    white: 'primary',
    orange: 'accent',
    green: 'positive',
    red: 'negative',
  };

  return (
    <div className={`hud-card p-4 relative ${accent ? 'border-abi-orange/35' : ''}`}>
      <div className="corner-accent top-left" />
      <div className="corner-accent top-right" />
      <div className="corner-accent bottom-left" />
      <div className="corner-accent bottom-right" />

      <MetaLabel className="block mb-[var(--space-label-value)]">{label}</MetaLabel>
      <DisplayValue tone={tones[color]}>{value}</DisplayValue>
      {subValue && (
        <Caption className="block mt-[var(--space-value-meta)] uppercase">
          {subValue}
        </Caption>
      )}
      {spark && spark.length > 1 && <Sparkline values={spark} />}
    </div>
  );
}

function EconomyRow({
  label,
  value,
  color = 'white',
}: {
  label: string;
  value: string;
  color?: 'white' | 'green' | 'red';
}) {
  const tones: Record<'white' | 'green' | 'red', Tone> = {
    white: 'primary',
    green: 'positive',
    red: 'negative',
  };

  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-md bg-abi-bg/40 border border-abi-border/50">
      <MetaLabel>{label}</MetaLabel>
      <DataValue tone={tones[color]}>{value}</DataValue>
    </div>
  );
}
