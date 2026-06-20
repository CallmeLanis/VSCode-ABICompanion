import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, SortDesc, Plus, Clock, Target, Skull, Trash2, Eye, Swords, Package, Pill, Shield } from 'lucide-react';
import { getRaids, deleteRaid, addRaid, addHighlight, getSessionId, getStoredSettings } from '../utils/storage';
import { RaidDetailPopup } from './RaidDetailPopup';
import { formatCurrency, formatDateTime, formatPercentage } from '../utils/economy';
import { STATUS_ICONS, MAPS, GAME_MODES, AMMO_CALIBERS, CONSUMABLES } from '../data/constants';
import { generateId } from '../utils/storage';
import { calculateRaidEconomy, calculateGearRescue } from '../utils/economy';
import type { Raid, RaidStatus, AmmoEntry, ConsumableEntry, GearRescueData } from '../types';

type SortField = 'timestamp' | 'netProfit' | 'roi' | 'kills';
type FilterStatus = 'all' | RaidStatus;

export function RaidsPage({ onRaidClick }: { onRaidClick: (raidId: string) => void }) {
  const raids = getRaids();
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(600);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [sortField, setSortField] = useState<SortField>('timestamp');

  // Modals
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [detailRaidId, setDetailRaidId] = useState<string | null>(null);

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

  const renderRaidRow = (raid: Raid) => {
    const statusIcon = STATUS_ICONS[raid.status];
    const isHighlight = raid.isHighlight;

    return (
      <div
        key={raid.id}
        onClick={() => onRaidClick(raid.id)}
        className={`
          raids-table-row
          ${isHighlight ? 'bg-abi-orange/5 border-l-2 border-l-abi-orange' : ''}
        `}
      >
        {/* Status */}
        <div className="raids-table-cell status">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${
            raid.status === 'EXTRACTED' ? 'bg-green-900/30 text-green-400 border border-green-700/50' :
            raid.status === 'DIED' ? 'bg-red-900/30 text-red-400 border border-red-700/50' :
            'bg-yellow-900/30 text-yellow-400 border border-yellow-700/50'
          }`}>
            {statusIcon} {raid.status}
          </span>
        </div>

        {/* Map & Mode */}
        <div className="raids-table-cell">
          <p className="text-sm font-medium text-abi-text">{raid.map}</p>
          <p className="text-xs text-abi-text-dim">{raid.mode}</p>
        </div>

        {/* Date */}
        <div className="raids-table-cell">
          <p className="text-xs text-abi-text-muted">{formatDateTime(raid.timestamp)}</p>
        </div>

        {/* Duration */}
        <div className="raids-table-cell flex items-center gap-1 text-abi-text-dim">
          <Clock size={12} />
          <span className="text-sm">{raid.duration}m</span>
        </div>

        {/* Combat */}
        <div className="raids-table-cell flex items-center gap-1 text-abi-text-dim">
          <Target size={12} />
          <span className="text-sm">{raid.kills}</span>
          <Skull size={12} className="text-red-400" />
          <span className="text-sm">{raid.deaths}</span>
        </div>

        {/* Investment */}
        <div className="raids-table-cell text-right">
          <p className="text-sm text-abi-text">${formatCurrency(raid.investment)}</p>
        </div>

        {/* Loot */}
        <div className="raids-table-cell text-right">
          <p className="text-sm text-green-400">${formatCurrency(raid.lootValue)}</p>
        </div>

        {/* Net Profit */}
        <div className={`raids-table-cell text-right ${raid.netProfit >= 0 ? 'profit-positive' : 'profit-negative'}`}>
          <p className="text-lg font-bold">
            {raid.netProfit >= 0 ? '+' : ''}${formatCurrency(raid.netProfit)}
          </p>
        </div>

        {/* ROI */}
        <div className={`raids-table-cell text-right ${raid.roi >= 0 ? 'roi-positive' : 'roi-negative'}`}>
          <p className="text-sm">{formatPercentage(raid.roi)}</p>
        </div>

        {/* Highlight indicator */}
        {isHighlight && (
          <div className="raids-table-cell flex justify-center">
            <span className="text-abi-orange text-lg">★</span>
          </div>
        )}

        {/* Action buttons */}
        <div className="raids-table-actions">
          <button
            onClick={(e) => handleDetailClick(e, raid.id)}
            className="p-1.5 rounded hover:bg-abi-orange/20 text-abi-text-dim hover:text-abi-orange transition-colors"
            title="View details"
          >
            <Eye size={14} />
          </button>
          <button
            onClick={(e) => handleDeleteClick(e, raid.id)}
            className="p-1.5 rounded hover:bg-red-900/30 text-abi-text-dim hover:text-red-400 transition-colors"
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
    <div className="raids-split-layout" ref={containerRef}>
      {/* LEFT COLUMN: Log Raid Block (25%) */}
      <div className="raids-log-block">
        <LogRaidBlock onRaidSaved={() => {}} />
      </div>

      {/* RIGHT COLUMN: Raid Table + Stats (75%) */}
      <div className="raids-content-block">
        <div className="raids-table-wrapper">
          {/* Header */}
          <div className="raids-table-header">
            <div>
              <h2>Raid Ledger</h2>
              <p className="text-xs text-abi-text-muted mt-1">
                {filteredRaids.length} raids • ${formatCurrency(stats.totalProfit)} total
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-abi-text-dim uppercase tracking-wider">
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

          {/* Filters */}
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
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Skull size={48} className="text-abi-text-dim mb-4" />
                <p className="text-abi-text-muted text-sm mb-2">No raids found</p>
                <p className="text-abi-text-dim text-xs">
                  {raids.length === 0 ? "Log your first raid to get started" : "Try adjusting your filters"}
                </p>
              </div>
            )}
          </div>

          {/* Stats Row */}
          {filteredRaids.length > 0 && (
            <div className="raids-stats-row">
              <div className="raids-stat-item">
                <div className="stat-label">Total Invested</div>
                <div className="stat-value">${formatCurrency(stats.totalInvestment)}</div>
              </div>
              <div className="raids-stat-item">
                <div className="stat-label">Total Profit</div>
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
                <div className="stat-label">Extract Rate</div>
                <div className="stat-value">{stats.extractRate.toFixed(1)}%</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="modal-wrapper" onClick={() => setDeleteConfirmId(null)}>
          <div className="modal-container" style={{ width: '400px', height: 'auto', maxHeight: 'none' }} onClick={(e) => e.stopPropagation()}>
            <div className="main-modal" style={{ position: 'relative', opacity: 1, filter: 'none', pointerEvents: 'auto', transform: 'none' }}>
              <h3 className="text-lg font-bold text-abi-text mb-2">Delete Raid</h3>
              <p className="text-sm text-abi-text-muted mb-6">
                Are you sure you want to delete this raid? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="px-4 py-2 border border-abi-border rounded-lg text-sm text-abi-text-muted hover:text-abi-text hover:border-abi-orange transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm text-white font-semibold transition-colors"
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

// ============================================
// LOG RAID BLOCK (Inline Block Component)
// ============================================

function LogRaidBlock({ onRaidSaved }: { onRaidSaved: () => void }) {
  const settings = getStoredSettings();

  // Form state
  const [map, setMap] = useState('tv_station');
  const [mode, setMode] = useState('forbidden');
  const [status, setStatus] = useState<'EXTRACTED' | 'DIED' | ''>('');
  const [kills, setKills] = useState<number | undefined>(undefined);
  const [gearValue, setGearValue] = useState<number | undefined>(undefined);
  const [rescuePercentage, setRescuePercentage] = useState<number | undefined>(undefined);
  const [isRed, setIsRed] = useState(false);

  // Ammo and Consumables
  const [ammo, setAmmo] = useState<AmmoEntry[]>([]);
  const [consumables, setConsumables] = useState<ConsumableEntry[]>([]);

  // Loot
  const [lootValue, setLootValue] = useState<number | undefined>(undefined);

  // Modals
  const [showAmmoModal, setShowAmmoModal] = useState(false);
  const [showConsumablesModal, setShowConsumablesModal] = useState(false);

  // Temp storage for modal data
  const [pendingAmmo, setPendingAmmo] = useState<AmmoEntry[]>([]);
  const [pendingConsumables, setPendingConsumables] = useState<ConsumableEntry[]>([]);

  const handleOpenAmmoModal = () => {
    setPendingAmmo(ammo);
    setShowAmmoModal(true);
  };

  const handleSaveAmmo = (newAmmo: AmmoEntry[]) => {
    setAmmo(newAmmo);
  };

  const handleOpenConsumablesModal = () => {
    setPendingConsumables(consumables);
    setShowConsumablesModal(true);
  };

  const handleSaveConsumables = (newConsumables: ConsumableEntry[]) => {
    setConsumables(newConsumables);
  };

  const gearRescue: GearRescueData | undefined = status === 'DIED' && (rescuePercentage ?? 0) > 0 && (gearValue ?? 0) > 0
    ? calculateGearRescue(gearValue ?? 0, rescuePercentage ?? 0)
    : undefined;

  const raidPreview = useMemo(() => {
    const previewRaid = {
      ammo,
      consumables,
      gearValue: gearValue ?? 0,
      gearRescue,
      loot: [],
      lootValue: lootValue ?? 0,
    };
    const taxRate = settings.globalTaxRate ?? 0.10;
    return calculateRaidEconomy(previewRaid, taxRate);
  }, [ammo, consumables, gearValue, gearRescue, lootValue, settings]);

  const handleSave = () => {
    const now = Date.now();
    const raidId = generateId();
    const raid: Raid = {
      id: raidId,
      timestamp: now,
      map: MAPS.find(m => m.id === map)?.name || map,
      mode: (GAME_MODES.find(m => m.id === mode)?.name || mode) as any,
      status: (status || 'EXTRACTED') as any,
      duration: 0, // Duration removed per requirements
      ammo,
      consumables,
      gearValue: gearValue ?? 0,
      gearRescue,
      loot: [],
      lootValue: lootValue ?? 0,
      kills: kills ?? 0,
      deaths: 0, // Deaths removed per requirements
      investment: raidPreview.investment,
      netProfit: raidPreview.netProfit,
      roi: raidPreview.roi,
      isHighlight: isRed, // Red flag maps to highlight
      highlightReason: isRed ? 'Red flagged raid' : undefined,
      sessionId: getSessionId(now, settings.sessionDuration ?? 60),
    };

    addRaid(raid);

    // Auto-generate highlights based on thresholds
    const storedSettings = getStoredSettings();
    const profitThreshold = storedSettings.highlightProfitThreshold ?? 50000;
    const killThreshold = storedSettings.highlightKillThreshold ?? 5;

    // 1. RED toggle → category 'rare'
    if (isRed) {
      addHighlight({
        raidId,
        timestamp: now,
        category: 'rare',
        reason: `Red item found`,
        isFavorite: false,
      });
    }

    // 2. Net profit meets threshold → category 'profit'
    if (raid.netProfit >= profitThreshold) {
      addHighlight({
        raidId,
        timestamp: now,
        category: 'profit',
        reason: `Net profit $${raid.netProfit.toLocaleString()}`,
        isFavorite: false,
      });
    }

    // 3. Kills meets threshold → category 'kills'
    if ((kills ?? 0) >= killThreshold) {
      addHighlight({
        raidId,
        timestamp: now,
        category: 'kills',
        reason: `${kills} kills`,
        isFavorite: false,
      });
    }

    onRaidSaved();
    handleClose();
  };

  const handleClose = () => {
    setMap('tv_station');
    setMode('forbidden');
    setStatus('');
    setKills(undefined);
    setGearValue(undefined);
    setRescuePercentage(undefined);
    setIsRed(false);
    setAmmo([]);
    setConsumables([]);
    setLootValue(undefined);
  };

  const ammoTotalCost = ammo.reduce((sum, a) => sum + a.totalCost, 0);
  const consumablesTotalCost = consumables.reduce((sum, c) => sum + c.totalCost, 0);

  return (
    <div className="log-raid-block">
      {/* Header */}
      <div className="log-raid-block-header">
        <Shield size={18} />
        <h2>Log Raid</h2>
      </div>

      {/* Row 1: Status */}
      <div className="form-group">
        <label>STATUS</label>
        <div className="status-toggle-group">
          <button
            type="button"
            onClick={() => setStatus('EXTRACTED')}
            className={`status-toggle-btn ${status === 'EXTRACTED' ? 'active-extracted' : ''}`}
          >
            ✓ Extracted
          </button>
          <button
            type="button"
            onClick={() => setStatus('DIED')}
            className={`status-toggle-btn ${status === 'DIED' ? 'active-died' : ''}`}
          >
            ✗ Died
          </button>
        </div>
      </div>

      {/* Row 2: Map + Mode */}
      <div className="grid grid-cols-2 gap-2">
        <div className="form-group">
          <label>MAP</label>
          <select
            value={map}
            onChange={(e) => setMap(e.target.value)}
            className="w-full px-3 py-2 bg-abi-bg border border-abi-border rounded-lg text-abi-text text-sm"
          >
            {MAPS.map(m => (
              <option key={m.id} value={m.id}>{m.name.toUpperCase()}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>MODE</label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className="w-full px-3 py-2 bg-abi-bg border border-abi-border rounded-lg text-abi-text text-sm"
          >
            {GAME_MODES.map(m => (
              <option key={m.id} value={m.id}>{m.name.toUpperCase()}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Row 3: Gear Value */}
      <div className="form-group">
        <label>GEAR VALUE BROUGHT</label>
        <input
          type="number"
          min={0}
          value={gearValue ?? ''}
          onChange={(e) => setGearValue(e.target.value ? parseInt(e.target.value) : undefined)}
          className="w-full px-3 py-2 bg-abi-bg border border-abi-border rounded-lg text-abi-text text-sm"
          placeholder="0"
        />
      </div>

      {/* Row 4: Kills + RED Toggle (1:3 ratio) */}
      <div className="kills-red-row">
        <div className="form-group kills-block">
          <label>KILLS</label>
          <input
            type="number"
            min={0}
            value={kills ?? ''}
            onChange={(e) => setKills(e.target.value ? parseInt(e.target.value) : undefined)}
            className="w-full px-3 py-2 bg-abi-bg border border-abi-border rounded-lg text-abi-text text-sm"
            placeholder="0"
          />
        </div>
        <div className="form-group red-toggle-block">
          <label>RED</label>
          <button
            type="button"
            onClick={() => setIsRed(!isRed)}
            className={`w-full px-3 py-2 rounded-lg border text-sm font-semibold uppercase tracking-wider transition-all h-full ${
              isRed
                ? 'bg-red-600/20 border-red-500 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.4)]'
                : 'bg-abi-bg border-abi-border text-abi-text-dim hover:border-abi-text-dim'
            }`}
          >
            {isRed ? '● RED ITEM FOUND' : '○ NO RED ITEM'}
          </button>
        </div>
      </div>

      {/* Rescue Percentage Slider (only when Died) */}
      {status === 'DIED' && (gearValue ?? 0) > 0 && (
        <div className="rescue-slider-container">
          <div className="rescue-slider-label">
            <span>Rescue Percentage</span>
            <span className="rescue-slider-value">{rescuePercentage ?? 0}%</span>
          </div>
          <div className="rescue-slider-track">
            <div
              className="rescue-slider-fill"
              style={{ width: `${rescuePercentage ?? 0}%` }}
            />
            <input
              type="range"
              min={0}
              max={100}
              value={rescuePercentage ?? 0}
              onChange={(e) => setRescuePercentage(parseInt(e.target.value))}
              className="rescue-slider-input"
            />
          </div>
          <div className="rescue-slider-ticks">
            <span className="rescue-slider-tick">0</span>
            <span className="rescue-slider-tick">25</span>
            <span className="rescue-slider-tick">50</span>
            <span className="rescue-slider-tick">75</span>
            <span className="rescue-slider-tick">100</span>
          </div>
          {gearRescue && (
            <div className="mt-3 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-abi-text-muted">Rescued Value:</span>
                <span className="text-green-400">${gearRescue.rescuedValue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-abi-text-muted">Gear Loss:</span>
                <span className="text-red-400">${gearRescue.gearLoss.toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Divider */}
      <div className="my-4 border-t border-abi-border" />

      {/* Row 5: Ammunition (Total Only) */}
      <div className="form-group">
        <label>AMMUNITION</label>
        <div className="log-mini-item">
          <span>Total Ammo Value</span>
          <span>${ammoTotalCost.toLocaleString()}</span>
        </div>
        <button
          type="button"
          onClick={handleOpenAmmoModal}
          className="w-full mt-2 px-3 py-2 border border-abi-border rounded-lg text-xs font-semibold text-abi-text-muted hover:text-abi-orange hover:border-abi-orange transition-colors"
        >
          {ammo.length > 0 ? 'Edit Ammo' : '+ Add Ammo'}
        </button>
      </div>

      {/* Row 6: Consumables (Total Only) */}
      <div className="form-group">
        <label>CONSUMABLES</label>
        <div className="log-mini-item">
          <span>Total Consumables Value</span>
          <span>${consumablesTotalCost.toLocaleString()}</span>
        </div>
        <button
          type="button"
          onClick={handleOpenConsumablesModal}
          className="w-full mt-2 px-3 py-2 border border-abi-border rounded-lg text-xs font-semibold text-abi-text-muted hover:text-abi-orange hover:border-abi-orange transition-colors"
        >
          {consumables.length > 0 ? 'Edit Consumables' : '+ Add Consumables'}
        </button>
      </div>

      {/* Loot Value */}
      <div className="form-group">
        <label>LOOT VALUE</label>
        <input
          type="number"
          min={0}
          value={lootValue ?? ''}
          onChange={(e) => setLootValue(e.target.value ? parseInt(e.target.value) : undefined)}
          className="w-full px-3 py-2 bg-abi-bg border border-abi-border rounded-lg text-abi-text text-sm"
          placeholder="0"
        />
      </div>

      {/* Summary */}
      <div className="mt-4 p-3 bg-abi-bg rounded-lg border border-abi-border">
        <div className="grid grid-cols-2 gap-2 text-center">
          <div>
            <p className="text-xs text-abi-text-dim mb-1">Investment</p>
            <p className="text-sm font-bold text-abi-text">${raidPreview.investment.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-abi-text-dim mb-1">Net Profit</p>
            <p className={`text-sm font-bold ${raidPreview.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {raidPreview.netProfit >= 0 ? '+' : ''}${raidPreview.netProfit.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-4 space-y-2">
        <button
          type="button"
          onClick={handleSave}
          className="btn-primary"
        >
          Save Raid
        </button>
        <button
          type="button"
          onClick={handleClose}
          className="btn-secondary"
        >
          Reset
        </button>
      </div>

      {/* Nested Modals */}
      <AmmoPickerModal
        isOpen={showAmmoModal}
        onClose={() => setShowAmmoModal(false)}
        onSave={handleSaveAmmo}
        initialAmmo={pendingAmmo}
      />
      <ConsumablesPickerModal
        isOpen={showConsumablesModal}
        onClose={() => setShowConsumablesModal(false)}
        onSave={handleSaveConsumables}
        initialConsumables={pendingConsumables}
      />
    </div>
  );
}

// ============================================
// AMMO PICKER MODAL (Split-Screen + Radial)
// ============================================

function AmmoPickerModal({ isOpen, onClose, onSave, initialAmmo = [] }: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (ammo: AmmoEntry[]) => void;
  initialAmmo?: AmmoEntry[];
}) {
  const [ammo, setAmmo] = useState<AmmoEntry[]>(initialAmmo);
  const [selectedCaliber, setSelectedCaliber] = useState<string>('');
  const [selectedTier, setSelectedTier] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [hasChild, setHasChild] = useState(false);
  const [expandedCaliber, setExpandedCaliber] = useState<string | null>(null);

  const handleAddAmmo = (tierId: string) => {
    if (!selectedCaliber || !tierId) return;

    const caliberData = AMMO_CALIBERS.find(c => c.id === selectedCaliber);
    if (!caliberData) return;

    const tierData = caliberData.tiers.find(t => t.id === tierId);
    if (!tierData) return;

    const newAmmo: AmmoEntry = {
      id: generateId(),
      caliber: caliberData.name,
      tier: tierData.name,
      quantity: 1,
      costPerRound: tierData.costPerRound,
      totalCost: tierData.costPerRound,
    };
    setAmmo([...ammo, newAmmo]);
    setSelectedTier('');
    // Open child modal to show the list
    setHasChild(true);
  };

  const handleRemoveAmmo = (id: string) => {
    setAmmo(ammo.filter(a => a.id !== id));
  };

  const handleUpdateQuantity = (id: string, newQuantity: number) => {
    setAmmo(ammo.map(a => {
      if (a.id === id) {
        return {
          ...a,
          quantity: newQuantity,
          totalCost: a.costPerRound * newQuantity,
        };
      }
      return a;
    }));
  };

  const handleSave = () => {
    onSave(ammo);
    setHasChild(false);
    onClose();
  };

  const handleCloseChild = () => {
    setHasChild(false);
  };

  const handleCloseMain = () => {
    setHasChild(false);
    onClose();
  };

  const totalCost = ammo.reduce((sum, a) => sum + a.totalCost, 0);

  // Get tier options for selected caliber
  const getTierOptions = () => {
    if (!selectedCaliber) return [];
    const caliberData = AMMO_CALIBERS.find(c => c.id === selectedCaliber);
    if (!caliberData) return [];
    return caliberData.tiers.map(t => ({ value: t.id, label: `${t.name} ($${t.costPerRound}/round)` }));
  };

  // Extract tier number from tier name (e.g., "M995" -> "T5", "M855" -> "T4")
  const getTierNumber = (tierName: string): string => {
    // Simple heuristic based on cost
    const costMap: Record<string, string> = {
      'PS': 'T2', 'BP': 'T5', 'BT': 'T4', 'BS': 'T5',
      'M855': 'T3', 'M856A1': 'T4', 'M995': 'T5',
      'R37F': 'T3', 'SS198': 'T4', 'SS190': 'T4',
      'DVC12': 'T5', 'M855A1': 'T4', 'DVP88': 'T5',
      'PST': 'T2', 'LRNPC': 'T3',
      'AP-6.8': 'T5', 'M80': 'T3', 'M61': 'T5', 'M993': 'T5',
      'LPS': 'T3', 'BT-7.62': 'T4', '7BT1': 'T5',
      'AP-9mm': 'T4', 'RIP': 'T4',
      'SP-5': 'T3', 'SP-6': 'T4', 'BP-9x39': 'T5',
      'FMJ': 'T2', 'AP20': 'T5',
      'Buckshot': 'T2', 'Slug': 'T3', 'Flechette': 'T4', 'AP-20': 'T5',
    };
    return costMap[tierName] || 'T3';
  };

  if (!isOpen) return null;

  return (
    <div className="modal-wrapper" onClick={handleCloseMain}>
      <div className={`modal-container ${hasChild ? 'has-child' : ''}`} onClick={(e) => e.stopPropagation()}>
        {/* Main Modal: Caliber/Tier Selection */}
        <div className="main-modal">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-abi-text font-orbitron">Add Ammo</h3>
            <button
              onClick={handleCloseMain}
              className="p-2 rounded-lg border border-abi-border hover:border-abi-orange hover:text-abi-orange transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Caliber Selection with Radial Accordion - 2 Column Grid (CLICK-BASED) */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-abi-text-muted uppercase tracking-wider mb-3">
              Select Caliber
            </label>
            <div className="grid grid-cols-2 gap-2">
              {AMMO_CALIBERS.map(caliber => {
                const isOpen = expandedCaliber === caliber.id;
                return (
                  <div key={caliber.id} className={`caliber-group ${isOpen ? 'is-open' : ''}`}>
                    <div
                      className={`caliber-node ${selectedCaliber === caliber.id ? 'border-abi-orange' : ''}`}
                      onClick={() => {
                        setSelectedCaliber(caliber.id);
                        setSelectedTier('');
                        setExpandedCaliber(isOpen ? null : caliber.id);
                      }}
                    >
                      <span>{caliber.name}</span>
                      <span className="text-xs text-abi-text-dim">{caliber.tiers.length}</span>
                    </div>
                    {/* Tier Branch (Radial Accordion) */}
                    <div className="tier-branch">
                      {caliber.tiers.map(tier => (
                      <div
                        key={tier.id}
                        data-tier={getTierNumber(tier.name)}
                        className={`tier-node ${selectedTier === tier.id ? 'border-abi-orange bg-abi-orange/10' : ''}`}
                        onClick={() => {
                          setSelectedTier(tier.id);
                          handleAddAmmo(tier.id);
                        }}
                      >
                        <span>{tier.name}</span>
                        <span className="tier-cost">${tier.costPerRound}</span>
                      </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Direct selection note - no quantity/add button needed */}
          <p className="text-xs text-abi-text-dim text-center py-2">
            Click a tier to add ammo • Manage quantities in the loadout panel
          </p>

          {/* Footer */}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-abi-border">
            <button
              onClick={handleCloseMain}
              className="px-4 py-2 border border-abi-border rounded-lg text-sm text-abi-text-muted hover:text-abi-text hover:border-abi-orange transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-abi-orange hover:bg-orange-500 rounded-lg text-sm text-white font-semibold transition-colors"
            >
              Save Ammo
            </button>
          </div>
        </div>

        {/* Child Modal: Ammo List Management */}
        <div className="child-modal">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-abi-text font-orbitron">Ammo Loadout</h3>
            <button
              onClick={handleCloseChild}
              className="p-2 rounded-lg border border-abi-border hover:border-abi-orange hover:text-abi-orange transition-colors"
            >
              ✕
            </button>
          </div>

          {ammo.length > 0 ? (
            <div className="space-y-4">
              <div className="p-3 bg-abi-bg rounded-lg border border-abi-border">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold text-abi-text-muted uppercase tracking-wider">
                    Selected ({ammo.length})
                  </span>
                  <span className="text-sm text-abi-orange font-bold font-orbitron">
                    ${totalCost.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {ammo.map(a => (
                  <div
                    key={a.id}
                    className="flex items-center gap-3 p-3 bg-abi-bg border border-abi-border rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-abi-text">{a.caliber}</p>
                      <p className="text-xs text-abi-text-dim">{a.tier}</p>
                    </div>
                    <input
                      type="number"
                      min={1}
                      value={a.quantity}
                      onChange={(e) => handleUpdateQuantity(a.id, parseInt(e.target.value) || 1)}
                      className="w-16 px-2 py-1 bg-abi-bg border border-abi-border rounded text-abi-text text-sm text-center"
                    />
                    <p className="text-sm text-abi-orange w-20 text-right font-orbitron">
                      ${a.totalCost.toLocaleString()}
                    </p>
                    <button
                      onClick={() => handleRemoveAmmo(a.id)}
                      className="p-1.5 text-abi-text-muted hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Swords size={48} className="text-abi-text-dim mb-4" />
              <p className="text-abi-text-muted text-sm">No ammo selected</p>
              <p className="text-abi-text-dim text-xs mt-1">Select calibers from the main panel</p>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-abi-border">
            <button
              onClick={handleCloseChild}
              className="px-4 py-2 border border-abi-border rounded-lg text-sm text-abi-text-muted hover:text-abi-text hover:border-abi-orange transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-abi-orange hover:bg-orange-500 rounded-lg text-sm text-white font-semibold transition-colors"
            >
              Save Ammo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// CONSUMABLES PICKER MODAL (Left Child Modal)
// ============================================

function ConsumablesPickerModal({ isOpen, onClose, onSave, initialConsumables = [] }: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (consumables: ConsumableEntry[]) => void;
  initialConsumables?: ConsumableEntry[];
}) {
  const [consumables, setConsumables] = useState<ConsumableEntry[]>(initialConsumables);
  const [hasChild, setHasChild] = useState(false);

  // Group consumables by subtype
  const treatmentGroups = {
    medicine: CONSUMABLES.filter(c => c.id.startsWith('medicine') || c.name === 'Adrenaline' || c.name === 'Painkillers'),
    treatments: CONSUMABLES.filter(c => c.id === 'ifix' || c.id === 'bandage' || c.id === 'splint'),
    medkits: CONSUMABLES.filter(c => c.id === 'medkit' || c.id === 'surgkit'),
  };

  const throwableGroups = {
    defend: CONSUMABLES.filter(c => c.id === 'stun_grenade' || c.id === 'smoke_grenade'),
    blast: CONSUMABLES.filter(c => c.id === 'frag_grenade' || c.id === 'molotov' || c.id === 'c4'),
  };

  const handleAdd = (template: typeof CONSUMABLES[0]) => {
    const existing = consumables.find(c => c.name === template.name);
    if (existing) {
      setConsumables(consumables.map(c => {
        if (c.name === template.name) {
          return {
            ...c,
            quantity: c.quantity + 1,
            totalCost: c.costPerUnit * (c.quantity + 1),
          };
        }
        return c;
      }));
    } else {
      const newConsumable: ConsumableEntry = {
        id: generateId(),
        name: template.name,
        type: template.type,
        quantity: 1,
        costPerUnit: template.baseCost,
        totalCost: template.baseCost,
      };
      setConsumables([...consumables, newConsumable]);
    }
    // Open child modal when items are selected
    setHasChild(true);
  };

  const handleRemove = (id: string) => {
    setConsumables(consumables.filter(c => c.id !== id));
  };

  const handleUpdateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity < 1) {
      handleRemove(id);
      return;
    }
    setConsumables(consumables.map(c => {
      if (c.id === id) {
        return {
          ...c,
          quantity: newQuantity,
          totalCost: c.costPerUnit * newQuantity,
        };
      }
      return c;
    }));
  };

  const handleSave = () => {
    onSave(consumables);
    setHasChild(false);
    onClose();
  };

  const handleCloseChild = () => {
    setHasChild(false);
  };

  const handleCloseMain = () => {
    setHasChild(false);
    onClose();
  };

  const totalCost = consumables.reduce((sum, c) => sum + c.totalCost, 0);

  // Simple selectable item component (no quantity controls in parent)
  const SelectableItem = ({ item, type }: { item: typeof CONSUMABLES[0], type: 'treatment' | 'throwable' }) => {
    const existing = consumables.find(c => c.name === item.name);
    const quantity = existing?.quantity || 0;

    return (
      <button
        onClick={() => handleAdd(item)}
        className={`w-full p-2 rounded-lg border text-left transition-all ${
          quantity > 0
            ? 'bg-abi-orange/10 border-abi-orange text-abi-orange'
            : 'bg-abi-bg border-abi-border text-abi-text-muted hover:border-abi-orange hover:text-abi-orange'
        }`}
      >
        <p className="text-xs font-medium truncate">{item.name}</p>
        {quantity > 0 && (
          <p className="text-[10px] text-abi-orange font-semibold mt-0.5">x{quantity}</p>
        )}
      </button>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="modal-wrapper" onClick={handleCloseMain}>
      <div className={`modal-container ${hasChild ? 'has-consumables-child' : ''}`} onClick={(e) => e.stopPropagation()}>
        {/* Main Modal: Consumables Selection */}
        <div className="main-modal">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-abi-text font-orbitron">Add Consumables</h3>
            <button
              onClick={handleCloseMain}
              className="p-2 rounded-lg border border-abi-border hover:border-abi-orange hover:text-abi-orange transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Treatments Section */}
          <div className="mb-6">
            <h4 className="text-xs font-semibold text-abi-text-muted uppercase tracking-wider mb-3">
              Treatments
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(treatmentGroups).map(([groupName, items]) => (
                <div key={groupName} className="space-y-2">
                  <p className="text-[10px] text-abi-text-dim uppercase tracking-wider">{groupName}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {items.map(item => (
                      <SelectableItem key={item.id} item={item} type="treatment" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Throwables Section */}
          <div>
            <h4 className="text-xs font-semibold text-abi-text-muted uppercase tracking-wider mb-3">
              Throwables
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(throwableGroups).map(([groupName, items]) => (
                <div key={groupName} className="space-y-2">
                  <p className="text-[10px] text-abi-text-dim uppercase tracking-wider">{groupName}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {items.map(item => (
                      <SelectableItem key={item.id} item={item} type="throwable" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-abi-border">
            <button
              onClick={handleCloseMain}
              className="px-4 py-2 border border-abi-border rounded-lg text-sm text-abi-text-muted hover:text-abi-text hover:border-abi-orange transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-abi-orange hover:bg-orange-500 rounded-lg text-sm text-white font-semibold transition-colors"
            >
              Save Consumables
            </button>
          </div>
        </div>

        {/* Child Modal: Selected Consumables (Left Side) */}
        <div className="consumables-child-modal">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-abi-text font-orbitron">Selected Items</h3>
            <button
              onClick={handleCloseChild}
              className="p-2 rounded-lg border border-abi-border hover:border-abi-orange hover:text-abi-orange transition-colors"
            >
              ✕
            </button>
          </div>

          {consumables.length > 0 ? (
            <div className="space-y-4">
              <div className="p-3 bg-abi-bg rounded-lg border border-abi-border">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold text-abi-text-muted uppercase tracking-wider">
                    Selected ({consumables.length})
                  </span>
                  <span className="text-sm text-abi-orange font-bold font-orbitron">
                    ${totalCost.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {consumables.map(c => (
                  <div
                    key={c.id}
                    className="flex items-center gap-3 p-3 bg-abi-bg border border-abi-border rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-abi-text">{c.name}</p>
                      <p className="text-xs text-abi-text-dim">${c.costPerUnit.toLocaleString()}/each</p>
                    </div>
                    <input
                      type="number"
                      min={1}
                      value={c.quantity}
                      onChange={(e) => handleUpdateQuantity(c.id, parseInt(e.target.value) || 1)}
                      className="w-16 px-2 py-1 bg-abi-bg border border-abi-border rounded text-abi-text text-sm text-center"
                    />
                    <p className="text-sm text-abi-orange w-20 text-right font-orbitron">
                      ${c.totalCost.toLocaleString()}
                    </p>
                    <button
                      onClick={() => handleRemove(c.id)}
                      className="p-1.5 text-abi-text-muted hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Pill size={48} className="text-abi-text-dim mb-4" />
              <p className="text-abi-text-muted text-sm">No consumables selected</p>
              <p className="text-abi-text-dim text-xs mt-1">Add items from the main panel</p>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-abi-border">
            <button
              onClick={handleCloseChild}
              className="px-4 py-2 border border-abi-border rounded-lg text-sm text-abi-text-muted hover:text-abi-text hover:border-abi-orange transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-abi-orange hover:bg-orange-500 rounded-lg text-sm text-white font-semibold transition-colors"
            >
              Save Consumables
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

