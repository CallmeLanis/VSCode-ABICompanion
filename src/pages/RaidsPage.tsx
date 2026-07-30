import { useState, useMemo, useRef, useEffect } from 'react';
import { SortDesc, Clock, Target, Skull, Trash2, Eye } from 'lucide-react';
import { deleteRaid } from '../utils/storage';
import { useRoiRaids } from '../hooks/useStorageQuery';
import { RaidDetailPopup } from './RaidDetailPopup';
import { formatCurrency, formatDateTime, formatPercentage } from '../utils/economy';
import { STATUS_ICONS } from '../data/constants';
import { Caption, DataValue, EmptyState, MapName, PageHeader, RoiViewToggle, StatusBadge } from '../components/ui';
import { EnterRaidTrigger } from '../components/debrief/MissionDebrief';
import type { Raid, RaidStatus } from '../types';

type SortField = 'timestamp' | 'netProfit' | 'roi' | 'kills';
type FilterStatus = 'all' | RaidStatus;
type Density = 'compact' | 'economy' | 'combat';

export function RaidsPage({ onRaidClick }: { onRaidClick: (raidId: string) => void }) {
  const raids = useRoiRaids();
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(600);

  // Filters
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [density, setDensity] = useState<Density>('economy');

  // Modals
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [detailRaidId, setDetailRaidId] = useState<string | null>(null);

  // Update container height on resize
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

  // Filtered and sorted raids
  const filteredRaids = useMemo(() => {
    let result = [...raids];

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(raid => raid.status === statusFilter);
    }

    // Sort (always descending)
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

  // Cycle through sort fields
  const handleSortClick = () => {
    const fields: SortField[] = ['timestamp', 'netProfit', 'roi', 'kills'];
    const currentIndex = fields.indexOf(sortField);
    const nextIndex = (currentIndex + 1) % fields.length;
    setSortField(fields[nextIndex]);
  };

  const getSortLabel = () => {
    switch (sortField) {
      case 'timestamp': return 'Date';
      case 'netProfit': return 'Profit';
      case 'roi': return 'ROI';
      case 'kills': return 'Kills';
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

  const [highlightRaidId, setHighlightRaidId] = useState<string | null>(null);
  const [debriefOpen, setDebriefOpen] = useState(false);

  const handleRaidLogged = (raidId: string) => {
    setHighlightRaidId(raidId);
    window.setTimeout(() => setHighlightRaidId(null), 3000);
  };

  const renderRaidRow = (raid: Raid) => {
    const statusIcon = STATUS_ICONS[raid.status];
    const isHighlight = raid.isHighlight;
    const isNew = highlightRaidId === raid.id;

    return (
      <div
        key={raid.id}
        onClick={() => onRaidClick(raid.id)}
        className={`
          raids-table-row
          ${isHighlight ? 'bg-abi-orange/5 border-l-2 border-l-abi-orange' : ''}
          ${isNew ? 'animate-row-highlight' : ''}
        `}
      >
        {/* Status */}
        <div className="raids-table-cell status">
          <StatusBadge status={raid.status} icon={statusIcon} />
        </div>

        {/* Map & Mode */}
        <div className="raids-table-cell">
          <MapName className="block">{raid.map}</MapName>
          <Caption tone="muted" className="block mt-[var(--space-value-meta)]">{raid.mode}</Caption>
        </div>

        {/* Date */}
        <div className="raids-table-cell">
          <Caption>{formatDateTime(raid.timestamp)}</Caption>
        </div>

        {/* Duration */}
        <div className="raids-table-cell flex items-center gap-1 text-abi-text-dim">
          <Clock size={12} />
          <span className="text-sm tabular-nums">{raid.duration}m</span>
        </div>

        {/* Combat */}
        <div className="raids-table-cell flex items-center gap-1 text-abi-text-dim">
          <Target size={12} />
          <span className="text-sm tabular-nums">{raid.kills}</span>
          <Skull size={12} className="text-abi-danger" />
          <span className="text-sm tabular-nums">{raid.deaths}</span>
        </div>

        {/* Investment */}
        <div className="raids-table-cell text-right">
          <DataValue>${formatCurrency(raid.investment)}</DataValue>
        </div>

        {/* Loot */}
        <div className="raids-table-cell text-right">
          <DataValue tone="positive">${formatCurrency(raid.lootValue)}</DataValue>
        </div>

        {/* Net Profit */}
        <div className={`raids-table-cell text-right ${raid.netProfit >= 0 ? 'profit-positive' : 'profit-negative'}`}>
          <DataValue tone={raid.netProfit >= 0 ? 'positive' : 'negative'}>
            {raid.netProfit >= 0 ? '+' : ''}${formatCurrency(raid.netProfit)}
          </DataValue>
        </div>

        {/* ROI */}
        <div className={`raids-table-cell text-right ${raid.roi >= 0 ? 'roi-positive' : 'roi-negative'}`}>
          <DataValue tone={raid.roi >= 0 ? 'positive' : 'negative'}>{formatPercentage(raid.roi)}</DataValue>
        </div>

        {/* Action buttons */}
        <div className="raids-table-actions">
          {isHighlight && <span className="text-abi-orange text-sm mr-1" title="Highlight">★</span>}
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

  // Stats summary
  const stats = useMemo(() => {
    const totalProfit = filteredRaids.reduce((sum, r) => sum + r.netProfit, 0);
    const avgROI = filteredRaids.length > 0
      ? filteredRaids.reduce((sum, r) => sum + r.roi, 0) / filteredRaids.length
      : 0;
    const extractRate = filteredRaids.length > 0
      ? (filteredRaids.filter(r => r.status === 'EXTRACTED').length / filteredRaids.length) * 100
      : 0;
    const totalInvestment = filteredRaids.reduce((sum, r) => sum + r.investment, 0);
    return { totalProfit, avgROI, extractRate, totalInvestment };
  }, [filteredRaids]);

  return (
    <div className="space-y-4">
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

      <div className="raids-split-layout raids-split-layout--ledger-only" ref={containerRef}>
      <div className="raids-content-block">
        <div className="raids-table-wrapper" data-density={density}>
          {/* Header */}
          <div className="raids-table-header">
            <div>
              <h2>Raid ledger</h2>
              <p className="text-xs text-abi-text-muted mt-1 font-mono">
                {filteredRaids.length} raids · ${formatCurrency(stats.totalProfit)} net
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <div className="flex gap-1">
                {([
                  ['economy', 'Eco'],
                  ['combat', 'Combat'],
                  ['compact', 'Compact'],
                ] as [Density, string][]).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setDensity(id)}
                    className={`filter-tab ${density === id ? 'active' : ''}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
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

          {/* Status filters */}
          <div className="raids-filters">
            <div className="filter-tabs">
              {(['all', 'EXTRACTED', 'DIED'] as FilterStatus[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`filter-tab ${statusFilter === tab ? 'active' : ''}`}
                >
                  {tab === 'all' ? 'All' : tab}
                </button>
              ))}
            </div>
          </div>

          {/* Table Header */}
          <div className="raids-table-head">
            <div>Status</div>
            <div>Map</div>
            <div>Date</div>
            <div>Time</div>
            <div>Combat</div>
            <div className="text-right">Invest</div>
            <div className="text-right">Loot</div>
            <div className="text-right">Net</div>
            <div className="text-right">ROI</div>
            <div></div>
          </div>

          {/* Virtual List / Table Body */}
          <div className="raids-table" style={{ maxHeight: containerHeight, overflowY: 'auto' }}>
            {filteredRaids.length > 0 ? (
              filteredRaids.map(raid => renderRaidRow(raid))
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

          {/* Stats Row */}
          {filteredRaids.length > 0 && (
            <div className="raids-stats-row">
              <div className="raids-stat-item">
                <div className="stat-label">Total invested</div>
                <div className="stat-value">${formatCurrency(stats.totalInvestment)}</div>
              </div>
              <div className="raids-stat-item">
                <div className="stat-label">Total profit</div>
                <div className={`stat-value ${stats.totalProfit >= 0 ? 'positive' : 'negative'}`}>
                  {stats.totalProfit >= 0 ? '+' : ''}${formatCurrency(stats.totalProfit)}
                </div>
              </div>
              <div className="raids-stat-item">
                <div className="stat-label">Avg ROI</div>
                <div className={`stat-value ${stats.avgROI >= 0 ? 'positive' : 'negative'}`}>
                  {formatPercentage(stats.avgROI)}
                </div>
              </div>
              <div className="raids-stat-item">
                <div className="stat-label">Extract rate</div>
                <div className="stat-value">{stats.extractRate.toFixed(1)}%</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="modal-wrapper" onClick={() => setDeleteConfirmId(null)}>
          <div className="modal-container" style={{ width: '400px', height: 'auto', maxHeight: 'none' }} onClick={(e) => e.stopPropagation()}>
            <div className="main-modal" style={{ position: 'relative', opacity: 1, filter: 'none', pointerEvents: 'auto', transform: 'none' }}>
              <h3 className="font-mono text-xs uppercase tracking-[0.14em] text-abi-text mb-2">Delete raid</h3>
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

      {/* Raid Detail Popup */}
      {detailRaidId && (
        <RaidDetailPopup
          raidId={detailRaidId}
          isOpen={true}
          onClose={() => setDetailRaidId(null)}
        />
      )}
    </div>
  );
}
