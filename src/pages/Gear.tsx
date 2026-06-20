import { useMemo } from 'react';
import { getRaids } from '../utils/storage';
import { calculateGearAnalytics } from '../utils/analytics';
import { formatCurrency, formatPercentage } from '../utils/mockData';

export function Gear() {
  const gearAnalytics = useMemo(() => calculateGearAnalytics(), []);
  const raids = useMemo(() => getRaids(), []);

  const extractedRaids = useMemo(() => {
    return raids.filter(r => r.status === 'EXTRACTED');
  }, [raids]);

  const kiaRaids = useMemo(() => {
    return raids.filter(r => r.status === 'DIED');
  }, [raids]);

  const totalGearValueRescued = gearAnalytics.totalGearValueRescued;
  const totalGearValueLost = gearAnalytics.totalGearValueLost;
  const totalGearValueBrought = gearAnalytics.totalGearValueBrought;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="hud-label text-xs tracking-[0.3em] mb-2">TACTICAL GEAR</p>
          <h1 className="text-4xl lg:text-5xl font-black text-abi-text">Gear Analytics</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="hud-chip rounded-full px-4 py-2 tracking-[0.24em] text-xs uppercase text-abi-orange border border-abi-orange/25">
            Lifetime Stats
          </span>
        </div>
      </div>

      {/* Top Row: 6 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard
          label="GEAR BROUGHT"
          value={formatCurrency(totalGearValueBrought)}
          color="white"
        />
        <MetricCard
          label="GEAR LOST"
          value={formatCurrency(totalGearValueLost)}
          color="red"
        />
        <MetricCard
          label="GEAR RESCUED"
          value={formatCurrency(totalGearValueRescued)}
          color="green"
        />
        <MetricCard
          label="RECOVERY RATE"
          value={`${formatPercentage(gearAnalytics.recoveryRate)}`}
          subValue={`${kiaRaids.length} KIA`}
          color="orange"
        />
        <MetricCard
          label="BEST RESCUE"
          value={`${formatPercentage(gearAnalytics.bestRescuePercentage)}`}
          color="green"
        />
        <MetricCard
          label="WORST RESCUE"
          value={`${formatPercentage(gearAnalytics.worstRescuePercentage)}`}
          color="red"
        />
      </div>

      {/* Bottom: Gear Rescue History */}
      <div className="hud-card rounded-xl p-5 relative">
        <div className="corner-accent top-left" />
        <div className="corner-accent top-right" />
        <div className="corner-accent bottom-left" />
        <div className="corner-accent bottom-right" />

        <div className="flex items-center justify-between mb-6">
          <h3 className="hud-heading text-sm">GEAR RESCUE HISTORY</h3>
          <span className="text-xs text-abi-text-muted uppercase tracking-wider">Lifetime Statistics</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Gains/Extractions */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase tracking-[0.2em] text-abi-text-muted mb-4">Extraction Performance</h4>

            <HistoryRow
              label="TOTAL GEAR VALUE BROUGHT"
              value={formatCurrency(totalGearValueBrought)}
              color="white"
            />
            <HistoryRow
              label="TOTAL GEAR VALUE RESCUED"
              value={formatCurrency(totalGearValueRescued)}
              color="green"
            />
            <HistoryRow
              label="BEST RESCUE PERCENTAGE"
              value={formatPercentage(gearAnalytics.bestRescuePercentage)}
              color="green"
            />
            <HistoryRow
              label="EXTRACTED RAIDS"
              value={extractedRaids.length.toString()}
              color="white"
            />
          </div>

          {/* Right Column: Risk/Failures */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase tracking-[0.2em] text-abi-text-muted mb-4">Risk Assessment</h4>

            <HistoryRow
              label="TOTAL GEAR VALUE LOST"
              value={formatCurrency(totalGearValueLost)}
              color="red"
            />
            <HistoryRow
              label="OVERALL RECOVERY RATE"
              value={formatPercentage(gearAnalytics.recoveryRate)}
              color="orange"
            />
            <HistoryRow
              label="WORST RESCUE PERCENTAGE"
              value={formatPercentage(gearAnalytics.worstRescuePercentage)}
              color="red"
            />
            <HistoryRow
              label="KIA RAIDS"
              value={kiaRaids.length.toString()}
              color="red"
            />
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
}: {
  label: string;
  value: string;
  subValue?: string;
  color?: 'white' | 'orange' | 'green' | 'red';
}) {
  const colorClasses = {
    white: 'text-abi-text',
    orange: 'text-abi-orange',
    green: 'text-green-400',
    red: 'text-red-400',
  };

  return (
    <div className="hud-card rounded-xl p-5 relative">
      <div className="corner-accent top-left" />
      <div className="corner-accent top-right" />
      <div className="corner-accent bottom-left" />
      <div className="corner-accent bottom-right" />

      <p className="hud-label text-[10px] mb-2">{label}</p>
      <p className={`text-2xl font-black hud-number ${colorClasses[color]}`}>{value}</p>
      {subValue && <p className="text-xs text-abi-text-muted mt-1">{subValue}</p>}
    </div>
  );
}

// History Row Component
function HistoryRow({
  label,
  value,
  color = 'white',
}: {
  label: string;
  value: string;
  color?: 'white' | 'green' | 'red' | 'orange';
}) {
  const colorClasses = {
    white: 'text-abi-text',
    green: 'text-green-400',
    red: 'text-red-400',
    orange: 'text-abi-orange',
  };

  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-abi-bg/30 border border-abi-border/30">
      <p className="hud-label text-[10px] flex-1">{label}</p>
      <p className={`text-sm font-bold ${colorClasses[color]}`}>{value}</p>
    </div>
  );
}