import { useMemo, type ReactNode } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Crosshair,
  Radar,
  ShieldAlert,
  Target,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import {
  Caption,
  EmptyState,
  MetaLabel,
  PageHeader,
  RoiViewToggle,
  StatCard,
} from '../components/ui';
import { useRoiRaids } from '../hooks/useStorageQuery';
import {
  generateIntelligenceBrief,
  MIN_OPERATIONAL_HISTORY,
  type IntelligenceSignal,
} from '../utils/intelligence';
import { formatCurrency, formatPercentage } from '../utils/economy';
import {
  RevealSection,
  StaggerContainer,
  StaggerItem,
} from '../components/motion';

const CATEGORY_ICONS = {
  economy: <Wallet size={15} />,
  performance: <Activity size={15} />,
  risk: <ShieldAlert size={15} />,
  opportunity: <Target size={15} />,
} as const;

export function IntelligenceCenter() {
  const raids = useRoiRaids();
  const brief = useMemo(() => generateIntelligenceBrief(raids), [raids]);

  const averageRoi = useMemo(() => {
    const invested = raids.filter((raid) => raid.investment > 0);
    if (invested.length === 0) return 0;
    return invested.reduce((sum, raid) => sum + raid.roi, 0) / invested.length;
  }, [raids]);

  const stateLabel = brief.currentState === 'risk'
    ? 'Risk detected'
    : brief.currentState === 'watch'
      ? 'Monitor conditions'
      : 'Conditions nominal';

  if (raids.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Tactical analysis"
          title="Intelligence Center"
          meta="Awaiting operational data"
        />
        <EmptyState
          icon={<Radar size={48} />}
          title="No intelligence available"
          description="Log operations to begin comparing performance, risk, and economy over time."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Tactical analysis"
        title="Intelligence Center"
        meta={`${raids.length} operations analyzed`}
        actions={
          <div className="flex flex-wrap items-center justify-end gap-3">
            <RoiViewToggle />
            <span className={`hud-chip ${stateToneClass(brief.currentState)}`}>
              {stateLabel}
            </span>
          </div>
        }
      />

      <RevealSection immediate>
      <header className="hud-card p-5 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px overflow-hidden" aria-hidden>
          <div className="h-full w-full bg-abi-orange/40 animate-scan-line-once" />
        </div>
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-2xl">
            <MetaLabel tone="accent" className="block mb-2">Operational summary</MetaLabel>
            <h2 className="type-display-l text-primary">
              {summaryHeadline(brief.currentState, brief.activeSignals.length)}
            </h2>
            <Caption tone="secondary" className="mt-3 block max-w-xl">
              This briefing compares the latest {brief.recentOperations} operations against the recorded career baseline.
            </Caption>
          </div>
          <div className="border border-abi-border bg-abi-bg/40 p-4 min-w-[180px]">
            <Caption tone="muted" className="uppercase tracking-wider">Signal status</Caption>
            <p className={`mt-1 type-data text-xl ${stateToneClass(brief.currentState)} ${brief.currentState === 'risk' ? 'animate-pulse' : ''}`}>
              {brief.activeSignals.length} active
            </p>
            <Caption tone="muted">
              {brief.riskSignals.length} risk and watch signals
            </Caption>
          </div>
        </div>
      </header>
      </RevealSection>

      <RevealSection immediate delay={0.06}>
      <section aria-label="Operational snapshot" className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StaggerContainer className="contents xl:contents" immediate>
          <StaggerItem><StatCard
          label={`Last ${brief.recentOperations} net`}
          value={`$${formatCurrency(brief.recentNet)}`}
          subValue="Combined recent operation result"
          icon={<Wallet size={18} />}
        /></StaggerItem>
          <StaggerItem><StatCard
          label="Recent extraction"
          value={formatPercentage(brief.recentExtractionRate)}
          subValue={`Across ${brief.recentOperations} operations`}
          icon={<Crosshair size={18} />}
        /></StaggerItem>
          <StaggerItem><StatCard
          label="Career ROI"
          value={formatPercentage(averageRoi)}
          subValue="Average on invested operations"
          icon={<TrendingUp size={18} />}
        /></StaggerItem>
          <StaggerItem><StatCard
          label="Positive signals"
          value={String(brief.positiveSignals.length)}
          subValue={`${brief.riskSignals.length} need attention`}
          icon={<Radar size={18} />}
        /></StaggerItem>
        </StaggerContainer>
      </section>
      </RevealSection>

      {raids.length < MIN_OPERATIONAL_HISTORY ? (
        <section aria-label="Minimum operational history">
          <EmptyState
            icon={<Radar size={48} />}
            title="Intelligence calibration in progress"
            description={`Log ${MIN_OPERATIONAL_HISTORY - raids.length} more operations before the system issues evidence-backed advisories.`}
          />
        </section>
      ) : (
        <>
          <RevealSection delay={0.04}>
          <section aria-label="Strategic recommendations">
            <div className="mb-3">
              <MetaLabel tone="accent" className="block mb-1">Strategic recommendations</MetaLabel>
              <Caption tone="muted">Observation, evidence, impact, and a direct next action.</Caption>
            </div>

            {brief.activeSignals.length > 0 ? (
              <StaggerContainer className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                {brief.activeSignals.map((signal) => (
                  <StaggerItem key={signal.id}>
                    <IntelligenceSignalCard signal={signal} />
                  </StaggerItem>
                ))}
              </StaggerContainer>
            ) : (
              <NominalPanel />
            )}
          </section>
          </RevealSection>

          <RevealSection delay={0.08}>
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            {brief.currentState === 'risk' ? (
              <>
                <SignalColumn
                  title="Risk alerts"
                  description="Patterns that need a tactical response."
                  signals={brief.riskSignals}
                  icon={<AlertTriangle size={17} className="text-warning" />}
                  empty="No active risks meet the reporting threshold."
                  tone="warning"
                />
                <SignalColumn
                  title="Positive trends"
                  description="Patterns supporting current performance."
                  signals={brief.positiveSignals}
                  icon={<ArrowUpRight size={17} className="text-positive" />}
                  empty="No verified positive trend has crossed the reporting threshold yet."
                  tone="positive"
                />
              </>
            ) : (
              <>
                <SignalColumn
                  title="Positive trends"
                  description="Patterns supporting current performance."
                  signals={brief.positiveSignals}
                  icon={<ArrowUpRight size={17} className="text-positive" />}
                  empty="No verified positive trend has crossed the reporting threshold yet."
                  tone="positive"
                />
                <SignalColumn
                  title="Risk alerts"
                  description="Patterns that need a tactical response."
                  signals={brief.riskSignals}
                  icon={<AlertTriangle size={17} className="text-warning" />}
                  empty="No active risks meet the reporting threshold."
                  tone="warning"
                />
              </>
            )}
          </div>
          </RevealSection>
        </>
      )}

      <RevealSection delay={0.12}>
      <section aria-label="Intelligence confidence" className="border border-abi-border bg-abi-bg/35 p-4">
        <div className="flex items-start gap-3">
          <Radar size={17} className="text-accent mt-0.5 shrink-0" />
          <div>
            <MetaLabel tone="accent">Confidence protocol</MetaLabel>
            <Caption tone="secondary" className="mt-1 block">
              Signals use only recorded raid history. Map, mode, and loadout conclusions require repeated samples; isolated outcomes stay unreported.
            </Caption>
          </div>
        </div>
      </section>
      </RevealSection>
    </div>
  );
}

function IntelligenceSignalCard({ signal }: { signal: IntelligenceSignal }) {
  const toneClass = signalToneClass(signal.tone);

  return (
    <article className="hud-card p-5 relative">
      <div className={`flex items-center gap-2 ${toneClass}`}>
        {CATEGORY_ICONS[signal.category]}
        <MetaLabel tone={signal.tone}>{signal.category}</MetaLabel>
      </div>
      <h3 className="type-heading text-primary mt-3">{signal.observation}</h3>

      <div className="grid gap-3 mt-4 sm:grid-cols-3">
        <IntelDetail label="Evidence" value={signal.evidence} />
        <IntelDetail label="Impact" value={signal.impact} />
        <IntelDetail label="Next action" value={signal.action} emphasized />
      </div>
    </article>
  );
}

function IntelDetail({
  label,
  value,
  emphasized = false,
}: {
  label: string;
  value: string;
  emphasized?: boolean;
}) {
  return (
    <div className={emphasized ? 'border-l-2 border-abi-orange pl-3' : ''}>
      <Caption tone={emphasized ? 'accent' : 'muted'} className="uppercase tracking-wider">
        {label}
      </Caption>
      <Caption tone={emphasized ? 'secondary' : 'muted'} className="mt-1 block">
        {value}
      </Caption>
    </div>
  );
}

function SignalColumn({
  title,
  description,
  signals,
  icon,
  empty,
  tone,
}: {
  title: string;
  description: string;
  signals: IntelligenceSignal[];
  icon: ReactNode;
  empty: string;
  tone: 'positive' | 'warning';
}) {
  return (
    <section className="hud-card p-5 relative">
      <div className="flex items-start gap-3">
        {icon}
        <div>
          <MetaLabel tone={tone}>{title}</MetaLabel>
          <Caption tone="muted" className="mt-1 block">{description}</Caption>
        </div>
      </div>

      {signals.length === 0 ? (
        <Caption tone="secondary" className="mt-5 block">{empty}</Caption>
      ) : (
        <div className="mt-4 grid gap-3">
          {signals.map((signal) => (
            <div key={signal.id} className="border-l-2 border-abi-border pl-3">
              <Caption tone={signal.tone} className="block">{signal.observation}</Caption>
              <Caption tone="muted" className="mt-1 block">{signal.evidence}</Caption>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function NominalPanel() {
  return (
    <div className="flex items-start gap-3 border border-abi-border bg-abi-bg/35 p-5">
      <Target size={18} className="text-positive mt-0.5 shrink-0" />
      <div>
        <MetaLabel tone="positive">Conditions nominal</MetaLabel>
        <Caption tone="secondary" className="mt-1 block">
          No measured pattern currently meets the threshold for an advisory. Continue logging operations to preserve this baseline.
        </Caption>
      </div>
    </div>
  );
}

function summaryHeadline(state: 'nominal' | 'watch' | 'risk', signalCount: number): string {
  if (state === 'risk') {
    return `${signalCount} active signals require a tactical adjustment.`;
  }
  if (state === 'watch') {
    return `${signalCount} trend signals need monitoring before the next deployment.`;
  }
  return 'Recorded operations are within current reporting thresholds.';
}

function stateToneClass(state: 'nominal' | 'watch' | 'risk'): string {
  if (state === 'risk') return 'text-negative';
  if (state === 'watch') return 'text-warning';
  return 'text-positive';
}

function signalToneClass(tone: IntelligenceSignal['tone']): string {
  if (tone === 'negative') return 'text-negative';
  if (tone === 'warning') return 'text-warning';
  return 'text-positive';
}
