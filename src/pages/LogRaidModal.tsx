import { useState, useMemo } from 'react';
import { Modal, Button, Select, NumberInput, Input } from '../components/ui';
import { AddAmmoModal } from './AddAmmoModal';
import { AddConsumablesModal } from './AddConsumablesModal';
import { MAPS, GAME_MODES } from '../data/constants';
import { generateId, addRaid, getSessionId, getSettings } from '../utils/storage';
import { calculateRaidEconomy, calculateGearRescue, calculateLootValue } from '../utils/economy';
import { Swords, Package, Pill, Shield, Plus, Trash2 } from 'lucide-react';
import type { Raid, RaidStatus, AmmoEntry, ConsumableEntry, LootItem, GearRescueData } from '../types';

interface LogRaidModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (raid: Raid) => void;
}

export function LogRaidModal({ isOpen, onClose, onSaved }: LogRaidModalProps) {
  const settings = getSettings();

  // Form state
  const [map, setMap] = useState(MAPS[0].id);
  const [mode, setMode] = useState(GAME_MODES[0].id);
  const [status, setStatus] = useState<RaidStatus>('EXTRACTED');
  const [duration, setDuration] = useState(30);
  const [kills, setKills] = useState(0);
  const [deaths, setDeaths] = useState(0);
  const [gearValue, setGearValue] = useState(0);
  const [rescuePercentage, setRescuePercentage] = useState(0);
  const [notes, setNotes] = useState('');

  // Ammo and Consumables
  const [ammo, setAmmo] = useState<AmmoEntry[]>([]);
  const [consumables, setConsumables] = useState<ConsumableEntry[]>([]);

  // Loot
  const [loot, setLoot] = useState<LootItem[]>([]);
  const [newLootName, setNewLootName] = useState('');
  const [newLootValue, setNewLootValue] = useState(0);
  const [newLootQty, setNewLootQty] = useState(1);

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

  const handleAddLoot = () => {
    if (!newLootName || newLootValue <= 0) return;
    const newLoot: LootItem = {
      id: generateId(),
      name: newLootName,
      baseValue: newLootValue,
      quantity: newLootQty,
    };
    setLoot([...loot, newLoot]);
    setNewLootName('');
    setNewLootValue(0);
    setNewLootQty(1);
  };

  const handleRemoveLoot = (id: string) => {
    setLoot(loot.filter(l => l.id !== id));
  };

  const gearRescue: GearRescueData | undefined = status === 'DIED' && rescuePercentage > 0
    ? calculateGearRescue(gearValue, rescuePercentage)
    : undefined;

  const raidPreview = useMemo(() => {
    const previewRaid = {
      ammo,
      consumables,
      gearValue,
      gearRescue,
      loot,
      lootValue: calculateLootValue(loot, settings.globalTaxRate),
    };
    return calculateRaidEconomy(previewRaid, settings.globalTaxRate);
  }, [ammo, consumables, gearValue, gearRescue, loot, settings.globalTaxRate]);

  const handleSave = () => {
    const now = Date.now();
    const raid: Raid = {
      id: generateId(),
      timestamp: now,
      map: MAPS.find(m => m.id === map)?.name || map,
      mode: GAME_MODES.find(m => m.id === mode)?.name || mode,
      status,
      duration,
      ammo,
      consumables,
      gearValue,
      gearRescue,
      loot,
      lootValue: raidPreview.lootValue,
      kills,
      deaths,
      investment: raidPreview.investment,
      netProfit: raidPreview.netProfit,
      roi: raidPreview.roi,
      isHighlight: false,
      sessionId: getSessionId(now, settings.sessionDuration),
      notes: notes || undefined,
    };

    addRaid(raid);
    onSaved?.(raid);
    handleClose();
  };

  const handleClose = () => {
    // Reset form
    setMap(MAPS[0].id);
    setMode(GAME_MODES[0].id);
    setStatus('EXTRACTED');
    setDuration(30);
    setKills(0);
    setDeaths(0);
    setGearValue(0);
    setRescuePercentage(0);
    setNotes('');
    setAmmo([]);
    setConsumables([]);
    setLoot([]);
    onClose();
  };

  const isValid = loot.length > 0 || status !== 'EXTRACTED';

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleClose} title="Log Raid" size="xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Map"
                value={map}
                onChange={(e) => setMap(e.target.value)}
                options={MAPS.map(m => ({ value: m.id, label: m.name }))}
              />
              <Select
                label="Mode"
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                options={GAME_MODES.map(m => ({ value: m.id, label: m.name }))}
              />
            </div>

            <Select
              label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value as RaidStatus)}
              options={[
                { value: 'EXTRACTED', label: 'Extracted' },
                { value: 'DIED', label: 'Died' },
                { value: 'FLED', label: 'Fled' },
              ]}
            />

            <div className="grid grid-cols-3 gap-3">
              <NumberInput
                label="Duration (min)"
                value={duration}
                onChange={setDuration}
                min={1}
                max={120}
              />
              <NumberInput
                label="Kills"
                value={kills}
                onChange={setKills}
                min={0}
              />
              <NumberInput
                label="Deaths"
                value={deaths}
                onChange={setDeaths}
                min={0}
              />
            </div>

            {/* Gear */}
            <div className="p-3 bg-abi-bg rounded-lg border border-abi-border">
              <h4 className="text-sm font-semibold text-abi-text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                <Shield size={16} /> Gear
              </h4>
              <NumberInput
                label="Gear Value Brought"
                value={gearValue}
                onChange={setGearValue}
                min={0}
              />
              {status === 'DIED' && gearValue > 0 && (
                <div className="mt-3">
                  <NumberInput
                    label="Rescue Percentage"
                    value={rescuePercentage}
                    onChange={setRescuePercentage}
                    min={0}
                    max={100}
                  />
                  {gearRescue && (
                    <div className="mt-2 text-sm space-y-1">
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
            </div>

            {/* Notes */}
            <Input
              label="Notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any notable events..."
            />
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {/* Ammo */}
            <div className="p-3 bg-abi-bg rounded-lg border border-abi-border">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-abi-text-muted uppercase tracking-wider flex items-center gap-2">
                  <Swords size={16} /> Ammo
                </h4>
                <Button size="sm" variant="secondary" onClick={handleOpenAmmoModal}>
                  {ammo.length > 0 ? 'Edit' : 'Add'}
                </Button>
              </div>
              {ammo.length > 0 ? (
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {ammo.map(a => (
                    <div key={a.id} className="flex justify-between text-sm">
                      <span className="text-abi-text-muted">{a.caliber} ({a.tier}) x{a.quantity}</span>
                      <span className="text-abi-text">${a.totalCost.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-abi-text-dim text-sm">No ammo added</p>
              )}
            </div>

            {/* Consumables */}
            <div className="p-3 bg-abi-bg rounded-lg border border-abi-border">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-abi-text-muted uppercase tracking-wider flex items-center gap-2">
                  <Pill size={16} /> Consumables
                </h4>
                <Button size="sm" variant="secondary" onClick={handleOpenConsumablesModal}>
                  {consumables.length > 0 ? 'Edit' : 'Add'}
                </Button>
              </div>
              {consumables.length > 0 ? (
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {consumables.map(c => (
                    <div key={c.id} className="flex justify-between text-sm">
                      <span className="text-abi-text-muted">{c.name} x{c.quantity}</span>
                      <span className="text-abi-text">${c.totalCost.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-abi-text-dim text-sm">No consumables added</p>
              )}
            </div>

            {/* Loot */}
            <div className="p-3 bg-abi-bg rounded-lg border border-abi-border">
              <h4 className="text-sm font-semibold text-abi-text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                <Package size={16} /> Loot
              </h4>
              <div className="flex gap-2 mb-3">
                <Input
                  placeholder="Item name"
                  value={newLootName}
                  onChange={(e) => setNewLootName(e.target.value)}
                  className="flex-1"
                />
                <NumberInput
                  value={newLootValue}
                  onChange={setNewLootValue}
                  min={0}
                  className="w-24"
                />
                <NumberInput
                  value={newLootQty}
                  onChange={setNewLootQty}
                  min={1}
                  max={99}
                  className="w-16"
                />
                <Button size="sm" variant="primary" onClick={handleAddLoot}>
                  <Plus size={16} />
                </Button>
              </div>
              {loot.length > 0 ? (
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {loot.map(l => (
                    <div key={l.id} className="flex items-center justify-between text-sm">
                      <span className="text-abi-text-muted">{l.name} x{l.quantity}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-abi-text">${(l.baseValue * l.quantity).toLocaleString()}</span>
                        <button
                          onClick={() => handleRemoveLoot(l.id)}
                          className="p-0.5 text-abi-text-muted hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-abi-text-dim text-sm">No loot added</p>
              )}
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-6 p-4 bg-abi-bg-elevated rounded-lg border border-abi-border">
          <h4 className="text-sm font-semibold text-abi-text-muted uppercase tracking-wider mb-3">
            Summary
          </h4>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-abi-text-dim text-xs mb-1">Investment</p>
              <p className="text-lg font-bold text-abi-text">${raidPreview.investment.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-abi-text-dim text-xs mb-1">Loot Value</p>
              <p className="text-lg font-bold text-green-400">${raidPreview.lootValue.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-abi-text-dim text-xs mb-1">Net Profit</p>
              <p className={`text-lg font-bold ${raidPreview.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {raidPreview.netProfit >= 0 ? '+' : ''}${raidPreview.netProfit.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-abi-text-dim text-xs mb-1">ROI</p>
              <p className={`text-lg font-bold ${raidPreview.roi >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {raidPreview.roi.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-abi-border">
          <Button variant="secondary" onClick={handleClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} glow disabled={!isValid}>
            Save Raid
          </Button>
        </div>
      </Modal>

      {/* Nested Modals */}
      <AddAmmoModal
        isOpen={showAmmoModal}
        onClose={() => setShowAmmoModal(false)}
        onSave={handleSaveAmmo}
        initialAmmo={pendingAmmo}
      />
      <AddConsumablesModal
        isOpen={showConsumablesModal}
        onClose={() => setShowConsumablesModal(false)}
        onSave={handleSaveConsumables}
        initialConsumables={pendingConsumables}
      />
    </>
  );
}
