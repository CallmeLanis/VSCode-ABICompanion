// Ammo and consumables picker modals for the Mission Debrief workflow.
// Ammo catalog: LootDB type === 'ammo'; unit cost = marketPrice, or vendor when market is 0.
// Consumables catalog: LootDB type === 'medic' | 'grenade'; same unit-cost rule.

import { useState, useEffect, useMemo, useRef, useCallback, type ReactNode, type PointerEvent as ReactPointerEvent } from 'react';
import { Swords, Pill, Trash2, Database } from 'lucide-react';
import { generateId } from '../../utils/storage';
import { useLootDBItems } from '../../hooks/useStorageQuery';
import type { AmmoEntry, ConsumableEntry, LootDBItem } from '../../types';
import {
  MEDIC_SUBTYPE_ORDER,
  GRENADE_SUBTYPE_ORDER,
  CONSUMABLE_UNIT_PRESETS,
  getConsumableGroupKey,
  getConsumableGroupLabel,
  type ConsumableFamily,
} from '../../data/consumables';

const WHEEL_ITEM_HEIGHT = 44;
const WHEEL_VISIBLE_COUNT = 5;
const DEFAULT_MAG_PRESETS = [30, 60, 90] as const;

/** Mag preset rounds per caliber (LootDB caliber string). */
const CALIBER_MAG_PRESETS: Record<string, readonly number[]> = {
  '.338 Lapua': [5, 10],
  '.45 ACP': [30, 50],
  '12 Gauge': [5, 10, 20],
  '5.45x39': [30, 60, 95],
  '5.56x45': [20, 30, 40, 60, 100],
  '5.7x28': [30, 50],
  '5.8x42': [30, 40, 75],
  '7.62x39': [30, 40, 50, 75, 100],
  '7.62x51': [10, 20, 30, 50],
  '7.62x54': [5, 10, 20],
  '9x19': [30, 41, 50],
  '9x39': [20, 30, 50],
};

function getCaliberMagPresets(caliberName: string): number[] {
  const key = caliberName.trim();
  if (CALIBER_MAG_PRESETS[key]) return [...CALIBER_MAG_PRESETS[key]];
  const alias = Object.keys(CALIBER_MAG_PRESETS).find(
    (name) => name.startsWith(key) || key.startsWith(name),
  );
  if (alias) return [...CALIBER_MAG_PRESETS[alias]];
  return [...DEFAULT_MAG_PRESETS];
}

function getAmmoCartridgeLabel(item: LootDBItem): string {
  return item.name.trim();
}

function formatLootAmmoTier(item: LootDBItem): string {
  const raw = (item.tier || '').trim();
  if (/^[0-7]$/.test(raw)) return `T${raw}`;
  const match = raw.match(/^T([0-7])$/i);
  if (match) return `T${match[1]}`;

  // Legacy: tier used to store cartridge names like M80 / 7N37
  const legacyMap: Record<string, string> = {
    PP: 'T3', BP: 'T4', BS: 'T5',
    M855: 'T3', M855A1: 'T4', M855A2: 'T4', M995: 'T5',
    R37F: 'T0', SS198: 'T5', SS190: 'T4',
    DVC12: 'T5', DVP87: 'T3', DVP88: 'T4',
    PST: 'T2', LRNPC: 'T2',
    BPZ: 'T3', M80: 'T4', M62: 'T5', M61: 'T6',
    T46M: 'T3', LPS: 'T4', '7BT1': 'T5', SNB: 'T6', '7N37': 'T7',
    'AP-9mm': 'T4', RIP: 'T4',
    'SP-5': 'T3', 'SP-6': 'T4', '7N9': 'T4', '7N12': 'T5',
    FMJ: 'T2', AP20: 'T5',
    L8: 'T0', Slug: 'T0', PIERCE: 'T3', DRAGON: 'T2',
  };
  const key = raw || item.name.trim();
  return legacyMap[key] || 'T3';
}

function getBestVendorPrice(item: LootDBItem): number {
  if (!item.vendorPrices?.length) return 0;
  return item.vendorPrices.reduce((best, entry) => (
    entry.price > best ? entry.price : best
  ), 0);
}

/** Market price when listed; vendor price when market = 0 (unbuyable on flea). */
function getLootItemUnitCost(item: LootDBItem): number {
  const marketPrice = item.marketPrice ?? 0;
  if (marketPrice > 0) return marketPrice;
  return getBestVendorPrice(item);
}

type WheelItem = {
  id: string;
  primary: ReactNode;
  secondary?: ReactNode;
  dataTier?: string;
};

function ScrollWheel({
  items,
  selectedId,
  onSelect,
  onActivate,
  accent,
  emptyLabel,
  ariaLabel,
}: {
  items: WheelItem[];
  selectedId: string;
  onSelect: (id: string) => void;
  onActivate?: (id: string) => void;
  accent: 'brass' | 'tier';
  emptyLabel: string;
  ariaLabel: string;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const wheelLockRef = useRef(false);
  const dragRef = useRef<{ startY: number; startIndex: number } | null>(null);
  const dragMovedRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);
  const pad = Math.floor(WHEEL_VISIBLE_COUNT / 2) * WHEEL_ITEM_HEIGHT;
  const selectedIndex = Math.max(0, items.findIndex((item) => item.id === selectedId));

  const goToIndex = useCallback((index: number) => {
    if (items.length === 0) return;
    const clamped = Math.max(0, Math.min(items.length - 1, index));
    const nextId = items[clamped]?.id;
    if (nextId && nextId !== selectedId) onSelect(nextId);
  }, [items, onSelect, selectedId]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el || items.length === 0) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (wheelLockRef.current) return;
      wheelLockRef.current = true;
      window.setTimeout(() => {
        wheelLockRef.current = false;
      }, 100);
      if (e.deltaY > 0) goToIndex(selectedIndex + 1);
      else if (e.deltaY < 0) goToIndex(selectedIndex - 1);
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [goToIndex, selectedIndex, items.length]);

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (items.length === 0 || e.button !== 0) return;
    dragMovedRef.current = false;
    dragRef.current = { startY: e.clientY, startIndex: selectedIndex };
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    const deltaY = dragRef.current.startY - e.clientY;
    if (Math.abs(deltaY) > 4) dragMovedRef.current = true;
    const steps = Math.round(deltaY / WHEEL_ITEM_HEIGHT);
    goToIndex(dragRef.current.startIndex + steps);
  };

  const endDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    dragRef.current = null;
    setIsDragging(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const handleItemClick = (id: string) => {
    if (dragMovedRef.current) {
      dragMovedRef.current = false;
      return;
    }
    onSelect(id);
    onActivate?.(id);
  };

  const activeTier = accent === 'tier'
    ? items.find((item) => item.id === selectedId)?.dataTier
    : undefined;

  if (items.length === 0) {
    return (
      <div className="ammo-wheel ammo-wheel--empty" aria-label={ariaLabel}>
        <p className="ammo-wheel-empty-label">{emptyLabel}</p>
      </div>
    );
  }

  const translateY = pad - selectedIndex * WHEEL_ITEM_HEIGHT;

  return (
    <div
      className={`ammo-wheel ammo-wheel--${accent}`}
      data-active-tier={activeTier}
      aria-label={ariaLabel}
    >
      <div
        ref={viewportRef}
        className={`ammo-wheel-viewport ${isDragging ? 'is-dragging' : ''}`}
        style={{ height: WHEEL_VISIBLE_COUNT * WHEEL_ITEM_HEIGHT }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <div
          className="ammo-wheel-track"
          style={{
            transform: `translateY(${translateY}px)`,
            transition: isDragging ? 'none' : 'transform 0.18s cubic-bezier(0.25, 1, 0.5, 1)',
          }}
        >
          {items.map((item, index) => {
            const isActive = item.id === selectedId;
            const distance = Math.abs(index - selectedIndex);
            return (
              <button
                key={item.id}
                type="button"
                data-tier={item.dataTier}
                className={`ammo-wheel-item ${isActive ? 'is-active' : ''} distance-${Math.min(distance, 2)}`}
                style={{ height: WHEEL_ITEM_HEIGHT }}
                onClick={() => handleItemClick(item.id)}
              >
                <span className="ammo-wheel-item-primary">{item.primary}</span>
                {item.secondary != null && (
                  <span className="ammo-wheel-item-secondary">{item.secondary}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function isConsumableLootItem(item: LootDBItem): boolean {
  return item.type === 'medic' || item.type === 'grenade';
}

function consumableEntryType(item: LootDBItem): ConsumableEntry['type'] {
  return item.type === 'grenade' ? 'throwable' : 'treatment';
}

// ============================================
// AMMO PICKER MODAL (Dual Wheel · Caliber / Type)
// ============================================

export function AmmoPickerModal({ isOpen, onClose, onSave, initialAmmo = [] }: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (ammo: AmmoEntry[]) => void;
  initialAmmo?: AmmoEntry[];
}) {
  const lootItems = useLootDBItems();
  const [ammo, setAmmo] = useState<AmmoEntry[]>(initialAmmo);
  const [selectedCaliber, setSelectedCaliber] = useState<string>('');
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [draftRounds, setDraftRounds] = useState(0);

  const ammoCatalog = useMemo(
    () => lootItems.filter(item => item.type === 'ammo' && (item.caliber || '').trim()),
    [lootItems]
  );

  const calibers = useMemo(() => {
    const map = new Map<string, LootDBItem[]>();
    for (const item of ammoCatalog) {
      const key = (item.caliber || '').trim();
      if (!key) continue;
      const list = map.get(key) || [];
      list.push(item);
      map.set(key, list);
    }
    return [...map.entries()]
      .map(([name, items]) => ({
        id: name,
        name,
        items: items.sort((a, b) => getAmmoCartridgeLabel(a).localeCompare(getAmmoCartridgeLabel(b))),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [ammoCatalog]);

  const activeCaliber = calibers.find((c) => c.id === selectedCaliber) ?? calibers[0];
  const activeTypes = activeCaliber?.items ?? [];
  const selectedTypeItem = activeTypes.find((item) => item.id === selectedItemId);
  const selectedCartridge = selectedTypeItem ? getAmmoCartridgeLabel(selectedTypeItem) : '';

  useEffect(() => {
    if (isOpen) {
      const hydrated = initialAmmo.map((entry) => {
        const match = ammoCatalog.find((item) => {
          const caliber = (item.caliber || '').trim();
          const cartridge = getAmmoCartridgeLabel(item);
          return caliber === entry.caliber && cartridge === entry.tier;
        });
        if (!match) return entry;
        const costPerRound = getLootItemUnitCost(match);
        return {
          ...entry,
          costPerRound,
          totalCost: costPerRound * entry.quantity,
        };
      });
      setAmmo(hydrated);
      const firstCaliber = calibers[0]?.id ?? '';
      setSelectedCaliber(firstCaliber);
      setSelectedItemId(calibers[0]?.items[0]?.id ?? '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || calibers.length === 0) return;
    if (!selectedCaliber || !calibers.some((c) => c.id === selectedCaliber)) {
      setSelectedCaliber(calibers[0].id);
      setSelectedItemId(calibers[0].items[0]?.id ?? '');
    }
  }, [isOpen, calibers, selectedCaliber]);

  useEffect(() => {
    if (!activeCaliber) {
      setSelectedItemId('');
      return;
    }
    const stillValid = activeCaliber.items.some((item) => item.id === selectedItemId);
    if (!stillValid) {
      setSelectedItemId(activeCaliber.items[0]?.id ?? '');
    }
  }, [activeCaliber, selectedItemId]);

  useEffect(() => {
    if (!selectedTypeItem) {
      setDraftRounds(0);
      return;
    }
    const caliber = (selectedTypeItem.caliber || '').trim();
    const cartridge = getAmmoCartridgeLabel(selectedTypeItem);
    const existing = ammo.find((entry) => entry.caliber === caliber && entry.tier === cartridge);
    setDraftRounds(existing?.quantity ?? 0);
  }, [selectedTypeItem, selectedItemId, ammo]);

  const applyRoundsToSelection = (rounds: number, item: LootDBItem | undefined = selectedTypeItem) => {
    if (!item) return;
    const caliber = (item.caliber || '').trim();
    const cartridge = getAmmoCartridgeLabel(item);
    const costPerRound = getLootItemUnitCost(item);
    const quantity = Math.max(0, Math.round(rounds));

    setDraftRounds(quantity);

    setAmmo((prev) => {
      const existing = prev.find((entry) => entry.caliber === caliber && entry.tier === cartridge);
      if (quantity === 0) {
        return existing ? prev.filter((entry) => entry.id !== existing.id) : prev;
      }
      if (existing) {
        return prev.map((entry) => (
          entry.id === existing.id
            ? { ...entry, quantity, costPerRound, totalCost: costPerRound * quantity }
            : entry
        ));
      }
      return [
        ...prev,
        {
          id: generateId(),
          caliber,
          tier: cartridge,
          quantity,
          costPerRound,
          totalCost: costPerRound * quantity,
        },
      ];
    });
  };

  const handleAddAmmo = (item: LootDBItem, quantityDelta = 1) => {
    const caliber = (item.caliber || '').trim();
    const cartridge = getAmmoCartridgeLabel(item);
    if (!caliber || !cartridge) return;

    setSelectedItemId(item.id);
    const existing = ammo.find((entry) => entry.caliber === caliber && entry.tier === cartridge);
    const nextQuantity = (existing?.quantity ?? 0) + quantityDelta;
    applyRoundsToSelection(nextQuantity, item);
  };

  const handleMagPresetAdd = (rounds: number) => {
    applyRoundsToSelection(draftRounds + rounds);
  };

  const handleMagPresetSubtract = (rounds: number) => {
    applyRoundsToSelection(Math.max(0, draftRounds - rounds));
  };

  const handleAdjustRounds = (delta: number) => {
    applyRoundsToSelection(Math.max(0, draftRounds + delta));
  };

  const caliberWheelItems: WheelItem[] = calibers.map((caliber) => ({
    id: caliber.id,
    primary: caliber.name,
  }));

  const typeWheelItems: WheelItem[] = activeTypes.map((item) => ({
    id: item.id,
    primary: getAmmoCartridgeLabel(item),
    dataTier: formatLootAmmoTier(item),
  }));

  const activeMagPresets = useMemo(
    () => getCaliberMagPresets(activeCaliber?.name ?? ''),
    [activeCaliber?.name],
  );

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
    onClose();
  };

  const handleCloseMain = () => {
    onClose();
  };

  const totalCost = ammo.reduce((sum, a) => sum + a.totalCost, 0);

  if (!isOpen) return null;

  return (
    <div className="modal-wrapper" onClick={handleCloseMain}>
      <div className="modal-container ammo-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="ammo-modal-unified">
          <div className="ammo-modal-header">
            <h3 className="text-lg font-bold text-abi-text font-orbitron">Add Ammo</h3>
            <button
              onClick={handleCloseMain}
              className="p-2 rounded-lg border border-abi-border hover:border-abi-orange hover:text-abi-orange transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="ammo-modal-body">
            <div className="ammo-modal-picker">
              {calibers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                  <Database size={40} className="text-abi-text-dim mb-4" />
                  <p className="text-abi-text-muted text-sm">No ammo in Inventory</p>
                  <p className="text-abi-text-dim text-xs mt-2 max-w-xs">
                    Add ammo catalog entries in Intelligence → Inventory (Type: Ammo, Caliber, Market Price).
                  </p>
                </div>
              ) : (
                <div className="ammo-picker-stage">
                  <div className="ammo-wheel-pair">
                    <div className="ammo-wheel-column ammo-wheel-column--caliber">
                      <label className="ammo-wheel-label">Calibers</label>
                      <ScrollWheel
                        items={caliberWheelItems}
                        selectedId={activeCaliber?.id ?? ''}
                        onSelect={(id) => {
                          setSelectedCaliber(id);
                          const next = calibers.find((c) => c.id === id);
                          setSelectedItemId(next?.items[0]?.id ?? '');
                        }}
                        accent="brass"
                        emptyLabel="No calibers"
                        ariaLabel="Caliber wheel"
                      />
                    </div>
                    <div className="ammo-wheel-column ammo-wheel-column--type">
                      <label className="ammo-wheel-label">Types</label>
                      <ScrollWheel
                        items={typeWheelItems}
                        selectedId={selectedItemId}
                        onSelect={setSelectedItemId}
                        onActivate={(id) => {
                          const item = activeTypes.find((entry) => entry.id === id);
                          if (item) handleAddAmmo(item);
                        }}
                        accent="tier"
                        emptyLabel="No types"
                        ariaLabel="Ammo type wheel"
                      />
                    </div>
                  </div>

                  <div className="ammo-mag-presets" aria-label="Magazine presets">
                    <div className="ammo-consumption-block">
                      <label className="ammo-wheel-label" htmlFor="ammo-rounds-used">
                        Rounds used
                      </label>
                      <div className="ammo-consumption-row">
                        <div className="ammo-consumption-stepper">
                          <button
                            type="button"
                            className="ammo-consumption-step"
                            disabled={!selectedTypeItem || draftRounds <= 0}
                            onClick={() => handleAdjustRounds(-1)}
                            aria-label="Decrease rounds by 1"
                          >
                            −
                          </button>
                          <input
                            id="ammo-rounds-used"
                            type="number"
                            min={0}
                            value={draftRounds}
                            disabled={!selectedTypeItem}
                            onChange={(e) => applyRoundsToSelection(parseInt(e.target.value, 10) || 0)}
                            className="ammo-consumption-input"
                          />
                          <button
                            type="button"
                            className="ammo-consumption-step"
                            disabled={!selectedTypeItem}
                            onClick={() => handleAdjustRounds(1)}
                            aria-label="Increase rounds by 1"
                          >
                            +
                          </button>
                        </div>
                        <div className="ammo-consumption-meta">
                          <span className="ammo-consumption-caliber">
                            {activeCaliber?.name ?? '—'}
                          </span>
                          <span className="ammo-consumption-type">
                            {selectedCartridge || 'Select type'}
                          </span>
                        </div>
                        <span className="ammo-consumption-cost font-orbitron">
                          ${((selectedTypeItem ? getLootItemUnitCost(selectedTypeItem) : 0) * draftRounds).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <label className="ammo-wheel-label">Mag presets</label>
                    <div
                      className="ammo-mag-presets-row"
                      data-count={activeMagPresets.length}
                    >
                      {activeMagPresets.map((rounds) => (
                        <button
                          key={rounds}
                          type="button"
                          className="ammo-mag-slot"
                          disabled={!selectedTypeItem}
                          onClick={() => handleMagPresetAdd(rounds)}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            if (!selectedTypeItem) return;
                            handleMagPresetSubtract(rounds);
                          }}
                          aria-label={`Add ${rounds} rounds (left-click) or subtract ${rounds} rounds (right-click)`}
                        >
                          {rounds}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="ammo-modal-loadout" aria-label="Ammo loadout">
              <div className="ammo-loadout-heading">
                <span className="ammo-wheel-label">Loadout</span>
                {ammo.length > 0 && (
                  <span className="text-sm text-abi-orange font-bold font-orbitron">
                    ${totalCost.toLocaleString()}
                  </span>
                )}
              </div>

              {ammo.length > 0 ? (
                <div className="ammo-loadout-list">
                  {ammo.map(a => (
                    <div
                      key={a.id}
                      className="flex items-center gap-3 p-3 bg-abi-bg border border-abi-border rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-abi-text truncate">{a.caliber}</p>
                        <p className="text-xs text-abi-text-dim truncate">
                          {a.tier} · ${a.costPerRound.toLocaleString()}/rd
                        </p>
                      </div>
                      <input
                        type="number"
                        min={1}
                        value={a.quantity}
                        onChange={(e) => handleUpdateQuantity(a.id, parseInt(e.target.value) || 1)}
                        className="w-16 px-2 py-1 bg-abi-bg border border-abi-border rounded text-abi-text text-sm text-center"
                      />
                      <p className="text-sm text-abi-orange w-20 text-right font-orbitron shrink-0">
                        ${a.totalCost.toLocaleString()}
                      </p>
                      <button
                        onClick={() => handleRemoveAmmo(a.id)}
                        className="p-1.5 text-abi-text-muted hover:text-red-400 transition-colors shrink-0"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="ammo-loadout-empty">
                  <Swords size={36} className="text-abi-text-dim mb-3" />
                  <p className="text-abi-text-muted text-sm">No ammo selected</p>
                  <p className="text-abi-text-dim text-xs mt-1">Select types or use mag presets</p>
                </div>
              )}
            </div>
          </div>

          <div className="ammo-modal-footer">
            {calibers.length > 0 && (
              <div className="ammo-modal-footer-hints">
                <p className="ammo-mag-presets-hint">
                  Left-click mag block to add{' '}
                  {activeMagPresets.map((rounds, index) => (
                    <span key={rounds}>
                      {index > 0 && ' / '}
                      <span className="ammo-hint-value ammo-hint-value--preset">{rounds}</span>
                    </span>
                  ))}
                  {' '}· right-click to subtract for{' '}
                  <span
                    className={`ammo-hint-value ${selectedCartridge ? 'ammo-hint-value--type' : 'ammo-hint-value--caliber'}`}
                    data-tier={selectedCartridge && selectedTypeItem ? formatLootAmmoTier(selectedTypeItem) : undefined}
                  >
                    {selectedCartridge || activeCaliber?.name || 'selected type'}
                  </span>
                </p>
                <p className="ammo-modal-footer-guide">
                  Scroll or drag to select · Tap type to add · Cost/round = Market Price, or Contact when not on market
                </p>
              </div>
            )}
            <div className="ammo-modal-footer-actions">
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
        </div>
      </div>
    </div>
  );
}

// ============================================
// CONSUMABLES PICKER MODAL (Unified · Medic | Grenade)
// ============================================

export function ConsumablesPickerModal({ isOpen, onClose, onSave, initialConsumables = [] }: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (consumables: ConsumableEntry[]) => void;
  initialConsumables?: ConsumableEntry[];
}) {
  const lootItems = useLootDBItems();
  const [consumables, setConsumables] = useState<ConsumableEntry[]>(initialConsumables);
  const [selectedFamily, setSelectedFamily] = useState<ConsumableFamily>('medic');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [draftUnits, setDraftUnits] = useState(0);

  const consumableCatalog = useMemo(
    () => lootItems.filter(isConsumableLootItem),
    [lootItems],
  );

  const familyCatalog = useMemo(
    () => consumableCatalog.filter((item) => item.type === selectedFamily),
    [consumableCatalog, selectedFamily],
  );

  const categoryOrder = selectedFamily === 'medic' ? MEDIC_SUBTYPE_ORDER : GRENADE_SUBTYPE_ORDER;

  const categories = useMemo(() => {
    const map = new Map<string, LootDBItem[]>();
    for (const item of familyCatalog) {
      const key = getConsumableGroupKey(item);
      const list = map.get(key) || [];
      list.push(item);
      map.set(key, list);
    }

    return categoryOrder.map((id) => ({
      id,
      name: getConsumableGroupLabel(id),
      items: (map.get(id) || []).sort(
        (a, b) => getLootItemUnitCost(a) - getLootItemUnitCost(b) || a.name.localeCompare(b.name),
      ),
    }));
  }, [familyCatalog, categoryOrder]);

  const activeCategory = categories.find((c) => c.id === selectedCategory) ?? categories[0];
  const activeItems = activeCategory?.items ?? [];
  const selectedItem = activeItems.find((item) => item.id === selectedItemId);
  const unitPresets = CONSUMABLE_UNIT_PRESETS[selectedFamily];

  useEffect(() => {
    if (!isOpen) return;

    const costByName = new Map<string, number>();
    for (const item of consumableCatalog) {
      const name = item.name.trim();
      if (!name) continue;
      costByName.set(name, getLootItemUnitCost(item));
    }

    setConsumables(
      initialConsumables.map((entry) => {
        const costPerUnit = costByName.get(entry.name) ?? entry.costPerUnit;
        return {
          ...entry,
          costPerUnit,
          totalCost: costPerUnit * entry.quantity,
        };
      }),
    );
    setSelectedFamily('medic');
    setSelectedCategory(MEDIC_SUBTYPE_ORDER[0] ?? '');
    setSelectedItemId('');
    setDraftUnits(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const nextCategory = categories.find((c) => c.id === selectedCategory) ?? categories[0];
    if (nextCategory && nextCategory.id !== selectedCategory) {
      setSelectedCategory(nextCategory.id);
    }
    const nextItem = nextCategory?.items.find((item) => item.id === selectedItemId)
      ?? nextCategory?.items[0];
    setSelectedItemId(nextItem?.id ?? '');
    if (nextItem) {
      const existing = consumables.find((c) => c.name === nextItem.name.trim());
      setDraftUnits(existing?.quantity ?? 0);
    } else {
      setDraftUnits(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFamily, categories]);

  const applyUnitsToSelection = (quantity: number, item: LootDBItem | undefined = selectedItem) => {
    if (!item) return;
    const name = item.name.trim();
    if (!name) return;

    const costPerUnit = getLootItemUnitCost(item);
    const clamped = Math.max(0, quantity);
    setDraftUnits(clamped);

    setConsumables((prev) => {
      const existing = prev.find((c) => c.name === name);
      if (clamped <= 0) {
        return prev.filter((c) => c.name !== name);
      }
      if (existing) {
        return prev.map((c) => {
          if (c.name !== name) return c;
          return {
            ...c,
            quantity: clamped,
            costPerUnit,
            totalCost: costPerUnit * clamped,
          };
        });
      }
      const entry: ConsumableEntry = {
        id: generateId(),
        name,
        type: consumableEntryType(item),
        quantity: clamped,
        costPerUnit,
        totalCost: costPerUnit * clamped,
      };
      return [...prev, entry];
    });
  };

  const handleAddConsumable = (item: LootDBItem, quantityDelta = 1) => {
    const name = item.name.trim();
    if (!name) return;
    setSelectedItemId(item.id);
    const existing = consumables.find((c) => c.name === name);
    const nextQuantity = (existing?.quantity ?? 0) + quantityDelta;
    applyUnitsToSelection(nextQuantity, item);
  };

  const handlePresetAdd = (units: number) => {
    applyUnitsToSelection(draftUnits + units);
  };

  const handlePresetSubtract = (units: number) => {
    applyUnitsToSelection(Math.max(0, draftUnits - units));
  };

  const handleAdjustUnits = (delta: number) => {
    applyUnitsToSelection(Math.max(0, draftUnits + delta));
  };

  const handleFamilyChange = (family: ConsumableFamily) => {
    setSelectedFamily(family);
    const order = family === 'medic' ? MEDIC_SUBTYPE_ORDER : GRENADE_SUBTYPE_ORDER;
    setSelectedCategory(order[0] ?? '');
    setSelectedItemId('');
    setDraftUnits(0);
  };

  const categoryWheelItems: WheelItem[] = categories.map((category) => ({
    id: category.id,
    primary: category.name,
  }));

  const itemWheelItems: WheelItem[] = activeItems.map((item) => ({
    id: item.id,
    primary: item.name,
  }));

  const handleRemove = (id: string) => {
    setConsumables(consumables.filter((c) => c.id !== id));
  };

  const handleUpdateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity < 1) {
      handleRemove(id);
      return;
    }
    setConsumables(
      consumables.map((c) => {
        if (c.id !== id) return c;
        return {
          ...c,
          quantity: newQuantity,
          totalCost: c.costPerUnit * newQuantity,
        };
      }),
    );
  };

  const handleSave = () => {
    onSave(consumables);
    onClose();
  };

  const handleCloseMain = () => {
    onClose();
  };

  const totalCost = consumables.reduce((sum, c) => sum + c.totalCost, 0);
  const hasCatalog = familyCatalog.length > 0 || categories.some((c) => c.items.length > 0);
  const catalogEmpty = consumableCatalog.length === 0;

  if (!isOpen) return null;

  return (
    <div className="modal-wrapper" onClick={handleCloseMain}>
      <div className="modal-container ammo-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="ammo-modal-unified consumables-modal-unified">
          <div className="ammo-modal-header">
            <h3 className="text-lg font-bold text-abi-text font-orbitron">Add Consumables</h3>
            <button
              onClick={handleCloseMain}
              className="p-2 rounded-lg border border-abi-border hover:border-abi-orange hover:text-abi-orange transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="ammo-modal-body">
            <div className="ammo-modal-picker">
              {catalogEmpty ? (
                <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                  <Database size={40} className="text-abi-text-dim mb-4" />
                  <p className="text-abi-text-muted text-sm">No consumables in Inventory</p>
                  <p className="text-abi-text-dim text-xs mt-2 max-w-xs">
                    Add medic or grenade catalog entries in Intelligence → Inventory
                    (Type: Medic / Grenade, Market Price).
                  </p>
                </div>
              ) : (
                <div className="ammo-picker-stage">
                  <div className="consumables-family-tabs" role="tablist" aria-label="Consumable family">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={selectedFamily === 'medic'}
                      className={`consumables-family-tab ${selectedFamily === 'medic' ? 'is-active' : ''}`}
                      onClick={() => handleFamilyChange('medic')}
                    >
                      Medic
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={selectedFamily === 'grenade'}
                      className={`consumables-family-tab ${selectedFamily === 'grenade' ? 'is-active' : ''}`}
                      onClick={() => handleFamilyChange('grenade')}
                    >
                      Grenade
                    </button>
                  </div>

                  <div className="ammo-wheel-pair">
                    <div className="ammo-wheel-column ammo-wheel-column--caliber">
                      <label className="ammo-wheel-label">Categories</label>
                      <ScrollWheel
                        items={categoryWheelItems}
                        selectedId={activeCategory?.id ?? ''}
                        onSelect={(id) => {
                          setSelectedCategory(id);
                          const next = categories.find((c) => c.id === id);
                          const first = next?.items[0];
                          setSelectedItemId(first?.id ?? '');
                          if (first) {
                            const existing = consumables.find((c) => c.name === first.name.trim());
                            setDraftUnits(existing?.quantity ?? 0);
                          } else {
                            setDraftUnits(0);
                          }
                        }}
                        accent="brass"
                        emptyLabel="No categories"
                        ariaLabel="Category wheel"
                      />
                    </div>
                    <div className="ammo-wheel-column ammo-wheel-column--type">
                      <label className="ammo-wheel-label">Items</label>
                      <ScrollWheel
                        items={itemWheelItems}
                        selectedId={selectedItemId}
                        onSelect={(id) => {
                          setSelectedItemId(id);
                          const item = activeItems.find((entry) => entry.id === id);
                          if (item) {
                            const existing = consumables.find((c) => c.name === item.name.trim());
                            setDraftUnits(existing?.quantity ?? 0);
                          } else {
                            setDraftUnits(0);
                          }
                        }}
                        onActivate={(id) => {
                          const item = activeItems.find((entry) => entry.id === id);
                          if (item) handleAddConsumable(item);
                        }}
                        accent="tier"
                        emptyLabel={hasCatalog ? 'No items in category' : 'No items'}
                        ariaLabel="Consumable item wheel"
                      />
                    </div>
                  </div>

                  <div className="ammo-mag-presets" aria-label="Unit presets">
                    <div className="ammo-consumption-block">
                      <label className="ammo-wheel-label" htmlFor="consumable-units-used">
                        Units used
                      </label>
                      <div className="ammo-consumption-row">
                        <div className="ammo-consumption-stepper">
                          <button
                            type="button"
                            className="ammo-consumption-step"
                            disabled={!selectedItem || draftUnits <= 0}
                            onClick={() => handleAdjustUnits(-1)}
                            aria-label="Decrease units by 1"
                          >
                            −
                          </button>
                          <input
                            id="consumable-units-used"
                            type="number"
                            min={0}
                            value={draftUnits}
                            disabled={!selectedItem}
                            onChange={(e) => applyUnitsToSelection(parseInt(e.target.value, 10) || 0)}
                            className="ammo-consumption-input"
                          />
                          <button
                            type="button"
                            className="ammo-consumption-step"
                            disabled={!selectedItem}
                            onClick={() => handleAdjustUnits(1)}
                            aria-label="Increase units by 1"
                          >
                            +
                          </button>
                        </div>
                        <div className="ammo-consumption-meta">
                          <span className="ammo-consumption-caliber">
                            {activeCategory?.name ?? '—'}
                          </span>
                          <span className="ammo-consumption-type">
                            {selectedItem?.name || 'Select item'}
                          </span>
                        </div>
                        <span className="ammo-consumption-cost font-orbitron">
                          ${((selectedItem ? getLootItemUnitCost(selectedItem) : 0) * draftUnits).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <label className="ammo-wheel-label">Quick add</label>
                    <div
                      className="ammo-mag-presets-row"
                      data-count={unitPresets.length}
                    >
                      {unitPresets.map((units) => (
                        <button
                          key={units}
                          type="button"
                          className="ammo-mag-slot"
                          disabled={!selectedItem}
                          onClick={() => handlePresetAdd(units)}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            if (!selectedItem) return;
                            handlePresetSubtract(units);
                          }}
                          aria-label={`Add ${units} units (left-click) or subtract ${units} units (right-click)`}
                        >
                          {units}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="ammo-modal-loadout" aria-label="Consumables loadout">
              <div className="ammo-loadout-heading">
                <span className="ammo-wheel-label">Loadout</span>
                {consumables.length > 0 && (
                  <span className="text-sm text-abi-orange font-bold font-orbitron">
                    ${totalCost.toLocaleString()}
                  </span>
                )}
              </div>

              {consumables.length > 0 ? (
                <div className="ammo-loadout-list">
                  {consumables.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center gap-3 p-3 bg-abi-bg border border-abi-border rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-abi-text truncate">{c.name}</p>
                        <p className="text-xs text-abi-text-dim truncate">
                          {c.type === 'throwable' ? 'Throwable' : 'Treatment'} · ${c.costPerUnit.toLocaleString()}/each
                        </p>
                      </div>
                      <input
                        type="number"
                        min={1}
                        value={c.quantity}
                        onChange={(e) => handleUpdateQuantity(c.id, parseInt(e.target.value) || 1)}
                        className="w-16 px-2 py-1 bg-abi-bg border border-abi-border rounded text-abi-text text-sm text-center"
                      />
                      <p className="text-sm text-abi-orange w-20 text-right font-orbitron shrink-0">
                        ${c.totalCost.toLocaleString()}
                      </p>
                      <button
                        onClick={() => handleRemove(c.id)}
                        className="p-1.5 text-abi-text-muted hover:text-red-400 transition-colors shrink-0"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="ammo-loadout-empty">
                  <Pill size={36} className="text-abi-text-dim mb-3" />
                  <p className="text-abi-text-muted text-sm">No consumables selected</p>
                  <p className="text-abi-text-dim text-xs mt-1">Select items or use quick add</p>
                </div>
              )}
            </div>
          </div>

          <div className="ammo-modal-footer">
            {!catalogEmpty && (
              <div className="ammo-modal-footer-hints">
                <p className="ammo-mag-presets-hint">
                  Left-click quick-add block to add{' '}
                  {unitPresets.map((units, index) => (
                    <span key={units}>
                      {index > 0 && ' / '}
                      <span className="ammo-hint-value ammo-hint-value--preset">{units}</span>
                    </span>
                  ))}
                  {' '}· right-click to subtract for{' '}
                  <span className="ammo-hint-value ammo-hint-value--caliber">
                    {selectedItem?.name || activeCategory?.name || 'selected item'}
                  </span>
                </p>
                <p className="ammo-modal-footer-guide">
                  Scroll or drag to select · Tap item to add · Cost/unit = Market Price, or Contact when not on market
                </p>
              </div>
            )}
            <div className="ammo-modal-footer-actions">
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
        </div>
      </div>
    </div>
  );
}

