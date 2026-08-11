import { useCallback, useMemo, useState, type ReactNode } from 'react';
import {
  Activity,
  CalendarDays,
  ChevronRight,
  Clock3,
  Crosshair,
  FileText,
  MapPin,
  Star,
  TrendingUp,
} from 'lucide-react';
import { useRoiRaids, useHighlights, useAggregatedSessions, useDashboardAnalytics } from '../hooks/useStorageQuery';
import { formatCurrency, formatNumber, formatPercentage } from '../utils/mockData';
import { formatDuration } from '../utils/economy';
import { calculateProfitCurve } from '../utils/analytics';
import { generateQuickRecommendations, MIN_OPERATIONAL_HISTORY } from '../utils/intelligence';
import { RecommendationList } from '../components/intelligence/RecommendationCard';
import { InteractiveCumulativeChart } from '../components/charts/InteractiveCumulativeChart';
import { Badge, Caption, DataValue, DisplayValue, MapName, MetaLabel, RoiViewToggle, StatusBadge, type Tone } from '../components/ui';
import {
  AnimatedStatValue,
  AnimatedBar,
  RevealSection,
  StaggerContainer,
  StaggerItem,
  StaggerList,
  AnimatedEmptyStateIcon,
} from '../components/motion';
import type { ProfitCurvePoint } from '../types';

/** Recent operations rows shown without scroll (fits ~340px panel body). */
const RECENT_OPERATIONS_LIMIT = 5;
interface OverviewProps {
  onRaidClick: (raidId: string) => void;
  onSessionNavigate?: (sessionId: string) => void;
}

function raidHasRedsCollection(raid: {
  redItemFound?: boolean;
  highlightCategory?: string;
  highlightReason?: string;
  loot: { rarity?: string }[];
}): boolean {
  if (typeof raid.redItemFound === 'boolean') return raid.redItemFound;
  if (raid.highlightCategory === 'rare') return true;
  if (raid.highlightReason?.toLowerCase().includes('red item')) return true;
  return raid.loot.some((item) => item.rarity === 'red');
}

export function Overview({ onRaidClick, onSessionNavigate }: OverviewProps) {
  const analytics = useDashboardAnalytics();
  const raids = useRoiRaids();
  const highlights = useHighlights();
  const sessions = useAggregatedSessions();

  const recentRaids = useMemo(() => {
    return [...raids]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, RECENT_OPERATIONS_LIMIT);
  }, [raids]);

  const profitCurve = useMemo(() => calculateProfitCurve(raids), [raids]);

  const operationalBrief = useMemo(() => {
    const sorted = [...raids].sort((a, b) => b.timestamp - a.timestamp);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayRaids = sorted.filter((raid) => raid.timestamp >= todayStart.getTime());
    const todayProfit = todayRaids.reduce((total, raid) => total + raid.netProfit, 0);
    const extractedToday = todayRaids.filter((raid) => raid.status === 'EXTRACTED').length;
    const extractionRateToday = todayRaids.length > 0
      ? (extractedToday / todayRaids.length) * 100
      : 0;

    const mapPerformance = new Map<string, { raids: number; profit: number }>();
    raids.forEach((raid) => {
      const current = mapPerformance.get(raid.map) ?? { raids: 0, profit: 0 };
      current.raids += 1;
      current.profit += raid.netProfit;
      mapPerformance.set(raid.map, current);
    });
    const bestMap = Array.from(mapPerformance.entries())
      .filter(([, value]) => value.raids > 0)
      .sort(([, a], [, b]) => (b.profit / b.raids) - (a.profit / a.raids))[0]?.[0] ?? 'Awaiting intel';

    let extractionStreak = 0;
    for (const raid of sorted) {
      if (raid.status !== 'EXTRACTED') break;
      extractionStreak += 1;
    }

    const riskLevel = analytics.dryStreak >= 3
      ? 'High'
      : analytics.averageROI < 0
        ? 'Elevated'
        : 'Controlled';

    const opsPerDeployment = sessions.length > 0
      ? raids.length / sessions.length
      : 0;

    return {
      todayProfit,
      todayRaidCount: todayRaids.length,
      extractionRateToday,
      bestMap,
      extractionStreak,
      riskLevel,
      opsPerDeployment,
      deploymentCount: sessions.length,
    };
  }, [analytics.averageROI, analytics.dryStreak, raids, sessions.length]);

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

  const recommendations = useMemo(() => generateQuickRecommendations(raids), [raids]);

  const careerOutcomeSummary = useMemo(() => {
    if (analytics.totalRaids === 0) {
      return {
        extracted: 0,
        notExtracted: 0,
        detail: 'No operations recorded yet',
        streakNote: null as string | null,
        streakTone: 'secondary' as Tone,
      };
    }
    const extracted = raids.filter((raid) => raid.status === 'EXTRACTED').length;
    const notExtracted = analytics.totalRaids - extracted;
    const detail = `${formatNumber(extracted)} extracted · ${formatNumber(notExtracted)} not extracted`;
    const streakNote =
      analytics.dryStreak > 0
        ? `Latest ${formatNumber(analytics.dryStreak)} without extract`
        : operationalBrief.extractionStreak > 0
          ? `${formatNumber(operationalBrief.extractionStreak)} consecutive extracts`
          : null;
    const streakTone: Tone =
      analytics.dryStreak > 0
        ? 'warning'
        : operationalBrief.extractionStreak > 0
          ? 'positive'
          : 'secondary';
    return { extracted, notExtracted, detail, streakNote, streakTone };
  }, [
    analytics.dryStreak,
    analytics.totalRaids,
    operationalBrief.extractionStreak,
    raids,
  ]);

  const lastUpdate = recentRaids[0]
    ? new Date(recentRaids[0].timestamp).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'No raids yet';

  return (
    <div>
      <RevealSection immediate>
        <header className="hud-card overview-panel-static overview-panel-primary px-4 py-3 sm:px-5 sm:py-3.5 relative overflow-hidden">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px overflow-hidden" aria-hidden>
            <div className="h-full w-full bg-abi-orange/40 animate-scan-line-once" />
          </div>
          <div className="corner-accent top-left" />
          <div className="corner-accent top-right" />
          <div className="corner-accent bottom-left" />
          <div className="corner-accent bottom-right" />
          <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <MetaLabel tone="accent" className="block mb-1.5">Tactical overview · Active terminal</MetaLabel>
              <h1 className="type-display-xl text-primary">Mission Control</h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <Caption tone="secondary" className="inline-flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-abi-success" aria-hidden />
                  Live · Updated {lastUpdate}
                </Caption>
                <Caption tone="secondary" className="inline-flex items-center gap-1.5">
                  <Activity size={12} aria-hidden />
                  {formatNumber(analytics.totalRaids)} operations logged
                </Caption>
              </div>
            </div>
            <div className="border-l-0 border-abi-border pt-2 lg:border-l lg:pl-5 lg:pt-0">
              <RoiViewToggle className="mb-3 lg:justify-end" />
              <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                <StatusReadout
                  label="Current operation"
                  value={recentRaids[0]?.map ?? 'Standby'}
                  tone="accent"
                />
                <StatusReadout
                  label="Extraction streak"
                  value={`${operationalBrief.extractionStreak} clear`}
                  tone={operationalBrief.extractionStreak > 0 ? 'positive' : 'secondary'}
                />
              </div>
            </div>
          </div>
        </header>
      </RevealSection>

      <RevealSection immediate delay={0.06}>
      <section aria-label="Commander performance" className="mt-3 flex flex-col gap-3">
        <StaggerContainer className="contents" immediate>
          <StaggerItem>
            <PrimaryMetric
              value={analytics.lifetimeProfit}
              tone={analytics.lifetimeProfit >= 0 ? 'positive' : 'negative'}
              points={profitCurve.points}
              minY={profitCurve.minY}
              maxY={profitCurve.maxY}
              onRaidClick={onRaidClick}
            />
          </StaggerItem>
          <StaggerItem>
            <div className="hud-card overview-panel-primary overview-performance-cluster relative overflow-hidden p-3 sm:p-4">
              <div className="corner-accent top-left" />
              <div className="corner-accent top-right" />
              <div className="corner-accent bottom-left" />
              <div className="corner-accent bottom-right" />
              <MetaLabel tone="accent" className="mb-3 block">Performance snapshot</MetaLabel>
              <div className="grid min-h-[168px] grid-cols-1 gap-0 lg:grid-cols-2 lg:items-stretch lg:divide-x lg:divide-abi-border/60">
                <SecondaryMetric
                  hero
                  value={analytics.averageROI}
                  tone={analytics.averageROI >= 0 ? 'positive' : 'negative'}
                  detail={analytics.averageROI >= 0 ? 'Sustained gain profile' : 'Review loadout spend'}
                />
                <PerformanceSidecar
                  extractionRate={analytics.extractionRate}
                  lootFromExtracted={analytics.totalExtracted}
                  operationsLogged={analytics.totalRaids}
                  outcomeDetail={careerOutcomeSummary.detail}
                  streakNote={careerOutcomeSummary.streakNote}
                  streakTone={careerOutcomeSummary.streakTone}
                />
              </div>
            </div>
          </StaggerItem>
        </StaggerContainer>
      </section>
      </RevealSection>

      <RevealSection delay={0.04}>
      <section aria-labelledby="commander-brief" className="mt-6">        <Panel
          id="commander-brief"
          title="Commander brief"
          subtitle="Current operational readout"
          variant="primary"
          className="overflow-hidden"
        >
          <div className="grid md:grid-cols-3 md:divide-x md:divide-abi-border/60">
            <BriefBand label="Today" icon={<TrendingUp size={14} />}>
              <BriefReadout
                label="Profit"
                value={formatCurrency(operationalBrief.todayProfit)}
                tone={operationalBrief.todayProfit >= 0 ? 'positive' : 'negative'}
                detail={operationalBrief.todayRaidCount > 0 ? `${operationalBrief.todayRaidCount} raids today` : 'No raids today'}
              />
              <BriefReadout
                label="Extract rate"
                value={formatPercentage(operationalBrief.extractionRateToday)}
                tone={operationalBrief.extractionRateToday >= 50 ? 'positive' : 'warning'}
                detail="Current day rate"
              />
            </BriefBand>
            <BriefBand label="Field" icon={<MapPin size={14} />}>
              <BriefReadout label="Best map" value={operationalBrief.bestMap} detail="By average net" />
              <BriefReadout
                label="Risk level"
                value={operationalBrief.riskLevel}
                tone={operationalBrief.riskLevel === 'Controlled' ? 'positive' : operationalBrief.riskLevel === 'Elevated' ? 'warning' : 'negative'}
                detail="From ROI and streak"
              />
            </BriefBand>
            <BriefBand label="Tempo" icon={<Clock3 size={14} />}>
              <BriefReadout
                label="Current streak"
                value={`${operationalBrief.extractionStreak} extracts`}
                tone={operationalBrief.extractionStreak > 0 ? 'positive' : 'secondary'}
                detail={operationalBrief.extractionStreak > 0 ? 'Clear run active' : 'Re-establish momentum'}
              />
              <BriefReadout
                label="Ops / deployment"
                value={
                  operationalBrief.deploymentCount > 0
                    ? operationalBrief.opsPerDeployment.toFixed(1)
                    : 'No data'
                }
                detail={
                  operationalBrief.deploymentCount > 0
                    ? `${operationalBrief.deploymentCount} deployments logged`
                    : 'Awaiting session data'
                }
              />
            </BriefBand>
          </div>
        </Panel>
      </section>
      </RevealSection>

      <RevealSection delay={0.06}>
      <section className="mt-5 grid grid-cols-1 items-stretch gap-3 xl:grid-cols-[1.85fr_0.75fr]">
        <StaggerContainer className="contents xl:contents" immediate>
          <StaggerItem className="flex h-full min-h-0 flex-col">
            <Panel title="Latest operation" subtitle="Highlighted field dossier" variant="primary" className="flex h-full min-h-0 flex-1 flex-col">
          {latestHighlightRaid ? (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="flex flex-wrap items-center gap-3 border-b border-abi-border/70 pb-4">
                <Badge variant="orange" className="inline-flex items-center gap-1">
                  <Star size={10} />
                  Highlight
                </Badge>
                <Caption tone="secondary">Dossier confirmed</Caption>
                <span className="overview-dossier-date ml-auto type-data text-primary">
                  {new Date(latestHighlightRaid.timestamp).toLocaleDateString('en-US')}
                </span>
              </div>
              <div className="grid min-h-0 flex-1 gap-5 py-4 md:grid-cols-[1.1fr_0.9fr] md:items-stretch">
                <div className="flex min-h-0 flex-col justify-between">
                  <div>
                    <MetaLabel className="block mb-2">Operation theater</MetaLabel>
                    <p className="type-heading text-primary text-[0.9375rem] sm:text-base">
                      <MapName className="inline">{latestHighlightRaid.map}</MapName>
                      <span className="text-muted font-normal"> : </span>
                      <span className="text-secondary font-medium">{latestHighlightRaid.mode} mode</span>
                    </p>
                  </div>
                  <div className="mt-6">
                    <MetaLabel tone="accent" className="overview-net-result-label block mb-2">
                      Net result
                    </MetaLabel>
                    <DisplayValue
                      size="xl"
                      tone={latestHighlightRaid.netProfit >= 0 ? 'positive' : 'negative'}
                    >
                      {formatCurrency(latestHighlightRaid.netProfit)}
                    </DisplayValue>
                  </div>
                </div>
                <div className="grid h-full min-h-0 grid-cols-2 grid-rows-2 gap-px border border-abi-border bg-abi-border">
                  <DossierMetric
                    label="Kills"
                    value={String(latestHighlightRaid.kills)}
                    className="overview-dossier-stat-cell"
                  />
                  <div className="overview-dossier-stat-cell">
                    <MetaLabel className="block mb-2">Reds collections</MetaLabel>
                    {raidHasRedsCollection(latestHighlightRaid) ? (
                      <Badge variant="success">Brought out</Badge>
                    ) : (
                      <Badge variant="danger">Not found</Badge>
                    )}
                  </div>
                  <DossierMetric
                    label="ROI"
                    value={formatPercentage(latestHighlightRaid.roi)}
                    tone={latestHighlightRaid.roi >= 0 ? 'positive' : 'negative'}
                    className="overview-dossier-stat-cell"
                  />
                  <div className="overview-dossier-stat-cell">
                    <MetaLabel className="block mb-2">Extraction</MetaLabel>
                    <StatusBadge status={latestHighlightRaid.status} />
                  </div>
                </div>
              </div>
              <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-abi-border/70 pt-4">
                <Caption tone="secondary">
                  Reason: {latestHighlight?.reason ?? latestHighlightRaid.highlightReason ?? 'Notable operation'}
                </Caption>
                <button
                  type="button"
                  onClick={() => onRaidClick(latestHighlightRaid.id)}
                  className="inline-flex items-center gap-1.5 type-caption text-accent hover:text-primary transition-colors"
                >
                  Inspect operation <ChevronRight size={13} />
                </button>
              </div>
            </div>
          ) : (
            <TacticalEmptyState
              icon={<FileText size={30} />}
              title="No operation dossier"
              description="Complete raids with decisive profit, kills, or rare loot to generate your first highlighted operation."
            />
          )}
        </Panel>
          </StaggerItem>

          <StaggerItem className="flex h-full min-h-0 flex-col">
            <Panel title="Best session" subtitle="Peak operational window" variant="flat" className="flex h-full min-h-0 flex-1 flex-col">
          {bestSession ? (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="flex flex-wrap items-center gap-3 border-b border-abi-border/70 pb-4">
                <Badge variant="success" className="inline-flex items-center gap-1">
                  <TrendingUp size={10} />
                  Top session
                </Badge>
                <Caption tone="secondary">{new Date(bestSession.startTime).toLocaleDateString('en-US')}</Caption>
              </div>
              <div className="py-4">
                <MetaLabel className="block mb-2">Total profit</MetaLabel>
                <DisplayValue tone={bestSession.totalProfit >= 0 ? 'positive' : 'negative'}>
                  {formatCurrency(bestSession.totalProfit)}
                </DisplayValue>
              </div>
              <div className="grid grid-cols-2 gap-px border border-abi-border bg-abi-border">
                <DossierMetric label="Raids" value={String(bestSession.raidCount)} />
                <DossierMetric label="Extract" value={formatPercentage(bestSession.extractionRate)} tone="positive" />
                <DossierMetric label="Investment" value={formatCurrency(bestSession.totalInvestment)} />
                <DossierMetric
                  label="Average ROI"
                  value={formatPercentage(bestSession.totalInvestment > 0
                    ? (bestSession.totalProfit / bestSession.totalInvestment) * 100
                    : 0)}
                  tone={bestSession.totalProfit >= 0 ? 'positive' : 'negative'}
                />
              </div>
              <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-abi-border/70 pt-4">
                <Caption tone="muted">
                  Session window: {formatDuration(Math.round((bestSession.endTime - bestSession.startTime) / 60000))}
                </Caption>
                {onSessionNavigate && (
                  <button
                    type="button"
                    onClick={() => onSessionNavigate(bestSession.id)}
                    className="inline-flex items-center gap-1.5 type-caption text-accent hover:text-primary transition-colors"
                  >
                    Inspect session <ChevronRight size={13} />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <TacticalEmptyState
              icon={<CalendarDays size={30} />}
              title="Session data pending"
              description="Complete connected raid operations to establish a session record."
            />
          )}
            </Panel>
          </StaggerItem>
        </StaggerContainer>
      </section>
      </RevealSection>

      <RevealSection delay={0.08}>
      <section className="mt-5 grid grid-cols-1 gap-3 xl:grid-cols-[0.85fr_1.5fr]">
        <Panel title="Economy snapshot" subtitle="Resource allocation" variant="standard">          <div>
            <div className="space-y-4">
            <EconomyIndicator
              label="Ammo allocation"
              value={totalAmmoSpent}
              total={totalAmmoSpent + totalConsumablesSpent}
              tone="accent"
            />
            <EconomyIndicator
              label="Consumables allocation"
              value={totalConsumablesSpent}
              total={totalAmmoSpent + totalConsumablesSpent}
              tone="warning"
            />
            </div>
            <div className="mt-6 grid grid-cols-2 gap-px border border-abi-border bg-abi-border">
              <DossierMetric
                label="Average net"
                value={formatCurrency(analytics.lifetimeProfit / (analytics.totalRaids || 1))}
                tone={analytics.lifetimeProfit >= 0 ? 'positive' : 'negative'}
              />
              <DossierMetric
                label="Best today"
                value={bestRaidToday ? formatCurrency(bestRaidToday.netProfit) : '$0'}
                tone={bestRaidToday && bestRaidToday.netProfit >= 0 ? 'positive' : 'secondary'}
              />
              <DossierMetric
                label="Average loot"
                value={formatCurrency(analytics.averageLootValue)}
              />
              <DossierMetric
                label="Worst operation"
                value={worstRaid ? formatCurrency(worstRaid.netProfit) : '$0'}
                tone={worstRaid && worstRaid.netProfit < 0 ? 'negative' : 'secondary'}
              />
            </div>
          </div>
        </Panel>

        <Panel
          title="Recent operations"
          subtitle={
            raids.length > RECENT_OPERATIONS_LIMIT
              ? `Latest ${RECENT_OPERATIONS_LIMIT} of ${formatNumber(raids.length)} logged`
              : 'Latest field log'
          }
          variant="standard"
        >
          {recentRaids.length === 0 ? (
            <TacticalEmptyState
              icon={<MapPin size={30} />}
              title="Operation log is empty"
              description="Log your first raid to populate mission control with field intelligence."
            />
          ) : (
            <div>
              <StaggerList>
              {recentRaids.map((raid) => (
                <button
                  key={raid.id}
                  type="button"
                  onClick={() => onRaidClick(raid.id)}
                  className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-abi-border/70 px-1 py-3 text-left last:border-b-0 hover:bg-abi-bg-hover/60 transition-colors"
                >
                  <span className="grid h-8 w-8 place-items-center border border-abi-border bg-abi-bg">
                    <Crosshair size={14} className={raid.status === 'EXTRACTED' ? 'text-positive' : 'text-negative'} />
                  </span>
                  <div className="min-w-0">
                    <MapName className="block truncate group-hover:text-accent transition-colors">
                      {raid.map}
                    </MapName>
                    <Caption className="mt-[var(--space-value-meta)] block">
                      {raid.mode} · {new Date(raid.timestamp).toLocaleDateString('en-US')}
                    </Caption>
                  </div>
                  <div className="min-w-[115px] text-right">
                    <DataValue tone={raid.netProfit >= 0 ? 'positive' : 'negative'}>
                      {formatCurrency(raid.netProfit)}
                    </DataValue>
                    <span className="mt-[var(--space-value-meta)] flex justify-end">
                      <StatusBadge status={raid.status} />
                    </span>
                  </div>
                </button>
              ))}
              </StaggerList>
            </div>          )}
        </Panel>
      </section>
      </RevealSection>

      <RevealSection delay={0.1}>
      <section aria-labelledby="quick-recommendations" className="mt-4">        <Panel
          id="quick-recommendations"
          title="Quick recommendations"
          subtitle="Deterministic guidance from field data"
          variant="standard"
        >
          <RecommendationList
            recommendations={recommendations}
            hasEnoughHistory={raids.length >= MIN_OPERATIONAL_HISTORY}
            insufficientDescription={`Log at least ${MIN_OPERATIONAL_HISTORY} operations to activate tactical guidance.`}
          />
        </Panel>
      </section>
      </RevealSection>
    </div>
  );
}
function Panel({
  id,
  title,
  subtitle,
  children,
  className = '',
  variant = 'standard',
}: {
  id?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  variant?: 'primary' | 'standard' | 'flat';
}) {
  const surfaceClass = variant === 'flat'
    ? 'overview-panel-flat'
    : `hud-card overview-panel-static ${variant === 'primary' ? 'overview-panel-primary' : ''}`;
  const paddingClass = variant === 'flat' ? 'p-4' : 'p-5';

  return (
    <div className={`${surfaceClass} ${paddingClass} relative ${className}`}>
      {variant === 'primary' && (
        <>
          <div className="corner-accent top-left" />
          <div className="corner-accent top-right" />
          <div className="corner-accent bottom-left" />
          <div className="corner-accent bottom-right" />
        </>
      )}
      <div className="overview-panel-header mb-4 flex shrink-0 flex-wrap items-baseline gap-x-3 gap-y-1 pb-3">
        <h2 id={id} className="type-heading text-primary">{title}</h2>
        {subtitle && <Caption tone="muted">{subtitle}</Caption>}
      </div>
      {children}
    </div>
  );
}

function StatusReadout({
  label,
  value,
  tone = 'secondary',
}: {
  label: string;
  value: string;
  tone?: Tone;
}) {
  return (
    <div>
      <MetaLabel className="block mb-1">{label}</MetaLabel>
      <DataValue tone={tone}>{value}</DataValue>
    </div>
  );
}

function SecondaryMetric({
  value,
  tone,
  detail,
  hero = false,
}: {
  value: number;
  tone: Tone;
  detail: string;
  hero?: boolean;
}) {
  if (hero) {
    return (
      <div className="relative flex h-full min-h-[168px] flex-col justify-between px-4 py-3 sm:px-5 sm:py-4">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <TrendingUp size={14} className="text-accent shrink-0" aria-hidden />
            <MetaLabel tone="accent">Average ROI</MetaLabel>
          </div>
          <DisplayValue size="xl" tone={tone}>
            <AnimatedStatValue value={value} format={formatPercentage} />
          </DisplayValue>
        </div>
        <Caption tone="secondary" className="mt-4 block uppercase">{detail}</Caption>
      </div>
    );
  }

  return (
    <div className="hud-card overview-panel-static h-full min-h-[156px] p-4 sm:p-5">
      <div className="flex h-full flex-col justify-between">
        <div>
          <MetaLabel className="block mb-2">Average ROI</MetaLabel>
          <DisplayValue size="l" tone={tone}>
            <AnimatedStatValue value={value} format={formatPercentage} />
          </DisplayValue>
        </div>
        <Caption tone="secondary" className="mt-4 block uppercase">{detail}</Caption>
      </div>
    </div>
  );
}

function PerformanceSidecar({
  extractionRate,
  lootFromExtracted,
  operationsLogged,
  outcomeDetail,
  streakNote,
  streakTone,
}: {
  extractionRate: number;
  lootFromExtracted: number;
  operationsLogged: number;
  outcomeDetail: string;
  streakNote: string | null;
  streakTone: Tone;
}) {
  const extractTone: Tone =
    extractionRate >= 50 ? 'positive' : extractionRate > 0 ? 'warning' : 'secondary';
  const barWidth = Math.max(0, Math.min(extractionRate, 100));

  return (
    <div className="overview-panel-flat flex h-full min-h-[168px] flex-col justify-center px-4 py-3 sm:px-5 sm:py-4 lg:rounded-none">
      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <MetaLabel>Extraction rate</MetaLabel>
          <DataValue tone={extractTone} className="text-base">
            {formatPercentage(extractionRate)}
          </DataValue>
        </div>
        <div className="mt-2 h-px w-full bg-abi-border relative overflow-hidden">
          <AnimatedBar
            widthPercent={barWidth}
            className={`absolute inset-y-0 left-0 h-px ${
              extractTone === 'positive' ? 'bg-abi-success' : extractTone === 'warning' ? 'bg-abi-warning' : 'bg-abi-border'
            }`}
          />
        </div>
        <Caption tone="muted" className="mt-2 block uppercase">
          {formatCurrency(lootFromExtracted)} loot from extracted ops
        </Caption>
      </div>

      <div className="my-3 border-t border-abi-border/70" />

      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <MetaLabel>Operations logged</MetaLabel>
          <DataValue tone="primary" className="text-base">
            {formatNumber(operationsLogged)}
          </DataValue>
        </div>
        <Caption tone="muted" className="mt-1.5 block uppercase">{outcomeDetail}</Caption>
        {streakNote && (
          <div className="mt-2">
            <Badge
              variant={
                streakTone === 'positive'
                  ? 'success'
                  : streakTone === 'warning'
                    ? 'warning'
                    : 'default'
              }
              size="sm"
            >
              {streakNote}
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}

function PrimaryMetric({
  value,
  tone,
  points,
  minY,
  maxY,
  onRaidClick,
}: {
  value: number;
  tone: Tone;
  points: ProfitCurvePoint[];
  minY: number;
  maxY: number;
  onRaidClick: (raidId: string) => void;
}) {
  const [activePoint, setActivePoint] = useState<ProfitCurvePoint | null>(null);
  const handleActiveChange = useCallback((point: ProfitCurvePoint | null) => {
    setActivePoint(point);
  }, []);

  return (
    <div className="hud-card overview-panel-static overview-panel-primary overview-lifetime-profit relative min-h-[312px] w-full overflow-hidden border-abi-orange/35 p-5 sm:p-6">
      <div className="corner-accent top-left" />
      <div className="corner-accent top-right" />
      <div className="corner-accent bottom-left" />
      <div className="corner-accent bottom-right" />
      <div className="relative z-10 grid h-full min-h-[280px] grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:items-stretch">
        <div className="flex min-w-0 flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <MetaLabel tone="accent" className="block mb-2">Lifetime profit</MetaLabel>
                <DisplayValue size="xl" tone={tone}>
                  <AnimatedStatValue
                    value={formatCurrency(value)}
                    toneClass={tone === 'positive' ? 'text-positive' : tone === 'negative' ? 'text-negative' : undefined}
                  />
                </DisplayValue>
              </div>
              <TrendingUp size={20} className="shrink-0 text-accent" />
            </div>

            <div
              className={`overview-curve-readout mt-4 border px-3 py-2.5 transition-colors ${
                activePoint
                  ? 'border-abi-orange/40 bg-abi-orange/5'
                  : 'border-abi-border/70 bg-abi-bg/40'
              }`}
              role="status"
              aria-live="polite"
            >
              {activePoint ? (
                <>
                  <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <span className="type-label text-accent">{activePoint.label}</span>
                    <span className="type-caption text-muted">
                      {new Date(activePoint.timestamp).toLocaleDateString('en-US')}
                    </span>
                  </div>
                  <p className="type-heading text-primary text-[0.8125rem]">
                    {activePoint.map}
                    <span className="text-muted font-normal"> · </span>
                    <span className="text-secondary font-medium">{activePoint.mode}</span>
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
                    <div>
                      <span className="type-label text-muted block">Raid net</span>
                      <span
                        className={`type-data text-sm ${
                          activePoint.netProfit >= 0 ? 'text-positive' : 'text-negative'
                        }`}
                      >
                        {formatCurrency(activePoint.netProfit)}
                      </span>
                    </div>
                    <div>
                      <span className="type-label text-muted block">Cumulative</span>
                      <span
                        className={`type-data text-sm ${
                          activePoint.cumulative >= 0 ? 'text-positive' : 'text-negative'
                        }`}
                      >
                        {formatCurrency(activePoint.cumulative)}
                      </span>
                    </div>
                  </div>
                  <Caption tone="secondary" className="mt-2 block uppercase">
                    {activePoint.status === 'EXTRACTED'
                      ? 'Extracted'
                      : activePoint.status === 'DIED'
                        ? 'KIA'
                        : activePoint.status}
                    {' · Click chart to inspect'}
                  </Caption>
                </>
              ) : (
                <>
                  <MetaLabel className="block mb-1">Operation probe</MetaLabel>
                  <Caption tone="muted" className="block">
                    Hover the cumulative line to inspect each raid at that point.
                  </Caption>
                </>
              )}
            </div>
          </div>

          <Caption tone="secondary" className="mt-4 max-w-md">
            Cumulative result across all recorded operations
            {points.length > 0 ? ` · ${points.length} ops` : ''}
          </Caption>
        </div>

        {points.length > 1 && (
          <div className="relative min-h-[160px] lg:min-h-0">
            <InteractiveCumulativeChart
              points={points}
              minY={minY}
              maxY={maxY}
              onRaidClick={onRaidClick}
              onActiveChange={handleActiveChange}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function BriefBand({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0 border-b border-abi-border/60 px-0 py-4 first:pt-0 last:border-b-0 last:pb-0 md:border-b-0 md:px-5 md:py-0 md:first:pl-0 md:last:pr-0">
      <div className="mb-4 flex items-center gap-2 text-accent">
        {icon}
        <MetaLabel tone="accent">{label}</MetaLabel>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 md:grid-cols-1 xl:grid-cols-2">
        {children}
      </div>
    </div>
  );
}

function BriefReadout({
  label,
  value,
  detail,
  tone = 'primary',
}: {
  label: string;
  value: string;
  detail: string;
  tone?: Tone;
}) {
  return (
    <div className="min-w-0">
      <MetaLabel className="block mb-1.5">{label}</MetaLabel>
      <DataValue tone={tone} className="block truncate">{value}</DataValue>
      <Caption tone="muted" className="mt-1 block truncate">{detail}</Caption>
    </div>
  );
}

function DossierMetric({
  label,
  value,
  tone = 'primary',
  className = '',
}: {
  label: string;
  value: string;
  tone?: Tone;
  className?: string;
}) {
  return (
    <div className={className ? className : 'bg-abi-bg-card p-3'}>
      <MetaLabel className="block mb-2">{label}</MetaLabel>
      <DataValue tone={tone}>{value}</DataValue>
    </div>
  );
}

function EconomyIndicator({
  label,
  value,
  total,
  tone,
}: {
  label: string;
  value: number;
  total: number;
  tone: 'accent' | 'warning';
}) {
  const width = total > 0 ? Math.max((value / total) * 100, 4) : 0;
  const barColor = tone === 'accent' ? 'bg-abi-orange' : 'bg-abi-warning';

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <MetaLabel>{label}</MetaLabel>
        <DataValue>{formatCurrency(value)}</DataValue>
      </div>
      <div className="mt-2 h-px w-full bg-abi-border relative overflow-hidden">
        <AnimatedBar
          widthPercent={width}
          className={`absolute inset-y-0 left-0 h-px ${barColor}`}
        />
      </div>
    </div>
  );
}

function TacticalEmptyState({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="grid min-h-[230px] place-items-center border border-dashed border-abi-border bg-abi-bg/35 p-6 text-center">
      <div className="max-w-sm">
        <AnimatedEmptyStateIcon className="mx-auto mb-4 grid h-12 w-12 place-items-center border border-abi-orange/35 bg-abi-orange/10 text-accent">
          {icon}
        </AnimatedEmptyStateIcon>        <h3 className="type-heading text-primary">{title}</h3>
        <p className="mt-2 type-caption text-secondary">{description}</p>
      </div>
    </div>
  );
}

