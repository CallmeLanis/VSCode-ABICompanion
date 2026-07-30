import { useMemo, type ReactNode } from 'react';
import {
  Badge,
  Caption,
  DataValue,
  EmptyState,
  MapName,
  MetaLabel,
  PageHeader,
  ProgressBar,
  RoiViewToggle,
  StatCard,
} from '../components/ui';
import {
  calculateCommanderIntelligence,
  calculateGearAnalytics,
} from '../utils/analytics';
import {
  useHighlights,
  useRoiRaids,
  useAggregatedSessions,
} from '../hooks/useStorageQuery';
import {
  formatCurrency,
  formatDateTime,
  formatDuration,
  formatPercentage,
} from '../utils/economy';
import {
  Award,
  Clock,
  Crosshair,
  Flame,
  MapPin,
  Shield,
  Skull,
  Star,
  Target,
  TrendingUp,
  Trophy,
  User,
  Wallet,
  Zap,
} from 'lucide-react';
import type { CommanderAchievement } from '../types';
import {
  CountUpValue,
  RevealSection,
  StaggerContainer,
  StaggerItem,
  StaggerList,
} from '../components/motion';
import { motion } from 'motion/react';

const ACHIEVEMENT_ICONS: Record<string, ReactNode> = {
  first_raid: <Skull size={20} />,
  veteran: <Trophy size={20} />,
  profit_king: <TrendingUp size={20} />,
  extractor: <Target size={20} />,
  money_maker: <Star size={20} />,
  slayer: <Zap size={20} />,
  rescue_expert: <Shield size={20} />,
  marathon: <Clock size={20} />,
};

export function Commander() {
  const raids = useRoiRaids();
  const sessions = useAggregatedSessions();
  const highlights = useHighlights();

  const dossier = useMemo(() => {
    const gearSummary = calculateGearAnalytics(raids);
    return calculateCommanderIntelligence(raids, sessions, highlights, gearSummary);
  }, [raids, sessions, highlights]);

  const {
    prestige,
    tacticalScore,
    playstyle,
    playstyleConfidence,
    serviceRecord,
    streaks,
    records,
    mapBreakdown,
    loadoutBreakdown,
    careerTimeline,
    achievements,
    unlockedAchievementCount,
  } = dossier;

  if (raids.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Command dossier"
          title="Commander"
          meta="Awaiting service record"
        />
        <EmptyState
          icon={<User size={48} />}
          title="No service record yet"
          description="Log your first operation to begin building your commander dossier."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Command dossier"
        title="Commander"
        meta={`${serviceRecord.totalDeployments} operations · ${prestige.title}`}
        actions={
          <div className="flex flex-wrap items-center justify-end gap-3">
            <RoiViewToggle />
            {playstyle && (
              <span className="hud-chip text-abi-orange">
                {playstyle}
                {playstyleConfidence === 'low' ? ' · low confidence' : ''}
              </span>
            )}
          </div>
        }
      />

      {/* Dossier hero */}
      <RevealSection immediate>
      <header className="hud-card px-4 py-5 sm:px-5 relative overflow-hidden">
        <div className="flex flex-wrap items-start gap-5">
          <motion.div
            className="w-20 h-20 border border-abi-orange/50 bg-abi-orange/10 flex items-center justify-center shrink-0"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35 }}
          >
            <User size={40} className="text-abi-orange" strokeWidth={1.5} />
          </motion.div>

          <div className="min-w-0 flex-1">
            <Badge variant="orange" size="sm">{prestige.title}</Badge>
            <DataValue className="mt-2 text-2xl">Commander</DataValue>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
              <Caption tone="muted">Prestige {prestige.level}</Caption>
              <Caption tone="muted">{serviceRecord.totalDeployments} operations</Caption>
              <Caption tone="muted">{serviceRecord.totalSessions} deployments</Caption>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 w-full xl:w-auto xl:ml-auto">
            <DossierMetric
              label="Tactical score"
              value={tacticalScore > 0 ? (
                <CountUpValue value={tacticalScore} format={(n) => String(Math.round(n))} />
              ) : '—'}
              tone={tacticalScore >= 70 ? 'positive' : tacticalScore >= 40 ? 'default' : 'muted'}
            />
            <DossierMetric
              label="Lifetime profit"
              value={`$${formatCurrency(serviceRecord.lifetimeProfit)}`}
              tone={serviceRecord.lifetimeProfit >= 0 ? 'positive' : 'negative'}
            />
            <DossierMetric
              label="Extraction"
              value={formatPercentage(serviceRecord.extractionRate)}
            />
            <DossierMetric
              label="Average ROI"
              value={formatPercentage(serviceRecord.averageROI)}
              tone={serviceRecord.averageROI >= 0 ? 'positive' : 'negative'}
            />
          </div>
        </div>
      </header>
      </RevealSection>

      <RevealSection immediate delay={0.06}>
      <section aria-label="Commander summary" className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StaggerContainer className="contents xl:contents" immediate>
          <StaggerItem><StatCard label="Lifetime profit" value={`$${formatCurrency(serviceRecord.lifetimeProfit)}`} subValue={`${formatPercentage(serviceRecord.averageROI)} average ROI`} icon={<Wallet size={18} />} /></StaggerItem>
          <StaggerItem><StatCard label="Extraction rate" value={formatPercentage(serviceRecord.extractionRate)} subValue={`${serviceRecord.totalKills} kills · ${serviceRecord.totalDeaths} deaths`} icon={<Target size={18} />} /></StaggerItem>
          <StaggerItem><StatCard label="Tactical score" value={tacticalScore > 0 ? String(tacticalScore) : '—'} subValue={playstyle ?? 'Insufficient history'} icon={<Award size={18} />} /></StaggerItem>
          <StaggerItem><StatCard label="Achievements" value={`${unlockedAchievementCount}/${achievements.length}`} subValue={`${serviceRecord.totalHighlights} highlights recorded`} icon={<Trophy size={18} />} /></StaggerItem>
        </StaggerContainer>
      </section>
      </RevealSection>

      {/* Service record + streaks */}
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.4fr_1fr]">
        <section aria-label="Service record" className="hud-card rounded-xl p-5 relative">
          <MetaLabel tone="accent" className="block mb-1">Service record</MetaLabel>
          <Caption tone="muted" className="mb-4">Lifetime operational history</Caption>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <ServiceStat label="First deployment" value={formatDateTime(serviceRecord.firstDeployment!)} />
            <ServiceStat label="Last deployment" value={formatDateTime(serviceRecord.lastDeployment!)} />
            <ServiceStat label="Avg duration" value={formatDuration(serviceRecord.averageDuration)} />
            <ServiceStat label="Lifetime investment" value={`$${formatCurrency(serviceRecord.lifetimeInvestment)}`} />
            <ServiceStat label="Lifetime loot" value={`$${formatCurrency(serviceRecord.lifetimeLoot)}`} />
            <ServiceStat label="Highlights" value={String(serviceRecord.totalHighlights)} />
          </div>
        </section>

        <section aria-label="Operational streaks" className="hud-card rounded-xl p-5 relative">
          <MetaLabel tone="accent" className="block mb-1">Operational streaks</MetaLabel>
          <Caption tone="muted" className="mb-4">Current and career-best runs</Caption>

          <div className="grid grid-cols-2 gap-3">
            <StreakStat label="Extract streak" current={streaks.currentExtraction} best={streaks.longestExtraction} />
            <StreakStat label="Profit streak" current={streaks.currentProfit} best={streaks.longestProfit} />
            <StreakStat
              label="Dry streak"
              current={streaks.currentDry}
              best={streaks.currentDry}
              tone="negative"
              hideBest
            />
            <StreakStat
              label="Career ops"
              current={serviceRecord.totalDeployments}
              best={serviceRecord.totalSessions}
              currentLabel="Raids"
              bestLabel="Sessions"
            />
          </div>
        </section>
      </div>

      {/* Career records */}
      <section aria-label="Career records">
        <div className="mb-3">
          <MetaLabel tone="accent" className="block mb-1">Career records</MetaLabel>
          <Caption tone="muted">Personal bests across all operations</Caption>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {records.map(record => (
            <div key={record.label} className="hud-card p-4 relative">
              <Caption tone="muted" className="uppercase tracking-wider">{record.label}</Caption>
              <DataValue className="mt-1 text-lg">{record.value}</DataValue>
              <div className="flex items-center gap-2 mt-1">
                <MapName>{record.subValue}</MapName>
                {record.timestamp && (
                  <Caption tone="muted">{formatDateTime(record.timestamp)}</Caption>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Maps + loadouts */}
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <section aria-label="Theater breakdown" className="hud-card rounded-xl p-5 relative">
          <MetaLabel tone="accent" className="block mb-1">Theater service</MetaLabel>
          <Caption tone="muted" className="mb-4">Maps by lifetime performance</Caption>

          {mapBreakdown.length === 0 ? (
            <Caption tone="secondary">No map data available.</Caption>
          ) : (
            <div className="space-y-2">
              {mapBreakdown.map(row => (
                <div
                  key={row.map}
                  className="grid grid-cols-[minmax(0,1fr)_auto_auto_auto] gap-3 items-center py-2 border-b border-abi-border/50 last:border-0"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <MapPin size={14} className="text-abi-text-dim shrink-0" />
                    <MapName className="truncate">{row.map}</MapName>
                  </div>
                  <Caption tone="muted">{row.raids} ops</Caption>
                  <Caption tone="muted">{formatPercentage(row.extractionRate)} ext</Caption>
                  <Caption tone={row.totalProfit >= 0 ? 'positive' : 'negative'}>
                    ${formatCurrency(row.totalProfit)}
                  </Caption>
                </div>
              ))}
            </div>
          )}
        </section>

        <section aria-label="Loadout service" className="hud-card rounded-xl p-5 relative">
          <MetaLabel tone="accent" className="block mb-1">Loadout service</MetaLabel>
          <Caption tone="muted" className="mb-4">Performance by gear investment tier</Caption>

          {loadoutBreakdown.length === 0 ? (
            <Caption tone="secondary">Log gear value to populate loadout history.</Caption>
          ) : (
            <div className="space-y-2">
              {loadoutBreakdown.map(row => (
                <div
                  key={row.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto_auto_auto] gap-3 items-center py-2 border-b border-abi-border/50 last:border-0"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Shield size={14} className="text-abi-text-dim shrink-0" />
                    <Caption tone="secondary" className="truncate">{row.label}</Caption>
                  </div>
                  <Caption tone="muted">{row.raids} ops</Caption>
                  <Caption tone="muted">{formatPercentage(row.extractionRate)} ext</Caption>
                  <Caption tone={row.averageProfit >= 0 ? 'positive' : 'negative'}>
                    ${formatCurrency(row.averageProfit)} avg
                  </Caption>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Achievements */}
      <section aria-label="Achievements" className="hud-card rounded-xl p-5 relative">
        <div className="flex items-center justify-between mb-4">
          <div>
            <MetaLabel tone="accent" className="block mb-1">Achievements</MetaLabel>
            <Caption tone="muted">{unlockedAchievementCount}/{achievements.length} unlocked</Caption>
          </div>
          <Trophy size={18} className="text-abi-orange" />
        </div>

        <StaggerContainer className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {achievements.map(achievement => (
            <StaggerItem key={achievement.id}>
              <AchievementCard achievement={achievement} />
            </StaggerItem>
          ))}
        </StaggerContainer>
      </section>

      {/* Career timeline */}
      <section aria-label="Career timeline" className="hud-card rounded-xl p-5 relative">
        <MetaLabel tone="accent" className="block mb-1">Career timeline</MetaLabel>
        <Caption tone="muted" className="mb-4">Key milestones across your service record</Caption>

        {careerTimeline.length === 0 ? (
          <Caption tone="secondary">Timeline will populate as operations are logged.</Caption>
        ) : (
          <StaggerList>
            {careerTimeline.map((entry, index) => (
              <div
                key={`${entry.type}-${entry.timestamp}-${index}`}
                className="grid grid-cols-[88px_minmax(0,1fr)] gap-3 py-3 border-b border-abi-border/50 last:border-0"
              >
                <Caption tone="muted" className="font-mono text-[11px]">
                  {formatDateTime(entry.timestamp)}
                </Caption>
                <div>
                  <div className="flex items-center gap-2">
                    <TimelineIcon type={entry.type} />
                    <Caption tone="secondary">{entry.label}</Caption>
                  </div>
                  <Caption tone="muted" className="mt-0.5">{entry.detail}</Caption>
                </div>
              </div>
            ))}
          </StaggerList>
        )}
      </section>
    </div>
  );
}

function DossierMetric({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: ReactNode;
  tone?: 'default' | 'positive' | 'negative' | 'muted';
}) {
  const toneClass =
    tone === 'positive'
      ? 'text-positive'
      : tone === 'negative'
        ? 'text-negative'
        : tone === 'muted'
          ? 'text-muted'
          : 'text-primary';

  return (
    <div>
      <Caption tone="muted" className="uppercase tracking-wider">{label}</Caption>
      <p className={`text-xl font-bold font-orbitron tabular-nums mt-1 ${toneClass}`}>{value}</p>
    </div>
  );
}

function ServiceStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-abi-border/60 bg-abi-bg/30 p-3">
      <Caption tone="muted" className="uppercase tracking-wider">{label}</Caption>
      <p className="text-sm text-primary mt-1 font-mono">{value}</p>
    </div>
  );
}

function StreakStat({
  label,
  current,
  best,
  tone = 'default',
  hideBest = false,
  currentLabel = 'Current',
  bestLabel = 'Best',
}: {
  label: string;
  current: number;
  best: number;
  tone?: 'default' | 'negative';
  hideBest?: boolean;
  currentLabel?: string;
  bestLabel?: string;
}) {
  const valueClass = tone === 'negative' ? 'text-negative' : 'text-primary';

  return (
    <div className="border border-abi-border/60 bg-abi-bg/30 p-3">
      <Caption tone="muted" className="uppercase tracking-wider">{label}</Caption>
      <div className="flex items-end justify-between mt-2 gap-2">
        <div>
          <Caption tone="muted">{currentLabel}</Caption>
          <p className={`text-xl font-bold font-orbitron tabular-nums ${valueClass}`}>{current}</p>
        </div>
        {!hideBest && (
          <div className="text-right">
            <Caption tone="muted">{bestLabel}</Caption>
            <p className="text-sm font-mono text-secondary">{best}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function AchievementCard({ achievement }: { achievement: CommanderAchievement }) {
  return (
    <motion.div
      className={`p-3 border transition-colors ${
        achievement.unlocked
          ? 'bg-abi-orange/10 border-abi-orange/30'
          : 'bg-abi-bg/30 border-abi-border opacity-60'
      }`}
      initial={achievement.unlocked ? { scale: 0.96, opacity: 0 } : false}
      whileInView={achievement.unlocked ? { scale: 1, opacity: 1 } : undefined}
      viewport={{ once: true }}
      transition={{ duration: 0.3 }}
    >
      <div className={`mb-2 ${achievement.unlocked ? 'text-abi-orange' : 'text-abi-text-dim'}`}>
        {ACHIEVEMENT_ICONS[achievement.id] ?? <Crosshair size={20} />}
      </div>
      <p className="text-sm font-semibold text-primary">{achievement.name}</p>
      <Caption tone="muted" className="mt-1">{achievement.description}</Caption>
      {!achievement.unlocked && achievement.progress !== undefined && achievement.maxProgress && (
        <ProgressBar
          value={achievement.progress}
          max={achievement.maxProgress}
          variant="orange"
          size="sm"
          className="mt-2"
        />
      )}
    </motion.div>
  );
}

function TimelineIcon({ type }: { type: string }) {
  switch (type) {
    case 'first_raid':
      return <Crosshair size={14} className="text-abi-orange shrink-0" />;
    case 'milestone_raids':
      return <Target size={14} className="text-abi-text-dim shrink-0" />;
    case 'milestone_profit':
      return <Wallet size={14} className="text-positive shrink-0" />;
    case 'best_raid':
      return <Flame size={14} className="text-abi-orange shrink-0" />;
    case 'highlight':
      return <Star size={14} className="text-warning shrink-0" />;
    default:
      return <Clock size={14} className="text-abi-text-dim shrink-0" />;
  }
}
