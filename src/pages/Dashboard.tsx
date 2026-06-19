import { useMemo, useState } from 'react';
import { Radar, Command, ShieldCheck, ArrowRight, ArrowLeft, Cpu } from 'lucide-react';
import { getAnalytics, calculateEconomyBreakdown } from '../utils/analytics';
import { getRaids, getRaidById } from '../utils/storage';
import { formatCurrency, formatPercentage } from '../utils/economy';
import type { Page } from '../components/Navigation';
import {
  StatCard,
  SitrepCard,
  HighlightCard,
  SessionCard,
  EconomyCard,
  RecentRaidCard,
} from '../components/dashboard/DashboardWidgets';

interface DashboardProps {
  onNavigate: (page: Page) => void;
  onRaidClick: (raidId: string) => void;
  onSessionClick: (sessionId: string) => void;
}

export function Dashboard({ onRaidClick, onSessionClick }: DashboardProps) {
  const analytics = useMemo(() => getAnalytics(), []);
  const economyBreakdown = useMemo(() => calculateEconomyBreakdown(), []);
  const allRaids = useMemo(() => getRaids(), []);
  const recentRaids = useMemo(() =>
    allRaids
      .slice()
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 6)
      .map((raid) => ({
        id: raid.id,
        date: new Date(raid.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        name: raid.map,
        status: raid.status,
        profit: raid.netProfit,
      })),
    [allRaids]
  );

  const highlightRaid = analytics.latestHighlight ? getRaidById(analytics.latestHighlight.raidId) : null;
  const bestSession = analytics.bestSession;
  const timestamp = new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  const [viewMode, setViewMode] = useState('OPS');

  const averageRaidNet = analytics.totalRaids > 0
    ? analytics.lifetimeProfit / analytics.totalRaids
    : 0;

  const highestProfit = allRaids.reduce((max, raid) => Math.max(max, raid.netProfit), 0);
  const worstLoss = allRaids.reduce((min, raid) => Math.min(min, raid.netProfit), 0);

  return (
    <div className="space-y-6 dashboard-shell">
      <SitrepCard
        status="EXTRACTION READY"
        timestamp={timestamp}
        viewMode={viewMode}
        onViewChange={setViewMode}
      />

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Raids"
          value={analytics.totalRaids}
          subValue="Operations logged"
          accent="text-abi-orange"
          icon={<Radar size={24} />}
        />
        <StatCard
          label="Extraction Rate"
          value={`${formatPercentage(analytics.extractionRate)}`}
          subValue="Successful extractions"
          trend={analytics.extractionRate >= 50 ? 'up' : 'down'}
          icon={<ShieldCheck size={24} />}
        />
        <StatCard
          label="Lifetime Profit"
          value={`$${formatCurrency(analytics.lifetimeProfit)}`}
          subValue="Cumulative net"
          accent="text-green-400"
          icon={<Command size={24} />}
        />
        <StatCard
          label="Average ROI"
          value={`${formatPercentage(analytics.averageROI)}`}
          subValue="Per raid"
          trend={analytics.averageROI >= 0 ? 'up' : 'down'}
          icon={<Cpu size={24} />}
        />
        <StatCard
          label="Avg Loot Value"
          value={`$${formatCurrency(analytics.averageLootValue)}`}
          subValue="Per extraction"
          icon={<ArrowRight size={24} />}
        />
        <StatCard
          label="Best Raid Today"
          value={analytics.bestRaidToday ? `$${formatCurrency(analytics.bestRaidToday.netProfit)}` : 'N/A'}
          subValue={analytics.bestRaidToday?.map || 'No raid'}
          accent={analytics.bestRaidToday ? 'text-green-400' : 'text-abi-text-muted'}
          icon={<StarIcon />}
        />
        <StatCard
          label="Dry Streak"
          value={analytics.dryStreak}
          subValue="Raids without extraction"
          trend={analytics.dryStreak > 3 ? 'down' : 'up'}
          icon={<ArrowLeft size={24} />}
        />
        <StatCard
          label="Extracted"
          value={`$${formatCurrency(analytics.totalExtracted)}`}
          subValue="Loot value extracted"
          icon={<PackageIcon />}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2">
          <HighlightCard
            category={analytics.latestHighlight?.category.toUpperCase() || 'NONE'}
            reason={analytics.latestHighlight?.reason || 'No highlight events available.'}
            profit={highlightRaid ? `$${formatCurrency(highlightRaid.netProfit)}` : '$0'}
            kills={highlightRaid?.kills ?? 0}
            map={highlightRaid?.map ?? 'Unknown'}
            onInspect={() => highlightRaid && onRaidClick(highlightRaid.id)}
          />
        </div>
        <SessionCard
          label="Best Session"
          totalProfit={bestSession ? `$${formatCurrency(bestSession.totalProfit)}` : 'N/A'}
          raids={bestSession?.raidCount ?? 0}
          roi={bestSession ? `${formatPercentage(bestSession.extractionRate)}` : '0%'}
          onInspect={() => bestSession && onSessionClick(bestSession.id)}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2">
          <EconomyCard
            lifetimeProfit={`$${formatCurrency(analytics.lifetimeProfit)}`}
            ammoSpent={`$${formatCurrency(economyBreakdown.ammoSpent)}`}
            consumablesSpent={`$${formatCurrency(economyBreakdown.consumablesSpent)}`}
            averageNet={`$${formatCurrency(averageRaidNet)}`}
            highestProfit={`$${formatCurrency(highestProfit)}`}
            worstLoss={`$${formatCurrency(Math.abs(worstLoss))}`}
          />
        </div>
        <RecentRaidCard raids={recentRaids} onRaidClick={onRaidClick} />
      </div>
    </div>
  );
}

function StarIcon() {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-abi-orange"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" fill="currentColor"/></svg>;
}

function PackageIcon() {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-abi-orange"><path d="M3 7l9-4 9 4-9 4-9-4zm0 2.18l9 4 9-4V17a2 2 0 0 1-2 2h-2v-6.5l-5 2.22-5-2.22V19H5a2 2 0 0 1-2-2V9.18z" fill="currentColor"/></svg>;
}
