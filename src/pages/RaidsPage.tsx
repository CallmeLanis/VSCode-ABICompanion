import { useState, useMemo, useRef, useEffect } from 'react';
import {
  SortDesc,
  Target,
  Skull,
  Trash2,
  Eye,
  Calendar,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { deleteRaid } from '../utils/storage';
import { useRoiRaids } from '../hooks/useStorageQuery';
import { RaidDetailPopup } from './RaidDetailPopup';
import { formatCurrency, formatCompactDate, formatTime24, formatPercentage } from '../utils/economy';
import { STATUS_ICONS } from '../data/constants';
import {
  Badge,
  Caption,
  DataValue,
  EmptyState,
  MapName,
  MetaLabel,
  PageHeader,
  RoiViewToggle,
  StatCard,
  StatusBadge,
} from '../components/ui';
import { EnterRaidTrigger } from '../components/debrief/MissionDebrief';
import {
  RevealSection,
  SparklineDraw,
  StaggerContainer,
  StaggerItem,
} from '../components/motion';
import type { Raid, RaidStatus } from '../types';

type SortField = 'timestamp' | 'netProfit' | 'roi' | 'kills';
type FilterStatus = 'all' | RaidStatus;

interface DayGroup {
  key: string;
  label: string;
  raids: Raid[];
  netProfit: number;
  extracted: number;
}

function statusRailClass(raid: Raid): string {
  if (raid.isHighlight) return 'raids-row-rail--highlight';
  if (raid.status === 'EXTRACTED') return 'raids-row-rail--extracted';
  if (raid.status === 'DIED') return 'raids-row-rail--died';
  return 'raids-row-rail--fled';
}

function extractBadgeVariant(
  extracted: number,
  total: number,
): 'success' | 'warning' | 'danger' {
  if (total === 0) return 'warning';
  if (extracted === total) return 'success';
  if (extracted === 0) return 'danger';
  return 'warning';
}

export function RaidsPage({ onRaidClick }: { onRaidClick: (raidId: string) => void }) {
  const raids = useRoiRaids();
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(600);

  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [sortField, setSortField] = useState<SortField>('timestamp');

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [detailRaidId, setDetailRaidId] = useState<string | null>(null);
  const [highlightRaidId, setHighlightRaidId] = useState<string | null>(null);
  const [debriefOpen, setDebriefOpen] = useState(false);

  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        setContainerHeight(Math.max(360, containerRef.current.clientHeight - 60));
      }
    };
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  const filterCounts = useMemo(() => {
    let extracted = 0;
    let died = 0;
    let fled = 0;
    for (const raid of raids) {
      if (raid.status === 'EXTRACTED') extracted += 1;
      else if (raid.status === 'DIED') died += 1;
      else fled += 1;
    }
    return { all: raids.length, EXTRACTED: extracted, DIED: died, FLED: fled };
  }, [raids]);

  const filteredRaids = useMemo(() => {
    let result = [...raids];

    if (statusFilter !== 'all') {
      result = result.filter((raid) => raid.status === statusFilter);
    }

    result.sort((a, b) => {
      switch (sortField) {
        case 'timestamp':
          return b.timestamp - a.timestamp;
        case 'netProfit':
          return b.netProfit - a.netProfit;
        case 'roi':
          return b.roi - a.roi;
        case 'kills':
          return b.kills - a.kills;
        default:
          return 0;
      }
    });

    return result;
  }, [raids, statusFilter, sortField]);

  const dayGroups = useMemo<DayGroup[]>(() => {
    const groups = new Map<string, DayGroup>();

    for (const raid of filteredRaids) {
      const date = new Date(raid.timestamp);
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
          raids: [],
          netProfit: 0,
          extracted: 0,
        };
        groups.set(key, group);
      }
      group.raids.push(raid);
      group.netProfit += raid.netProfit;
      if (raid.status === 'EXTRACTED') group.extracted += 1;
    }

    // Newest calendar day first; within each day preserve filtered sort order
    return Array.from(groups.values()).sort((a, b) => {
      const aMax = Math.max(...a.raids.map((r) => r.timestamp));
      const bMax = Math.max(...b.raids.map((r) => r.timestamp));
      return bMax - aMax;
    });
  }, [filteredRaids]);

  const stats = useMemo(() => {
    const totalProfit = filteredRaids.reduce((sum, r) => sum + r.netProfit, 0);
    const avgROI =
      filteredRaids.length > 0
        ? filteredRaids.reduce((sum, r) => sum + r.roi, 0) / filteredRaids.length
        : 0;
    const extractRate =
      filteredRaids.length > 0
        ? (filteredRaids.filter((r) => r.status === 'EXTRACTED').length / filteredRaids.length) * 100
        : 0;
    const totalInvestment = filteredRaids.reduce((sum, r) => sum + r.investment, 0);
    return { totalProfit, avgROI, extractRate, totalInvestment };
  }, [filteredRaids]);

  const sparklineValues = useMemo(() => {
    const recent = [...filteredRaids]
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-20);
    let running = 0;
    return recent.map((raid) => {
      running += raid.netProfit;
      return running;
    });
  }, [filteredRaids]);

  const handleSortClick = () => {
    const fields: SortField[] = ['timestamp', 'netProfit', 'roi', 'kills'];
    const currentIndex = fields.indexOf(sortField);
    setSortField(fields[(currentIndex + 1) % fields.length]);
  };

  const getSortLabel = () => {
    switch (sortField) {
      case 'timestamp':
        return 'Date';
      case 'netProfit':
        return 'Profit';
      case 'roi':
        return 'ROI';
      case 'kills':
        return 'Kills';
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, raidId: string) => {
    e.stopPropagation();
    setDeleteConfirmId(raidId);
  };

  const handleDetailClick = (e: React.MouseEvent, raidId: string) => {
    e.stopPropagation();
    setDetailRaidId(raidId);
  };

  const handleDeleteConfirm = () => {
    if (deleteConfirmId) {
      deleteRaid(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  const handleRaidLogged = (raidId: string) => {
    setHighlightRaidId(raidId);
    window.requestAnimationFrame(() => {
      document
        .getElementById(`raid-row-${raidId}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    window.setTimeout(() => setHighlightRaidId(null), 3000);
  };

  const filterTabs: { key: FilterStatus; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'EXTRACTED', label: 'Extracted' },
    { key: 'DIED', label: 'Died' },
    { key: 'FLED', label: 'Fled' },
  ];

  const renderRaidRow = (raid: Raid) => {
    const statusIcon = STATUS_ICONS[raid.status];
    const isHighlight = raid.isHighlight;
    const isNew = highlightRaidId === raid.id;

    return (
      <div
        key={raid.id}
        id={`raid-row-${raid.id}`}
        onClick={() => onRaidClick(raid.id)}
        className={`
          raids-table-row raids-row-rail ${statusRailClass(raid)}
          ${isHighlight ? 'bg-abi-orange/5' : ''}
          ${isNew ? 'animate-row-highlight' : ''}
        `}
      >
        <div className="raids-table-cell status">
          <StatusBadge status={raid.status} icon={statusIcon} />
        </div>

        <div className="raids-table-cell">
          <MapName className="block text-center">{raid.map}</MapName>
          <Caption tone="muted" className="block mt-[var(--space-value-meta)] text-center">
            {raid.mode}
          </Caption>
        </div>

        <div className="raids-table-cell">
          <MapName className="block text-center tabular-nums">{formatCompactDate(raid.timestamp)}</MapName>
          <Caption tone="muted" className="block mt-[var(--space-value-meta)] text-center tabular-nums">
            {formatTime24(raid.timestamp)}
          </Caption>
        </div>

        <div className="raids-table-cell raids-table-cell--inline text-primary">
          <Target size={12} aria-hidden />
          <span className="type-data tabular-nums">{raid.kills}</span>
        </div>

        <div className="raids-table-cell">
          <DataValue>${formatCurrency(raid.investment)}</DataValue>
        </div>

        <div className="raids-table-cell">
          <DataValue tone="positive">${formatCurrency(raid.lootValue)}</DataValue>
        </div>

        <div className={`raids-table-cell ${raid.netProfit >= 0 ? 'profit-positive' : 'profit-negative'}`}>
          <DataValue tone={raid.netProfit >= 0 ? 'positive' : 'negative'}>
            {raid.netProfit >= 0 ? '+' : ''}${formatCurrency(raid.netProfit)}
          </DataValue>
        </div>

        <div className={`raids-table-cell ${raid.roi >= 0 ? 'roi-positive' : 'roi-negative'}`}>
          <DataValue tone={raid.roi >= 0 ? 'positive' : 'negative'}>{formatPercentage(raid.roi)}</DataValue>
        </div>

        <div className="raids-table-actions">
          {isHighlight && (
            <span className="text-abi-orange text-sm mr-1" title="Highlight">
              ★
            </span>
          )}
          <button
            onClick={(e) => handleDetailClick(e, raid.id)}
            className="p-1.5 rounded hover:bg-abi-orange/20 text-abi-text-dim hover:text-abi-orange transition-colors"
            title="View details"
          >
            <Eye size={14} />
          </button>
          <button
            onClick={(e) => handleDeleteClick(e, raid.id)}
            className="p-1.5 rounded hover:bg-abi-danger/20 text-abi-text-dim hover:text-abi-danger transition-colors"
            title="Delete raid"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Field operations"
        title="Raids"
        meta={`${raids.length} logged · ${filteredRaids.length} shown`}
        actions={<RoiViewToggle />}
      />

      <EnterRaidTrigger
        isOpen={debriefOpen}
        onOpen={() => setDebriefOpen(true)}
        onClose={() => setDebriefOpen(false)}
        onRaidLogged={handleRaidLogged}
      />

      {raids.length > 0 && (
        <RevealSection immediate delay={0.04}>
          <section aria-label="Field ops snapshot" className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <StaggerContainer className="contents" immediate>
              <StaggerItem>
                <StatCard
                  label="Operations"
                  value={filteredRaids.length}
                  subValue={`of ${raids.length} logged`}
                  icon={<Calendar size={18} />}
                />
              </StaggerItem>
              <StaggerItem>
                <StatCard
                  label="Net result"
                  value={`${stats.totalProfit >= 0 ? '+' : ''}$${formatCurrency(stats.totalProfit)}`}
                  subValue={`$${formatCurrency(stats.totalInvestment)} invested`}
                  icon={<TrendingUp size={18} />}
                  trend={stats.totalProfit >= 0 ? 'up' : 'down'}
                />
              </StaggerItem>
              <StaggerItem>
                <StatCard
                  label="Avg ROI"
                  value={formatPercentage(stats.avgROI)}
                  subValue="Across filtered ops"
                  icon={<Wallet size={18} />}
                  trend={stats.avgROI >= 0 ? 'up' : 'down'}
                />
              </StaggerItem>
              <StaggerItem>
                <StatCard
                  label="Extract rate"
                  value={`${stats.extractRate.toFixed(1)}%`}
                  subValue="Survival under filter"
                  icon={<Target size={18} />}
                />
              </StaggerItem>
            </StaggerContainer>
          </section>
        </RevealSection>
      )}

      {sparklineValues.length >= 2 && (
        <RevealSection immediate delay={0.06}>
          <div className="raids-trend-strip">
            <div className="raids-trend-strip__copy">
              <MetaLabel tone="accent">P/L trend</MetaLabel>
              <Caption tone="muted" className="mt-1 block">
                Cumulative net across the latest {sparklineValues.length} filtered operations.
              </Caption>
            </div>
            <SparklineDraw
              values={sparklineValues}
              width={280}
              height={44}
              positive={stats.totalProfit >= 0}
              className="raids-trend-strip__chart"
            />
          </div>
        </RevealSection>
      )}

      <div className="raids-split-layout raids-split-layout--ledger-only" ref={containerRef}>
        <div className="raids-content-block">
          <div className="raids-table-wrapper">
            <div className="raids-table-header">
              <div>
                <h2>Raid ledger</h2>
                <p className="text-xs text-abi-text-muted mt-1 font-mono">
                  {filteredRaids.length} ops · filter totals above
                  {sortField !== 'timestamp' ? ` · sorted by ${getSortLabel()}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap justify-end">
                <span className="text-xs text-abi-text-dim uppercase tracking-wider font-mono">
                  Sort: {getSortLabel()}
                </span>
                <button
                  onClick={handleSortClick}
                  className="p-2 rounded border border-abi-border hover:border-abi-orange hover:text-abi-orange transition-colors"
                  title="Cycle sort field"
                >
                  <SortDesc size={14} />
                </button>
              </div>
            </div>

            <div className="raids-filters">
              <div className="filter-tabs">
                {filterTabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setStatusFilter(tab.key)}
                    className={`filter-tab ${statusFilter === tab.key ? 'active' : ''}`}
                  >
                    {tab.label} ({filterCounts[tab.key]})
                  </button>
                ))}
              </div>
            </div>

            <div className="raids-table-head">
              <div>Status</div>
              <div>Map</div>
              <div>Date</div>
              <div>Combat</div>
              <div>Invest</div>
              <div>Loot</div>
              <div>Net</div>
              <div>ROI</div>
              <div></div>
            </div>

            <div className="raids-table" style={{ maxHeight: containerHeight, overflowY: 'auto' }}>
              {filteredRaids.length > 0 ? (
                <div className="raids-day-timeline">
                  {dayGroups.map((group) => (
                    <RevealSection key={group.key}>
                      <section aria-label={group.label} className="raids-day-group">
                        <div className="raids-day-group__header">
                          <span
                            aria-hidden
                            className={`raids-day-group__node ${
                              group.netProfit >= 0
                                ? 'raids-day-group__node--positive'
                                : 'raids-day-group__node--negative'
                            }`}
                          />
                          <div className="raids-day-group__title">
                            <MapName className="raids-day-group__date">{group.label}</MapName>
                            <div className="raids-day-group__meta">
                              <Badge variant="default" size="sm">
                                {group.raids.length} {group.raids.length === 1 ? 'OP' : 'OPS'}
                              </Badge>
                              <Badge
                                variant={extractBadgeVariant(group.extracted, group.raids.length)}
                                size="sm"
                              >
                                {group.extracted}/{group.raids.length} EXTRACT
                              </Badge>
                            </div>
                          </div>
                          <DataValue
                            tone={group.netProfit >= 0 ? 'positive' : 'negative'}
                            className="raids-day-group__net tabular-nums"
                          >
                            {group.netProfit >= 0 ? '+' : ''}${formatCurrency(group.netProfit)}
                          </DataValue>
                        </div>
                        <div className="raids-day-group__rows">
                          {group.raids.map((raid) => renderRaidRow(raid))}
                        </div>
                      </section>
                    </RevealSection>
                  ))}
                </div>
              ) : (
                <div className="p-6">
                  <EmptyState
                    icon={<Skull size={36} />}
                    title={raids.length === 0 ? 'No raids yet' : 'No matching raids'}
                    description={
                      raids.length === 0
                        ? 'Use the mission debrief panel to record your first raid.'
                        : 'Try switching the status filter.'
                    }
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {deleteConfirmId && (
        <div className="modal-wrapper" onClick={() => setDeleteConfirmId(null)}>
          <div
            className="modal-container"
            style={{ width: '400px', height: 'auto', maxHeight: 'none' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="main-modal"
              style={{
                position: 'relative',
                opacity: 1,
                filter: 'none',
                pointerEvents: 'auto',
                transform: 'none',
              }}
            >
              <h3 className="font-mono text-xs uppercase tracking-[0.14em] text-abi-text mb-2">
                Delete raid
              </h3>
              <p className="text-sm text-abi-text-muted mb-6">
                This raid will be removed from local storage. This cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="px-4 py-2 border border-abi-border rounded-md text-sm font-mono uppercase tracking-wider text-abi-text-muted hover:text-abi-text hover:border-abi-orange transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 bg-abi-danger hover:brightness-110 rounded-md text-sm text-white font-mono uppercase tracking-wider font-semibold transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {detailRaidId && (
        <RaidDetailPopup raidId={detailRaidId} isOpen={true} onClose={() => setDetailRaidId(null)} />
      )}
    </div>
  );
}
