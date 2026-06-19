import { Card } from '../ui';
import { ArrowUpRight, ArrowDownRight, Clock3 } from 'lucide-react';
import type { ReactNode } from 'react';

interface DashboardCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function DashboardCard({ children, className = '', onClick }: DashboardCardProps) {
  return (
    <Card
      className={`hud-card p-5 relative overflow-hidden ${className}`}
      hover={!!onClick}
      onClick={onClick}
    >
      <span className="corner-accent top-left" />
      <span className="corner-accent top-right" />
      <span className="corner-accent bottom-left" />
      <span className="corner-accent bottom-right" />
      {children}
    </Card>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  accent?: string;
  trend?: 'up' | 'down';
  icon?: ReactNode;
}

export function StatCard({ label, value, subValue, accent, trend, icon }: StatCardProps) {
  const trendColor = trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-500' : 'text-abi-text-muted';
  const accentStyle = accent ? accent : 'text-abi-orange';

  return (
    <DashboardCard className="min-h-[160px]">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <p className="hud-label text-[11px] tracking-[0.32em]">{label}</p>
        </div>
        {icon && <div className="text-abi-orange opacity-80">{icon}</div>}
      </div>
      <p className={`hud-number text-4xl font-black ${accentStyle}`}>{value}</p>
      {subValue && <p className="text-sm text-abi-text-muted mt-2">{subValue}</p>}
      {trend && (
        <p className={`text-xs mt-3 ${trendColor} flex items-center gap-1`}>
          {trend === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />} {trend === 'up' ? 'UP' : 'DOWN'}
        </p>
      )}
    </DashboardCard>
  );
}

interface SitrepCardProps {
  status: string;
  timestamp: string;
  viewMode: string;
  onViewChange: (view: string) => void;
}

export function SitrepCard({ status, timestamp, viewMode, onViewChange }: SitrepCardProps) {
  return (
    <DashboardCard className="col-span-full">
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
        <div>
          <p className="hud-label text-xs tracking-[0.28em] mb-2">SITREP</p>
          <h1 className="hud-number text-5xl xl:text-6xl font-black text-abi-text">{status}</h1>
          <p className="text-sm text-abi-text-muted mt-2">Command console active • {timestamp}</p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="hud-chip rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-abi-orange">View: {viewMode}</div>
          <select
            className="bg-[#111118] border border-abi-border text-sm text-abi-text px-3 py-2 rounded-lg focus:outline-none focus:border-abi-orange"
            value={viewMode}
            onChange={(e) => onViewChange(e.target.value)}
          >
            <option value="Ops">OPS</option>
            <option value="Tactical">TACTICAL</option>
            <option value="Field">FIELD</option>
          </select>
        </div>
      </div>
    </DashboardCard>
  );
}

interface HighlightCardProps {
  category: string;
  reason: string;
  profit: string;
  kills: number;
  map: string;
  onInspect?: () => void;
}

export function HighlightCard({ category, reason, profit, kills, map, onInspect }: HighlightCardProps) {
  return (
    <DashboardCard onClick={onInspect} className="min-h-[280px]">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <p className="hud-label text-xs tracking-[0.28em]">LATEST HIGHLIGHT</p>
          <p className="text-sm text-abi-text-muted">Priority intel</p>
        </div>
        <div className="hud-chip rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-abi-orange">
          {category}
        </div>
      </div>
      <p className="text-2xl font-bold text-abi-text leading-tight mb-4">{reason}</p>
      <div className="grid grid-cols-2 gap-3 text-sm text-abi-text-muted">
        <div className="hud-chip rounded-xl p-3">
          <p className="hud-label text-[10px]">PROFIT</p>
          <p className="text-lg font-semibold text-green-400 mt-1">{profit}</p>
        </div>
        <div className="hud-chip rounded-xl p-3">
          <p className="hud-label text-[10px]">KILLS</p>
          <p className="text-lg font-semibold text-abi-text mt-1">{kills}</p>
        </div>
        <div className="hud-chip rounded-xl p-3 col-span-2">
          <p className="hud-label text-[10px]">MAP</p>
          <p className="text-lg font-semibold text-abi-text mt-1">{map}</p>
        </div>
      </div>
    </DashboardCard>
  );
}

interface SessionCardProps {
  label: string;
  totalProfit: string;
  raids: number;
  roi: string;
  onInspect?: () => void;
}

export function SessionCard({ label, totalProfit, raids, roi, onInspect }: SessionCardProps) {
  return (
    <DashboardCard onClick={onInspect} className="min-h-[280px]">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <p className="hud-label text-xs tracking-[0.28em]">{label}</p>
          <p className="text-sm text-abi-text-muted">Top session metrics</p>
        </div>
        <div className="hud-chip rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-abi-orange">SESSION</div>
      </div>
      <p className="hud-number text-4xl font-black text-abi-text mb-4">{totalProfit}</p>
      <div className="space-y-3 text-sm text-abi-text-muted">
        <div className="flex items-center justify-between">
          <span>Raids</span>
          <span className="text-abi-text">{raids}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Extraction</span>
          <span className="text-green-400">{roi}</span>
        </div>
      </div>
    </DashboardCard>
  );
}

interface EconomyCardProps {
  lifetimeProfit: string;
  ammoSpent: string;
  consumablesSpent: string;
  averageNet: string;
  highestProfit: string;
  worstLoss: string;
}

export function EconomyCard({ lifetimeProfit, ammoSpent, consumablesSpent, averageNet, highestProfit, worstLoss }: EconomyCardProps) {
  return (
    <DashboardCard className="min-h-[360px]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="hud-label text-xs tracking-[0.28em]">ECONOMY OVERVIEW</p>
          <p className="text-sm text-abi-text-muted">Financial telemetry</p>
        </div>
        <Clock3 size={18} className="text-abi-orange" />
      </div>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="hud-chip rounded-xl p-4">
          <p className="hud-label text-[10px]">Lifetime Profit</p>
          <p className="hud-number text-2xl font-black text-green-400 mt-2">{lifetimeProfit}</p>
        </div>
        <div className="hud-chip rounded-xl p-4">
          <p className="hud-label text-[10px]">Ammo Spending</p>
          <p className="hud-number text-2xl font-black text-abi-text mt-2">{ammoSpent}</p>
        </div>
        <div className="hud-chip rounded-xl p-4">
          <p className="hud-label text-[10px]">Consumables</p>
          <p className="hud-number text-2xl font-black text-abi-text mt-2">{consumablesSpent}</p>
        </div>
        <div className="hud-chip rounded-xl p-4">
          <p className="hud-label text-[10px]">Avg Raid Net</p>
          <p className="hud-number text-2xl font-black text-abi-text mt-2">{averageNet}</p>
        </div>
        <div className="hud-chip rounded-xl p-4 col-span-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="hud-label text-[10px]">Highest Raid Profit</p>
              <p className="text-xl font-semibold text-green-400 mt-2">{highestProfit}</p>
            </div>
            <div>
              <p className="hud-label text-[10px]">Worst Raid Loss</p>
              <p className="text-xl font-semibold text-red-500 mt-2">{worstLoss}</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardCard>
  );
}

interface RecentRaidCardProps {
  raids: { id: string; date: string; name: string; status: string; profit: number }[];
  onRaidClick: (id: string) => void;
}

export function RecentRaidCard({ raids, onRaidClick }: RecentRaidCardProps) {
  return (
    <DashboardCard className="min-h-[360px] overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="hud-label text-xs tracking-[0.28em]">RECENT RAIDS</p>
          <p className="text-sm text-abi-text-muted">Mission feed</p>
        </div>
        <div className="hud-chip rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-abi-orange">
          Live
        </div>
      </div>
      <div className="space-y-3">
        {raids.map((raid) => (
          <button
            key={raid.id}
            onClick={() => onRaidClick(raid.id)}
            className="w-full text-left rounded-2xl border border-abi-border bg-[#10101a] px-4 py-3 transition hover:border-abi-orange/40 hover:bg-[#14141f]"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-abi-text">{raid.name}</p>
                <p className="text-[11px] text-abi-text-muted uppercase tracking-[0.28em] mt-1">{raid.date}</p>
              </div>
              <div className="text-right">
                <p className={`text-lg font-semibold ${raid.profit >= 0 ? 'text-green-400' : 'text-red-500'}`}>
                  {raid.profit >= 0 ? `+$${raid.profit.toLocaleString()}` : `-$${Math.abs(raid.profit).toLocaleString()}`}
                </p>
                <p className="text-[11px] text-abi-text-muted uppercase tracking-[0.24em] mt-1">{raid.status}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </DashboardCard>
  );
}

interface SectionCardProps {
  title: string;
  children: ReactNode;
}

export function SectionCard({ title, children }: SectionCardProps) {
  return (
    <div className="border-b border-abi-border pb-3 mb-4">
      <p className="hud-label text-[11px] tracking-[0.28em] mb-2">{title}</p>
      {children}
    </div>
  );
}
