import { useState, useMemo } from 'react';
import { Modal, Button, Select, NumberInput, Input } from '../components/ui';
import { AddAmmoModal } from './AddAmmoModal';
import { AddConsumablesModal } from './AddConsumablesModal';
import { MAPS, GAME_MODES } from '../data/constants';
import { generateId, addRaid, getSessionId, getStoredSettings } from '../utils/storage';
import { calculateRaidEconomy, calculateGearRescue } from '../utils/economy';
import { Swords, Package, Pill, Shield } from 'lucide-react';
import type { Raid, AmmoEntry, ConsumableEntry, GearRescueData } from '../types';

interface LogRaidModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (raid: Raid) => void;
}

export function LogRaidModal({ isOpen, onClose, onSaved }: LogRaidModalProps) {
  const settings = getStoredSettings();

  // Form state
  const [map, setMap] = useState('tv_station'); // Default: TVS
  const [mode, setMode] = useState('forbidden'); // Default: FORBIDDEN
  const [status, setStatus] = useState<string>('');
  const [duration, setDuration] = useState<number | undefined>(undefined);
  const [kills, setKills] = useState<number | undefined>(undefined);
  const [deaths, setDeaths] = useState<number | undefined>(undefined);
  const [gearValue, setGearValue] = useState<number | undefined>(undefined);
  const [rescuePercentage, setRescuePercentage] = useState<number | undefined>(undefined);

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
    const raid: Raid = {
      id: generateId(),
      timestamp: now,
      map: MAPS.find(m => m.id === map)?.name || map,
      mode: (GAME_MODES.find(m => m.id === mode)?.name || mode) as any,
      status: (status || 'EXTRACTED') as any,
      duration: duration ?? 0,
      ammo,
      consumables,
      gearValue: gearValue ?? 0,
      gearRescue,
      loot: [],
      lootValue: lootValue ?? 0,
      kills: kills ?? 0,
      deaths: deaths ?? 0,
      investment: raidPreview.investment,
      netProfit: raidPreview.netProfit,
      roi: raidPreview.roi,
      isHighlight: false,
      sessionId: getSessionId(now, settings.sessionDuration ?? 60),
    };

    addRaid(raid);
    onSaved?.(raid);
    handleClose();
  };

  const handleClose = () => {
    // Reset form to defaults
    setMap('tv_station'); // Default: TVS
    setMode('forbidden'); // Default: FORBIDDEN
    setStatus('');
    setDuration(undefined);
    setKills(undefined);
    setDeaths(undefined);
    setGearValue(undefined);
    setRescuePercentage(undefined);
    setAmmo([]);
    setConsumables([]);
    setLootValue(undefined);
    onClose();
  };


  return (
    <>
      <Modal isOpen={isOpen} onClose={handleClose} title="Log Raid" size="xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="MAP"
                value={map}
                onChange={(e) => setMap(e.target.value)}
                options={[
                  { value: 'tv_station', label: 'TVS' },
                  ...MAPS.filter(m => m.id !== 'tv_station').map(m => ({ value: m.id, label: m.name.toUpperCase() })),
                ]}
              />
              <Select
                label="MODE"
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                options={[
                  { value: 'forbidden', label: 'FORBIDDEN' },
                  ...GAME_MODES.filter(m => m.id !== 'forbidden').map(m => ({ value: m.id, label: m.name.toUpperCase() })),
                ]}
              />
            </div>

            <Select
              label="STATUS"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={[
                { value: '', label: 'SELECT STATUS' },
                { value: 'EXTRACTED', label: 'EXTRACTED' },
                { value: 'DIED', label: 'DIED' },
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
              {status === 'DIED' && (gearValue ?? 0) > 0 && (
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

             {/* Notes field removed per requirements */}
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
              <div className="space-y-3">
                <NumberInput
                  label="Total Loot Value"
                  value={lootValue}
                  onChange={setLootValue}
                  min={0}
                  className="w-full"
                />
                <p className="text-abi-text-dim text-sm">
                  Enter the total rollout loot value for this raid. Item-level detail is now stored as a single aggregated value.
                </p>
              </div>
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
          <Button variant="primary" onClick={handleSave} glow>
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
