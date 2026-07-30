// Ammo and consumables picker modals for the Mission Debrief workflow.
// Ammo catalog is sourced from LootDB (type === 'ammo'); marketPrice = costPerRound.

import { useState, useEffect, useMemo } from 'react';
import { Swords, Pill, Trash2, Database } from 'lucide-react';
import { CONSUMABLES } from '../../data/constants';
import { generateId } from '../../utils/storage';
import { useLootDBItems } from '../../hooks/useStorageQuery';
import type { AmmoEntry, ConsumableEntry, LootDBItem } from '../../types';

function getAmmoTypeLabel(item: LootDBItem): string {
  return (item.tier || item.name).trim();
}

function getTierNumber(tierName: string): string {
  const costMap: Record<string, string> = {
    'PP': 'T3', 'BP': 'T4', 'BS': 'T5',
    'M855': 'T3', 'M855A1': 'T4', 'M855A2': 'T4', 'M995': 'T5',
    'R37F': 'T0', 'SS198': 'T5', 'SS190': 'T4',
    'DVC12': 'T5', 'DVP87': 'T3', 'DVP88': 'T4',
    'PST': 'T2', 'LRNPC': 'T2',
    'BPZ': 'T3', 'M80': 'T4', 'M62': 'T5', 'M61': 'T6',
    'T46M': 'T3', 'LPS': 'T4', '7BT1': 'T5', 'SNB': 'T6', '7N37': 'T7',
    'AP-9mm': 'T4', 'RIP': 'T4',
    'SP-5': 'T3', 'SP-6': 'T4', '7N9': 'T4', '7N12': 'T5',
    'FMJ': 'T2', 'AP20': 'T5',
    'L8': 'T0', 'Slug': 'T0', 'PIERCE': 'T3', 'DRAGON': 'T2',
  };
  return costMap[tierName] || 'T3';
}

// ============================================
// AMMO PICKER MODAL (Split-Screen + Radial)
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
  const [hasChild, setHasChild] = useState(false);
  const [expandedCaliber, setExpandedCaliber] = useState<string | null>(null);

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
        items: items.sort((a, b) => getAmmoTypeLabel(a).localeCompare(getAmmoTypeLabel(b))),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [ammoCatalog]);

  useEffect(() => {
    if (isOpen) {
      setAmmo(initialAmmo);
      setHasChild(initialAmmo.length > 0);
      setSelectedCaliber('');
      setSelectedItemId('');
      setExpandedCaliber(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleAddAmmo = (item: LootDBItem) => {
    const caliber = (item.caliber || '').trim();
    const tier = getAmmoTypeLabel(item);
    const costPerRound = item.marketPrice ?? 0;
    if (!caliber || !tier) return;

    const newAmmo: AmmoEntry = {
      id: generateId(),
      caliber,
      tier,
      quantity: 1,
      costPerRound,
      totalCost: costPerRound,
    };
    setAmmo(prev => [...prev, newAmmo]);
    setSelectedItemId(item.id);
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

  if (!isOpen) return null;

  return (
    <div className="modal-wrapper" onClick={handleCloseMain}>
      <div className={`modal-container ${hasChild ? 'has-child' : ''}`} onClick={(e) => e.stopPropagation()}>
        {/* Main Modal: Caliber/Type Selection from LootDB */}
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

          {calibers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <Database size={40} className="text-abi-text-dim mb-4" />
              <p className="text-abi-text-muted text-sm">No ammo in Loot Database</p>
              <p className="text-abi-text-dim text-xs mt-2 max-w-xs">
                Add ammo catalog entries in Intelligence → Loot Database (Type: Ammo, Caliber, Market Price).
              </p>
            </div>
          ) : (
            <div className="mb-6">
              <label className="block text-xs font-semibold text-abi-text-muted uppercase tracking-wider mb-3">
                Select Caliber
              </label>
              <div className="grid grid-cols-2 gap-2">
                {calibers.map(caliber => {
                  const isCaliberOpen = expandedCaliber === caliber.id;
                  return (
                    <div key={caliber.id} className={`caliber-group ${isCaliberOpen ? 'is-open' : ''}`}>
                      <div
                        className={`caliber-node ${selectedCaliber === caliber.id ? 'border-abi-orange' : ''}`}
                        onClick={() => {
                          setSelectedCaliber(caliber.id);
                          setSelectedItemId('');
                          setExpandedCaliber(isCaliberOpen ? null : caliber.id);
                        }}
                      >
                        <span>{caliber.name}</span>
                        <span className="text-xs text-abi-text-dim">{caliber.items.length}</span>
                      </div>
                      <div className="tier-branch">
                        {caliber.items.map(item => {
                          const label = getAmmoTypeLabel(item);
                          return (
                            <div
                              key={item.id}
                              data-tier={getTierNumber(label)}
                              className={`tier-node ${selectedItemId === item.id ? 'border-abi-orange bg-abi-orange/10' : ''}`}
                              onClick={() => {
                                setSelectedItemId(item.id);
                                handleAddAmmo(item);
                              }}
                            >
                              <span>{label}</span>
                              <span className="tier-cost">${(item.marketPrice ?? 0).toLocaleString()}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <p className="text-xs text-abi-text-dim text-center py-2">
            {calibers.length > 0
              ? 'Click a type to add • Cost/round = Market Price from LootDB'
              : 'Catalog empty — define ammo in Loot Database first'}
          </p>

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
                      <p className="text-xs text-abi-text-dim">
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
              <p className="text-abi-text-dim text-xs mt-1">Select types from the main panel</p>
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

export function ConsumablesPickerModal({ isOpen, onClose, onSave, initialConsumables = [] }: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (consumables: ConsumableEntry[]) => void;
  initialConsumables?: ConsumableEntry[];
}) {
  const [consumables, setConsumables] = useState<ConsumableEntry[]>(initialConsumables);
  const [hasChild, setHasChild] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setConsumables(initialConsumables);
      setHasChild(initialConsumables.length > 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

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
  const SelectableItem = ({ item }: { item: typeof CONSUMABLES[0] }) => {
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
                      <SelectableItem key={item.id} item={item} />
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
                      <SelectableItem key={item.id} item={item} />
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
