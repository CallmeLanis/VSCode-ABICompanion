import { useMemo } from 'react';
import { Star, MapPin, Users, TrendingUp } from 'lucide-react';
import { getRaids, getSessions, getHighlights } from '../utils/storage';
import { calculateDashboardAnalytics } from '../utils/analytics';
import { formatCurrency, formatPercentage, formatNumber } from '../utils/mockData';

interface OverviewProps {
  onRaidClick: (raidId: string) => void;
}

export function Overview({ onRaidClick }: OverviewProps) {
  const analytics = useMemo(() => calculateDashboardAnalytics(), []);
  const raids = useMemo(() => getRaids(), []);
  const highlights = useMemo(() => getHighlights(), []);
  const sessions = useMemo(() => getSessions(), []);

  const recentRaids = useMemo(() => {
    return [...raids]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10);
  }, [raids]);

  const latestHighlight = useMemo(() => {
    const sorted = [...highlights].sort((a, b) => b.timestamp - a.timestamp);
    return sorted[0];
  }, [highlights]);

  const bestSession = useMemo(() => {
    return [...sessions].sort((a, b) => b.totalProfit - a.totalProfit)[0];
  }, [sessions]);

  const latestHighlightRaid = latestHighlight
    ? raids.find(r => r.id === latestHighlight.raidId)
    : null;

  const bestSessionRaids = bestSession
    ? raids.filter(r => r.sessionId === bestSession.id)
    : [];

  const totalAmmoSpent = raids.reduce((sum, r) =>
    sum + r.ammo.reduce((aSum, a) => aSum + a.totalCost, 0), 0);
  const totalConsumablesSpent = raids.reduce((sum, r) =>
    sum + r.consumables.reduce((cSum, c) => cSum + c.totalCost, 0), 0);

  const worstRaid = useMemo(() => {
    return [...raids].sort((a, b) => a.netProfit - b.netProfit)[0];
  }, [raids]);

  const bestRaidToday = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayRaids = raids.filter(r => r.timestamp >= today.getTime());
    return todayRaids.sort((a, b) => b.netProfit - a.netProfit)[0];
  }, [raids]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="hud-label text-xs tracking-[0.3em] mb-2">TACTICAL OVERVIEW</p>
          <h1 className="text-4xl lg:text-5xl font-black text-abi-text">Mission Control</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="hud-chip rounded-full px-4 py-2 tracking-[0.24em] text-xs uppercase text-abi-orange border border-abi-orange/25">
            Live Data
          </span>
        </div>
      </div>

      {/* Top Row: 8 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="TOTAL RAIDS" value={formatNumber(analytics.totalRaids)} color="white" />
        <MetricCard label="EXTRACTION RATE" value={`${formatPercentage(analytics.extractionRate)}`} color="orange" />
        <MetricCard label="LIFETIME PROFIT" value={formatCurrency(analytics.lifetimeProfit)} color="green" glow />
        <MetricCard label="AVERAGE ROI" value={`${formatPercentage(analytics.averageROI)}`} color="green" />
        <MetricCard label="AVG LOOT VALUE" value={formatCurrency(analytics.averageLootValue)} color="white" />
        <MetricCard
          label="BEST RAID TODAY"
          value={bestRaidToday ? formatCurrency(bestRaidToday.netProfit) : '$0'}
          color="green"
        />
        <MetricCard
          label="DRY STREAK"
          value={`${analytics.dryStreak} KIA`}
          color="white"
        />
        <MetricCard
          label="EXTRACTED"
          value={`${formatNumber(analytics.totalExtracted)}`}
          subValue={`OF ${formatNumber(analytics.totalRaids)}`}
          color="green"
        />
      </div>

      {/* Middle Row: Latest Highlight & Best Session */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Latest Highlight */}
        <div className="hud-card rounded-xl p-5 relative">
          <div className="corner-accent top-left" />
          <div className="corner-accent top-right" />
          <div className="corner-accent bottom-left" />
          <div className="corner-accent bottom-right" />

          <div className="flex items-center justify-between mb-4">
            <h3 className="hud-heading text-sm">LATEST HIGHLIGHT</h3>
            <span className="text-xs text-abi-text-muted">
              {latestHighlightRaid
                ? new Date(latestHighlightRaid.timestamp).toLocaleDateString('en-US', {
                    month: 'numeric',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'N/A'}
            </span>
          </div>

          {latestHighlightRaid ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="hud-chip rounded px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-abi-orange border border-abi-orange/30 flex items-center gap-1">
                  <Star size={10} />
                  HIGHLIGHT
                </span>
                <span className="text-sm text-abi-text-muted uppercase tracking-wider">
                  {latestHighlightRaid.map} - {latestHighlightRaid.mode.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-abi-bg/50 rounded-lg p-3 border border-abi-border/50">
                  <p className="hud-label text-[10px] mb-1">PROFIT</p>
                  <p className="text-lg font-bold text-green-400">{formatCurrency(latestHighlightRaid.netProfit)}</p>
                </div>
                <div className="bg-abi-bg/50 rounded-lg p-3 border border-abi-border/50">
                  <p className="hud-label text-[10px] mb-1">KILLS</p>
                  <p className="text-lg font-bold text-abi-text">{latestHighlightRaid.kills}</p>
                </div>
                <div className="bg-abi-bg/50 rounded-lg p-3 border border-abi-border/50">
                  <p className="hud-label text-[10px] mb-1">MAP</p>
                  <p className="text-lg font-bold text-abi-text uppercase">{latestHighlightRaid.map.split(' ')[0]}</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-abi-text-muted text-sm">No highlights recorded</p>
          )}
        </div>

        {/* Best Session */}
        <div className="hud-card rounded-xl p-5 relative">
          <div className="corner-accent top-left" />
          <div className="corner-accent top-right" />
          <div className="corner-accent bottom-left" />
          <div className="corner-accent bottom-right" />

          <div className="flex items-center justify-between mb-4">
            <h3 className="hud-heading text-sm">BEST SESSION</h3>
            <span className="text-xs text-abi-text-muted">
              {bestSession
                ? new Date(bestSession.startTime).toLocaleDateString('en-US', {
                    month: 'numeric',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'N/A'}
            </span>
          </div>

          {bestSession ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="hud-chip rounded px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-green-400 border border-green-400/30 flex items-center gap-1">
                  <TrendingUp size={10} />
                  TOP SESSION
                </span>
                <span className="text-sm text-abi-text-muted uppercase tracking-wider">
                  {bestSession.raidCount} RAIDS
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-abi-bg/50 rounded-lg p-3 border border-abi-border/50">
                  <p className="hud-label text-[10px] mb-1">TOTAL PROFIT</p>
                  <p className="text-lg font-bold text-green-400">{formatCurrency(bestSession.totalProfit)}</p>
                </div>
                <div className="bg-abi-bg/50 rounded-lg p-3 border border-abi-border/50">
                  <p className="hud-label text-[10px] mb-1">RAIDS</p>
                  <p className="text-lg font-bold text-abi-text">{bestSession.raidCount}</p>
                </div>
                <div className="bg-abi-bg/50 rounded-lg p-3 border border-abi-border/50">
                  <p className="hud-label text-[10px] mb-1">ROI</p>
                  <p className="text-lg font-bold text-green-400">{formatPercentage(bestSession.extractionRate)}</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-abi-text-muted text-sm">No sessions recorded</p>
          )}
        </div>
      </div>

      {/* Bottom Row: Economy Overview & Recent Raids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Economy Overview */}
        <div className="hud-card rounded-xl p-5 relative">
          <div className="corner-accent top-left" />
          <div className="corner-accent top-right" />
          <div className="corner-accent bottom-left" />
          <div className="corner-accent bottom-right" />

          <h3 className="hud-heading text-sm mb-4">ECONOMY OVERVIEW</h3>

          <div className="grid grid-cols-2 gap-3">
            <EconomyRow label="LIFETIME PROFIT" value={formatCurrency(analytics.lifetimeProfit)} color="green" />
            <EconomyRow label="AVERAGE RAID NET" value={formatCurrency(analytics.lifetimeProfit / (analytics.totalRaids || 1))} color="white" />
            <EconomyRow label="AMMO SPENDING" value={formatCurrency(totalAmmoSpent)} color="white" />
            <EconomyRow label="CONSUMABLES SPENDING" value={formatCurrency(totalConsumablesSpent)} color="white" />
            <EconomyRow
              label="HIGHEST RAID PROFIT"
              value={bestRaidToday ? formatCurrency(bestRaidToday.netProfit) : '$0'}
              color="green"
            />
            <EconomyRow
              label="WORST RAID LOSS"
              value={worstRaid ? formatCurrency(worstRaid.netProfit) : '$0'}
              color="red"
            />
          </div>
        </div>

        {/* Recent Raids */}
        <div className="hud-card rounded-xl p-5 relative">
          <div className="corner-accent top-left" />
          <div className="corner-accent top-right" />
          <div className="corner-accent bottom-left" />
          <div className="corner-accent bottom-right" />

          <h3 className="hud-heading text-sm mb-4">RECENT RAIDS</h3>

          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {recentRaids.map((raid) => (
              <button
                key={raid.id}
                onClick={() => onRaidClick(raid.id)}
                className="w-full flex items-center justify-between p-3 rounded-lg bg-abi-bg/50 border border-abi-border/50 hover:border-abi-orange/50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <MapPin size={14} className="text-abi-orange" />
                  <div>
                    <p className="text-sm font-medium text-abi-text uppercase">{raid.map}</p>
                    <p className="text-xs text-abi-text-muted">
                      {new Date(raid.timestamp).toLocaleDateString('en-US', {
                        month: 'numeric',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${raid.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatCurrency(raid.netProfit)}
                  </p>
                  <p className="text-xs text-abi-text-muted">{raid.status}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Metric Card Component
function MetricCard({
  label,
  value,
  subValue,
  color = 'white',
  glow = false,
}: {
  label: string;
  value: string;
  subValue?: string;
  color?: 'white' | 'orange' | 'green' | 'red';
  glow?: boolean;
}) {
  const colorClasses = {
    white: 'text-abi-text',
    orange: 'text-abi-orange',
    green: 'text-green-400',
    red: 'text-red-400',
  };

  return (
    <div className={`hud-card rounded-xl p-5 relative ${glow ? 'shadow-[0_0_30px_rgba(0,255,102,0.15)]' : ''}`}>
      <div className="corner-accent top-left" />
      <div className="corner-accent top-right" />
      <div className="corner-accent bottom-left" />
      <div className="corner-accent bottom-right" />

      <p className="hud-label text-[10px] mb-2">{label}</p>
      <p className={`text-3xl font-black hud-number ${colorClasses[color]}`}>{value}</p>
      {subValue && <p className="text-xs text-abi-text-muted mt-1">{subValue}</p>}
    </div>
  );
}

// Economy Row Component
function EconomyRow({
  label,
  value,
  color = 'white',
}: {
  label: string;
  value: string;
  color?: 'white' | 'green' | 'red';
}) {
  const colorClasses = {
    white: 'text-abi-text',
    green: 'text-green-400',
    red: 'text-red-400',
  };

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-abi-bg/30 border border-abi-border/30">
      <p className="hud-label text-[10px]">{label}</p>
      <p className={`text-sm font-semibold ${colorClasses[color]}`}>{value}</p>
    </div>
  );
}