import { useState } from 'react';
import { Modal, Button } from '../components/ui';
import { AMMO_CALIBERS } from '../data/constants';
import { generateId } from '../utils/storage';
import { Plus, Trash2, ChevronRight } from 'lucide-react';
import type { AmmoEntry, AmmoTier } from '../types';

interface AddAmmoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (ammo: AmmoEntry[]) => void;
  initialAmmo?: AmmoEntry[];
}

export function AddAmmoModal({ isOpen, onClose, onSave, initialAmmo = [] }: AddAmmoModalProps) {
  const [ammo, setAmmo] = useState<AmmoEntry[]>(initialAmmo);
  const [selectedCaliber, setSelectedCaliber] = useState<string | null>(null);
  const [quickAdd, setQuickAdd] = useState<{ tier: string; quantity?: number }>({ tier: '', quantity: undefined });

  const handleAddAmmo = (tier: AmmoTier, caliber: string, quantity: number) => {
    const newAmmo: AmmoEntry = {
      id: generateId(),
      caliber: caliber,
      tier: tier.name,
      quantity: quantity,
      costPerRound: tier.costPerRound,
      totalCost: tier.costPerRound * quantity,
    };
    setAmmo([...ammo, newAmmo]);
    setQuickAdd({ tier: '', quantity: 1 });
  };

  const handleRemoveAmmo = (id: string) => {
    setAmmo(ammo.filter(a => a.id !== id));
  };

  const handleUpdateQuantity = (id: string, quantity: number) => {
    setAmmo(ammo.map(a => {
      if (a.id === id) {
        return {
          ...a,
          quantity,
          totalCost: a.costPerRound * quantity,
        };
      }
      return a;
    }));
  };

  const handleSave = () => {
    onSave(ammo);
    onClose();
  };

  const totalCost = ammo.reduce((sum, a) => sum + a.totalCost, 0);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Ammo" size="xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[60vh]">
        {/* Left: Caliber/Tier Browser */}
        <div className="border border-abi-border rounded-lg overflow-hidden flex flex-col">
          <div className="px-4 py-3 bg-abi-bg border-b border-abi-border">
            <h3 className="text-sm font-semibold text-abi-text-muted uppercase tracking-wider">
              Ammo Browser
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            {AMMO_CALIBERS.map(caliber => (
              <div key={caliber.id} className="border-b border-abi-border">
                <button
                  onClick={() => setSelectedCaliber(selectedCaliber === caliber.id ? null : caliber.id)}
                  className={`
                    w-full px-4 py-3 flex items-center justify-between
                    transition-colors duration-200
                    ${selectedCaliber === caliber.id ? 'bg-abi-bg-hover' : 'hover:bg-abi-bg-hover/50'}
                  `}
                >
                  <span className="text-sm font-medium text-abi-text">{caliber.name}</span>
                  <ChevronRight
                    size={16}
                    className={`text-abi-text-muted transition-transform ${selectedCaliber === caliber.id ? 'rotate-90' : ''}`}
                  />
                </button>
                {selectedCaliber === caliber.id && (
                  <div className="bg-abi-bg-elevated px-4 py-2 space-y-2">
                    {caliber.tiers.map(tier => (
                      <div key={tier.id} className="flex items-center justify-between py-2 border-b border-abi-border last:border-0">
                        <div>
                          <p className="text-sm text-abi-text">{tier.name}</p>
                          <p className="text-xs text-abi-text-dim">${tier.costPerRound}/round</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={1}
                            value={quickAdd.tier === tier.id && quickAdd.quantity !== undefined ? quickAdd.quantity : ''}
                            onChange={(e) => {
                              const parsed = parseInt(e.target.value);
                              setQuickAdd({ tier: tier.id, quantity: Number.isNaN(parsed) ? undefined : parsed });
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setQuickAdd({ tier: tier.id, quantity: quickAdd.tier === tier.id ? quickAdd.quantity : undefined });
                            }}
                            className="w-16 px-2 py-1 text-sm bg-abi-bg border border-abi-border rounded text-abi-text"
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const qty = quickAdd.tier === tier.id && quickAdd.quantity ? quickAdd.quantity : 1;
                              handleAddAmmo(tier, caliber.name, qty);
                            }}
                            className="px-2 py-1 rounded bg-abi-orange/20 text-abi-orange hover:bg-abi-orange hover:text-white transition-colors"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right: Selected Ammo */}
        <div className="border border-abi-border rounded-lg overflow-hidden flex flex-col">
          <div className="px-4 py-3 bg-abi-bg border-b border-abi-border flex justify-between items-center">
            <h3 className="text-sm font-semibold text-abi-text-muted uppercase tracking-wider">
              Selected Ammo ({ammo.length})
            </h3>
            <span className="text-sm text-abi-orange">
              ${totalCost.toLocaleString()}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {ammo.length === 0 ? (
              <div className="flex items-center justify-center h-full text-abi-text-dim text-sm">
                No ammo selected
              </div>
            ) : (
              <div className="space-y-2 p-3">
                {ammo.map(a => (
                  <div
                    key={a.id}
                    className="flex items-center gap-3 p-2 bg-abi-bg rounded-lg border border-abi-border"
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
                      className="w-20 px-2 py-1 text-sm bg-abi-bg-elevated border border-abi-border rounded text-abi-text text-center"
                    />
                    <p className="text-sm text-abi-orange w-16 text-right">
                      ${a.totalCost.toLocaleString()}
                    </p>
                    <button
                      onClick={() => handleRemoveAmmo(a.id)}
                      className="p-1 text-abi-text-muted hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-abi-border">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={handleSave} glow>
          Save Ammo
        </Button>
      </div>
    </Modal>
  );
}
