import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { Button, Input, Badge, VirtualScroll, EmptyState, Tabs } from '../components/ui';
import { getRaids } from '../utils/storage';
import { formatCurrency, formatDateTime, formatPercentage } from '../utils/economy';
import { STATUS_ICONS } from '../data/constants';
import { Search, SortDesc, Plus, Clock, Target, Skull } from 'lucide-react';
import type { Raid, RaidStatus } from '../types';
import { LogRaidModal } from './LogRaidModal';

interface RaidLedgerProps {
  onRaidClick: (raidId: string) => void;
}

type SortField = 'timestamp' | 'netProfit' | 'roi' | 'kills';
type FilterStatus = 'all' | RaidStatus;

export function RaidLedger({ onRaidClick }: RaidLedgerProps) {
  const raids = getRaids();
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(600);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [sortField, setSortField] = useState<SortField>('timestamp');

  // Modal
  const [showLogModal, setShowLogModal] = useState(false);

  // Update container height on resize
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight - 60);
      }
    };
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  // Filtered and sorted raids
  const filteredRaids = useMemo(() => {
    let result = [...raids];

    // Search
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(raid =>
        raid.map.toLowerCase().includes(searchLower) ||
        raid.mode.toLowerCase().includes(searchLower) ||
        raid.loot.some(l => l.name.toLowerCase().includes(searchLower))
      );
    }

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
  }, [raids, search, statusFilter, sortField]);

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

  const renderRaidRow = useCallback((raid: Raid) => {
    const statusIcon = STATUS_ICONS[raid.status];
    const isHighlight = raid.isHighlight;

    return (
      <div
        key={raid.id}
        onClick={() => onRaidClick(raid.id)}
        className={`
          flex items-center gap-3 px-3 py-2 cursor-pointer
          border-b border-abi-border transition-colors
          hover:bg-abi-bg-hover
          ${isHighlight ? 'bg-abi-orange/5 border-l-2 border-l-abi-orange' : ''}
        `}
        style={{ height: 64 }}
      >
        {/* Status */}
        <div className="w-20">
          <Badge
            variant={raid.status === 'EXTRACTED' ? 'success' : raid.status === 'DIED' ? 'danger' : 'warning'}
            size="sm"
          >
            {statusIcon} {raid.status}
          </Badge>
        </div>

        {/* Map & Mode */}
        <div className="w-28">
          <p className="text-sm font-medium text-abi-text">{raid.map}</p>
          <p className="text-xs text-abi-text-dim">{raid.mode}</p>
        </div>

        {/* Date */}
        <div className="w-32">
          <p className="text-xs text-abi-text-muted">{formatDateTime(raid.timestamp)}</p>
        </div>

        {/* Duration */}
        <div className="w-16 flex items-center gap-1 text-abi-text-dim">
          <Clock size={12} />
          <span className="text-sm">{raid.duration}m</span>
        </div>

        {/* Combat */}
        <div className="w-16 flex items-center gap-1 text-abi-text-dim">
          <Target size={12} />
          <span className="text-sm">{raid.kills}</span>
          <Skull size={12} className="text-red-400" />
          <span className="text-sm">{raid.deaths}</span>
        </div>

        {/* Investment */}
        <div className="w-24 text-right">
          <p className="text-sm text-abi-text">${formatCurrency(raid.investment)}</p>
        </div>

        {/* Loot */}
        <div className="w-24 text-right">
          <p className="text-sm text-green-400">${formatCurrency(raid.lootValue)}</p>
        </div>

        {/* Net Profit */}
        <div className="w-28 text-right">
          <p className={`text-lg font-bold ${raid.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {raid.netProfit >= 0 ? '+' : ''}${formatCurrency(raid.netProfit)}
          </p>
        </div>

        {/* ROI */}
        <div className="w-16 text-right">
          <p className={`text-sm ${raid.roi >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {formatPercentage(raid.roi)}
          </p>
        </div>

        {/* Highlight indicator */}
        {isHighlight && (
          <div className="w-6 flex justify-center">
            <span className="text-abi-orange">★</span>
          </div>
        )}
      </div>
    );
  }, [onRaidClick]);

  // Stats summary
  const stats = useMemo(() => {
    const totalProfit = filteredRaids.reduce((sum, r) => sum + r.netProfit, 0);
    const avgROI = filteredRaids.length > 0
      ? filteredRaids.reduce((sum, r) => sum + r.roi, 0) / filteredRaids.length
      : 0;
    const extractRate = filteredRaids.length > 0
      ? (filteredRaids.filter(r => r.status === 'EXTRACTED').length / filteredRaids.length) * 100
      : 0;
    return { totalProfit, avgROI, extractRate };
  }, [filteredRaids]);

  return (
    <div className="h-full flex flex-col" ref={containerRef}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-abi-text">Raid Ledger</h1>
          <p className="text-abi-text-muted text-sm mt-1">
            {filteredRaids.length} raids • ${formatCurrency(stats.totalProfit)} total
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowLogModal(true)} glow>
          <Plus size={18} className="mr-1" /> Log Raid
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <Input
          placeholder="Search raids..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          icon={<Search size={16} />}
          className="w-64"
        />

        <Tabs
          tabs={[
            { id: 'all', label: 'All' },
            { id: 'EXTRACTED', label: 'Extracted' },
            { id: 'DIED', label: 'Died' },
            { id: 'FLED', label: 'Fled' },
          ]}
          activeTab={statusFilter}
          onChange={(id) => setStatusFilter(id as FilterStatus)}
        />

        <Button
          variant="secondary"
          size="sm"
          onClick={handleSortClick}
          className="ml-auto"
        >
          <SortDesc size={14} className="mr-1" /> {getSortLabel()}
        </Button>
      </div>

      {/* Table Header */}
      <div className="flex items-center gap-3 px-3 py-2 bg-abi-bg-elevated border border-abi-border rounded-t-lg text-xs text-abi-text-muted uppercase tracking-wider">
        <div className="w-20">Status</div>
        <div className="w-28">Map</div>
        <div className="w-32">Date</div>
        <div className="w-16">Time</div>
        <div className="w-16">Combat</div>
        <div className="w-24 text-right">Invest</div>
        <div className="w-24 text-right">Loot</div>
        <div className="w-28 text-right">Net</div>
        <div className="w-16 text-right">ROI</div>
      </div>

      {/* Virtual List */}
      <div className="flex-1 border border-t-0 border-abi-border rounded-b-lg overflow-hidden bg-abi-bg-card">
        {filteredRaids.length > 0 ? (
          <VirtualScroll
            items={filteredRaids}
            itemHeight={64}
            containerHeight={containerHeight}
            renderItem={renderRaidRow}
            overscan={5}
          />
        ) : (
          <EmptyState
            icon={<Skull size={48} />}
            title="No raids found"
            description={raids.length === 0 ? "Log your first raid to get started" : "Try adjusting your filters"}
            action={
              raids.length === 0 && (
                <Button variant="primary" onClick={() => setShowLogModal(true)}>
                  Log First Raid
                </Button>
              )
            }
          />
        )}
      </div>

      {/* Log Modal */}
      <LogRaidModal
        isOpen={showLogModal}
        onClose={() => setShowLogModal(false)}
      />
    </div>
  );
}
