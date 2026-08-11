import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Calendar,
  ChevronDown,
  Clock,
  Crosshair,
  Target,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import {
  Badge,
  Caption,
  DataValue,
  DisplayValue,
  EmptyState,
  MapName,
  MetaLabel,
  PageHeader,
  RoiViewToggle,
  StatCard,
  StatusBadge,
} from '../components/ui';
import { formatCurrency, formatDuration, formatPercentage, formatTime } from '../utils/economy';
import { ExpandPanel, RevealSection, StaggerContainer, StaggerItem, StaggerList } from '../components/motion';
import { useAggregatedSessions, useRoiRaids, useSessionSummary } from '../hooks/useStorageQuery';
import { STATUS_ICONS } from '../data/constants';
import type { Session, Raid } from '../types';

interface SessionsProps {
  onRaidClick: (raidId: string) => void;
  focusSessionId?: string | null;
  onFocusSessionConsumed?: () => void;
}

interface DayGroup {
  key: string;
  label: string;
  sessions: Session[];
}

export function Sessions({
  onRaidClick,
  focusSessionId = null,
  onFocusSessionConsumed,
}: SessionsProps) {
  const sessions = useAggregatedSessions();
  const raids = useRoiRaids();
  const summary = useSessionSummary();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [highlightSessionId, setHighlightSessionId] = useState<string | null>(null);
  const focusHandledRef = useRef<string | null>(null);

  useEffect(() => {
    if (!focusSessionId || focusHandledRef.current === focusSessionId) return;
    focusHandledRef.current = focusSessionId;
    setExpandedId(focusSessionId);
    setHighlightSessionId(focusSessionId);

    const frame = window.requestAnimationFrame(() => {
      document
        .getElementById(`session-${focusSessionId}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    const timer = window.setTimeout(() => {
      setHighlightSessionId(null);
      onFocusSessionConsumed?.();
      focusHandledRef.current = null;
    }, 3000);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [focusSessionId, onFocusSessionConsumed]);

  // Raids indexed by session, chronological within each deployment
  const raidsBySession = useMemo(() => {
    const map = new Map<string, Raid[]>();
    for (const raid of raids) {
      const list = map.get(raid.sessionId) ?? [];
      list.push(raid);
      map.set(raid.sessionId, list);
    }
    map.forEach(list => list.sort((a, b) => a.timestamp - b.timestamp));
    return map;
  }, [raids]);

  // Timeline: deployments grouped by calendar day, newest first
  const dayGroups = useMemo<DayGroup[]>(() => {
    const groups = new Map<string, DayGroup>();
    for (const session of sessions) {
      const date = new Date(session.startTime);
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      let group = groups.get(key);
      if (!group) {
        group = {
          key,
          label: date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          }),
          sessions: [],
        };
        groups.set(key, group);
      }
      group.sessions.push(session);
    }
    return Array.from(groups.values());
  }, [sessions]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Deployment history"
        title="Sessions"
        meta={`${summary.totalSessions} deployments · ${summary.totalRaids} operations`}
        actions={<RoiViewToggle />}
      />

      {sessions.length > 0 ? (
        <>
          {/* Session summary */}
          <RevealSection immediate delay={0.04}>
          <section
            aria-label="Deployment summary"
            className="grid grid-cols-2 gap-3 xl:grid-cols-4"
          >
            <StaggerContainer className="contents xl:contents" immediate>
              <StaggerItem><StatCard label="Deployments" value={summary.totalSessions} subValue={`${summary.totalRaids} operations total`} icon={<Calendar size={18} />} /></StaggerItem>
              <StaggerItem><StatCard label="Net result" value={`${summary.totalProfit >= 0 ? '+' : ''}$${formatCurrency(summary.totalProfit)}`} subValue={`$${formatCurrency(summary.totalInvestment)} invested`} icon={<TrendingUp size={18} />} /></StaggerItem>
              <StaggerItem><StatCard label="Avg extraction" value={formatPercentage(summary.averageExtractionRate)} subValue="Across all deployments" icon={<Target size={18} />} /></StaggerItem>
              <StaggerItem><StatCard label="Best deployment" value={summary.bestSession ? `+$${formatCurrency(summary.bestSession.totalProfit)}` : '—'} subValue={summary.bestSession ? new Date(summary.bestSession.startTime).toLocaleDateString('en-US') : 'No data'} icon={<Wallet size={18} />} /></StaggerItem>
            </StaggerContainer>
          </section>
          </RevealSection>

          {/* Deployment timeline */}
          <div className="space-y-6">
            {dayGroups.map(group => (
              <RevealSection key={group.key}>
              <section aria-label={group.label}>
                <div className="mb-3 flex items-center gap-3">
                  <MetaLabel tone="accent">{group.label}</MetaLabel>
                  <div className="h-px flex-1 bg-abi-border" />
                  <Caption tone="muted">
                    {group.sessions.length} {group.sessions.length === 1 ? 'deployment' : 'deployments'}
                  </Caption>
                </div>
                <div className="ml-1 space-y-3 border-l border-abi-border pl-4">
                  {group.sessions.map(session => (
                    <DeploymentCard
                      key={session.id}
                      session={session}
                      raids={raidsBySession.get(session.id) ?? []}
                      expanded={expandedId === session.id}
                      highlighted={highlightSessionId === session.id}
                      onToggle={() =>
                        setExpandedId(expandedId === session.id ? null : session.id)
                      }
                      onRaidClick={onRaidClick}
                    />
                  ))}
                </div>
              </section>
              </RevealSection>
            ))}
          </div>
        </>
      ) : (
        <EmptyState
          icon={<Clock size={48} />}
          title="No sessions yet"
          description="Sessions are automatically created from your raid history"
        />
      )}
    </div>
  );
}

function DeploymentCard({
  session,
  raids,
  expanded,
  highlighted,
  onToggle,
  onRaidClick,
}: {
  session: Session;
  raids: Raid[];
  expanded: boolean;
  highlighted?: boolean;
  onToggle: () => void;
  onRaidClick: (raidId: string) => void;
}) {
  const durationMinutes = Math.max(0, Math.round((session.endTime - session.startTime) / 60000));
  const roi = session.totalInvestment > 0
    ? (session.totalProfit / session.totalInvestment) * 100
    : 0;

  return (
    <div id={`session-${session.id}`} className="relative">
      {/* Timeline node */}
      <span
        aria-hidden
        className={`absolute -left-[21.5px] top-6 h-2 w-2 rounded-full border ${
          session.totalProfit >= 0
            ? 'border-abi-success bg-abi-success/30'
            : 'border-abi-danger bg-abi-danger/30'
        }`}
      />

      <div
        className={`hud-card relative transition-colors ${
          expanded ? 'border-abi-orange/45' : ''
        } ${highlighted ? 'animate-session-focus' : ''}`}
      >
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 p-4 text-left"
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <DataValue className="inline-flex items-center gap-1.5">
                <Clock size={13} className="text-accent" aria-hidden />
                {formatTime(session.startTime)}
              </DataValue>
              <Caption tone="muted">{formatDuration(durationMinutes)} window</Caption>
              <Badge variant="default" size="sm">{session.raidCount} raids</Badge>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
              <Caption className="inline-flex items-center gap-1">
                <Target size={12} aria-hidden /> {formatPercentage(session.extractionRate)} extract
              </Caption>
              <Caption
                tone={roi >= 0 ? 'positive' : 'negative'}
                className="inline-flex items-center gap-1"
              >
                <TrendingUp size={12} aria-hidden /> {formatPercentage(roi)} ROI
              </Caption>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <DisplayValue tone={session.totalProfit >= 0 ? 'positive' : 'negative'}>
              {session.totalProfit >= 0 ? '+' : ''}${formatCurrency(session.totalProfit)}
            </DisplayValue>
            <ChevronDown
              size={16}
              aria-hidden
              className={`shrink-0 text-secondary transition-transform ${expanded ? 'rotate-180' : ''}`}
            />
          </div>
        </button>

        {expanded && (
          <ExpandPanel open={expanded} className="border-t border-abi-border/70">
          <div className="p-4 pt-3">
            {/* Session stat grid */}
            <div className="mb-3 grid grid-cols-2 gap-px border border-abi-border bg-abi-border sm:grid-cols-4">
              <SessionStat label="Raids" value={String(session.raidCount)} />
              <SessionStat
                label="Extract"
                value={formatPercentage(session.extractionRate)}
                tone={session.extractionRate >= 50 ? 'positive' : 'warning'}
              />
              <SessionStat label="Invested" value={`$${formatCurrency(session.totalInvestment)}`} />
              <SessionStat
                label="Looted"
                value={`$${formatCurrency(session.totalLoot)}`}
                tone="positive"
              />
            </div>

            {/* Operations in this deployment */}
            <MetaLabel className="mb-2 block">Operations</MetaLabel>
            <div className="max-h-64 space-y-1 overflow-y-auto">
              <StaggerList>
              {raids.map(raid => (
                <button
                  key={raid.id}
                  type="button"
                  onClick={() => onRaidClick(raid.id)}
                  className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg bg-abi-bg px-3 py-2 text-left transition-colors hover:bg-abi-bg-hover"
                >
                  <StatusBadge status={raid.status} icon={STATUS_ICONS[raid.status]} />
                  <div className="min-w-0">
                    <MapName className="block truncate">{raid.map}</MapName>
                    <Caption tone="muted" className="mt-[var(--space-value-meta)] block">
                      {formatTime(raid.timestamp)} · {raid.mode}
                    </Caption>
                  </div>
                  <div className="text-right">
                    <DataValue tone={raid.netProfit >= 0 ? 'positive' : 'negative'}>
                      {raid.netProfit >= 0 ? '+' : ''}${formatCurrency(raid.netProfit)}
                    </DataValue>
                    <Caption tone="muted" className="mt-[var(--space-value-meta)] flex items-center justify-end gap-1">
                      <Crosshair size={11} aria-hidden /> {raid.kills} kills
                    </Caption>
                  </div>
                </button>
              ))}
              </StaggerList>
            </div>
          </div>
          </ExpandPanel>
        )}
      </div>
    </div>
  );
}

function SessionStat({
  label,
  value,
  tone = 'primary',
}: {
  label: string;
  value: string;
  tone?: 'primary' | 'positive' | 'negative' | 'warning';
}) {
  return (
    <div className="bg-abi-bg-card p-3">
      <MetaLabel className="mb-[var(--space-label-value)] block">{label}</MetaLabel>
      <DataValue tone={tone}>{value}</DataValue>
    </div>
  );
}
