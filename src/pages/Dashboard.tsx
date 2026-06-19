import { useMemo } from 'react';
import {
  Swords,
  TrendingUp,
  DollarSign,
  Package,
  Flame,
  Star,
  Target,
  AlertTriangle,
} from 'lucide-react';
import { StatCard, Card, Badge, ProgressBar } from '../components/ui';
import { getAnalytics, calculateEconomyBreakdown, calculateGearAnalytics } from '../utils/analytics';
import { formatCurrency, formatPercentage } from '../utils/economy';
import type { Page } from '../components/Navigation';

interface DashboardProps {
  onNavigate: (page: Page) => void;
  onRaidClick: (raidId: string) => void;
  onSessionClick: (sessionId: string) => void;
}

export function Dashboard({ onNavigate, onRaidClick, onSessionClick }: DashboardProps) {
  const analytics = useMemo(() => getAnalytics(), []);
  const economyBreakdown = useMemo(() => calculateEconomyBreakdown(), []);
  const gearAnalytics = useMemo(() => calculateGearAnalytics(), []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-abi-text">Dashboard</h1>
          <p className="text-abi-text-muted text-sm mt-1">Your tactical overview</p>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Raids"
          value={analytics.totalRaids}
          icon={<Swords size={24} />}
          className="animate-float"
        />
        <StatCard
          label="Extraction Rate"
          value={formatPercentage(analytics.extractionRate)}
          trend={analytics.extractionRate >= 50 ? 'up' : 'down'}
          trendValue="of raids"
          icon={<Target size={24} />}
        />
        <StatCard
          label="Average ROI"
          value={formatPercentage(analytics.averageROI)}
          subValue="per raid"
          icon={<TrendingUp size={24} />}
          trend={analytics.averageROI >= 0 ? 'up' : 'down'}
        />
        <StatCard
          label="Lifetime Profit"
          value={`$${formatCurrency(analytics.lifetimeProfit)}`}
          icon={<DollarSign size={24} />}
          glow={analytics.lifetimeProfit > 0}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Average Loot Value"
          value={`$${formatCurrency(analytics.averageLootValue)}`}
          icon={<Package size={20} />}
        />
        <StatCard
          label="Total Extracted"
          value={`$${formatCurrency(analytics.totalExtracted)}`}
          icon={<DollarSign size={20} />}
        />
        <StatCard
          label="Dry Streak"
          value={analytics.dryStreak}
          subValue="raids without extraction"
          icon={<Flame size={20} />}
          trend={analytics.dryStreak > 3 ? 'down' : 'neutral'}
        />
        <StatCard
          label="Best Raid Today"
          value={analytics.bestRaidToday ? `$${formatCurrency(analytics.bestRaidToday.netProfit)}` : 'N/A'}
          subValue={analytics.bestRaidToday?.map}
          icon={<Star size={20} />}
          onClick={analytics.bestRaidToday ? () => onRaidClick(analytics.bestRaidToday!.id) : undefined}
        />
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Latest Highlight */}
        <Card className="p-4" hover={!!analytics.latestHighlight}>
          <div className="flex items-center gap-2 mb-3">
            <Star size={16} className="text-abi-orange" />
            <h3 className="text-sm font-semibold text-abi-text-muted uppercase tracking-wider">
              Latest Highlight
            </h3>
          </div>
          {analytics.latestHighlight ? (
            <div
              className="cursor-pointer"
              onClick={() => onRaidClick(analytics.latestHighlight!.raidId)}
            >
              <Badge variant="orange" size="sm">
                {analytics.latestHighlight.category}
              </Badge>
              <p className="text-abi-text mt-2">{analytics.latestHighlight.reason}</p>
            </div>
          ) : (
            <p className="text-abi-text-dim">No highlights yet</p>
          )}
        </Card>

        {/* Best Session */}
        <Card className="p-4" hover={!!analytics.bestSession}>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={16} className="text-abi-orange" />
            <h3 className="text-sm font-semibold text-abi-text-muted uppercase tracking-wider">
              Best Session
            </h3>
          </div>
          {analytics.bestSession ? (
            <div
              className="cursor-pointer"
              onClick={() => onSessionClick(analytics.bestSession!.id)}
            >
              <p className="text-lg font-bold text-abi-text">
                ${formatCurrency(analytics.bestSession.totalProfit)}
              </p>
              <p className="text-sm text-abi-text-muted">
                {analytics.bestSession.raidCount} raids • {formatPercentage(analytics.bestSession.extractionRate)} extract
              </p>
            </div>
          ) : (
            <p className="text-abi-text-dim">No sessions yet</p>
          )}
        </Card>

        {/* Economy Breakdown */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign size={16} className="text-abi-orange" />
            <h3 className="text-sm font-semibold text-abi-text-muted uppercase tracking-wider">
              Spend Breakdown
            </h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-abi-text-muted">Ammo</span>
              <span className="text-sm text-abi-text">${formatCurrency(economyBreakdown.ammoSpent)}</span>
            </div>
            <ProgressBar value={economyBreakdown.ammoSpent} max={economyBreakdown.totalSpend || 1} variant="orange" size="sm" />
            <div className="flex justify-between items-center">
              <span className="text-sm text-abi-text-muted">Consumables</span>
              <span className="text-sm text-abi-text">${formatCurrency(economyBreakdown.consumablesSpent)}</span>
            </div>
            <ProgressBar value={economyBreakdown.consumablesSpent} max={economyBreakdown.totalSpend || 1} variant="info" size="sm" />
            <div className="flex justify-between items-center">
              <span className="text-sm text-abi-text-muted">Gear Lost</span>
              <span className="text-sm text-abi-text">${formatCurrency(economyBreakdown.gearLost)}</span>
            </div>
            <ProgressBar value={economyBreakdown.gearLost} max={economyBreakdown.totalSpend || 1} variant="danger" size="sm" />
          </div>
        </Card>
      </div>

      {/* Gear Analytics */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={16} className="text-abi-orange" />
          <h3 className="text-sm font-semibold text-abi-text-muted uppercase tracking-wider">
            Gear Analytics
          </h3>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          <div>
            <p className="text-xs text-abi-text-muted mb-1">Total Brought</p>
            <p className="text-lg font-bold text-abi-text">
              ${formatCurrency(gearAnalytics.totalGearValueBrought)}
            </p>
          </div>
          <div>
            <p className="text-xs text-abi-text-muted mb-1">Total Lost</p>
            <p className="text-lg font-bold text-red-400">
              ${formatCurrency(gearAnalytics.totalGearValueLost)}
            </p>
          </div>
          <div>
            <p className="text-xs text-abi-text-muted mb-1">Total Rescued</p>
            <p className="text-lg font-bold text-green-400">
              ${formatCurrency(gearAnalytics.totalGearValueRescued)}
            </p>
          </div>
          <div>
            <p className="text-xs text-abi-text-muted mb-1">Recovery Rate</p>
            <p className="text-lg font-bold text-abi-text">
              {formatPercentage(gearAnalytics.recoveryRate)}
            </p>
          </div>
          <div>
            <p className="text-xs text-abi-text-muted mb-1">Best Rescue</p>
            <p className="text-lg font-bold text-green-400">
              {formatPercentage(gearAnalytics.bestRescuePercentage)}
            </p>
          </div>
          <div>
            <p className="text-xs text-abi-text-muted mb-1">Worst Rescue</p>
            <p className="text-lg font-bold text-red-400">
              {formatPercentage(gearAnalytics.worstRescuePercentage)}
            </p>
          </div>
        </div>
      </Card>

      {/* Quick Navigation */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => onNavigate('raids')}
          className="p-4 rounded-xl bg-abi-bg-card border border-abi-border hover:border-abi-orange/50 transition-all duration-200 text-left group"
        >
          <Swords size={24} className="text-abi-text-muted group-hover:text-abi-orange transition-colors" />
          <p className="mt-2 font-semibold text-abi-text">Raid Tracker</p>
          <p className="text-sm text-abi-text-dim">Log and manage raids</p>
        </button>
        <button
          onClick={() => onNavigate('sessions')}
          className="p-4 rounded-xl bg-abi-bg-card border border-abi-border hover:border-abi-orange/50 transition-all duration-200 text-left group"
        >
          <Star size={24} className="text-abi-text-muted group-hover:text-abi-orange transition-colors" />
          <p className="mt-2 font-semibold text-abi-text">Sessions</p>
          <p className="text-sm text-abi-text-dim">Track play sessions</p>
        </button>
        <button
          onClick={() => onNavigate('lootdb')}
          className="p-4 rounded-xl bg-abi-bg-card border border-abi-border hover:border-abi-orange/50 transition-all duration-200 text-left group"
        >
          <Package size={24} className="text-abi-text-muted group-hover:text-abi-orange transition-colors" />
          <p className="mt-2 font-semibold text-abi-text">LootDB</p>
          <p className="text-sm text-abi-text-dim">Item database</p>
        </button>
        <button
          onClick={() => onNavigate('economy')}
          className="p-4 rounded-xl bg-abi-bg-card border border-abi-border hover:border-abi-orange/50 transition-all duration-200 text-left group"
        >
          <TrendingUp size={24} className="text-abi-text-muted group-hover:text-abi-orange transition-colors" />
          <p className="mt-2 font-semibold text-abi-text">Economy</p>
          <p className="text-sm text-abi-text-dim">Detailed analytics</p>
        </button>
      </div>
    </div>
  );
}
