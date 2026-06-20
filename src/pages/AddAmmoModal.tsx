import { useState, useMemo } from 'react';
import { Modal, Button, Select } from '../components/ui';
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
  const [selectedCaliber, setSelectedCaliber] = useState<string>('');
  const [selectedTier, setSelectedTier] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);

  const handleAddAmmo = () => {
    if (!selectedCaliber || !selectedTier || !quantity) return;
    
    const caliberData = AMMO_CALIBERS.find(c => c.id === selectedCaliber);
    if (!caliberData) return;
    
    const tierData = caliberData.tiers.find(t => t.id === selectedTier);
    if (!tierData) return;

    const newAmmo: AmmoEntry = {
      id: generateId(),
      caliber: caliberData.name,
      tier: tierData.name,
      quantity: quantity,
      costPerRound: tierData.costPerRound,
      totalCost: tierData.costPerRound * quantity,
    };
    setAmmo([...ammo, newAmmo]);
    setSelectedTier('');
    setQuantity(1);
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Ammo" size="md">
      <div className="space-y-4">
        {/* Caliber Selection */}
        <Select
          label="CALIBER"
          value={selectedCaliber}
          onChange={(e) => {
            setSelectedCaliber(e.target.value);
            setSelectedTier(''); // Reset tier when caliber changes
          }}
          options={[
            { value: '', label: 'Select caliber' },
            ...AMMO_CALIBERS.map(c => ({ value: c.id, label: c.name }))
          ]}
        />

        {/* Tier Selection (hidden until caliber selected) */}
        {selectedCaliber && (
          <Select
            label="TIER"
            value={selectedTier}
            onChange={(e) => setSelectedTier(e.target.value)}
            options={[
              { value: '', label: 'Select tier' },
              ...getTierOptions()
            ]}
          />
        )}

        {/* Quantity */}
        {selectedTier && (
          <div>
            <label className="block text-sm text-abi-text-muted mb-2">QUANTITY</label>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 bg-abi-bg border border-abi-border rounded-lg text-abi-text"
            />
          </div>
        )}

        {/* Add Button */}
        {selectedTier && (
          <Button
            variant="primary"
            onClick={handleAddAmmo}
            className="w-full"
            glow
          >
            <Plus size={16} className="mr-1" /> Add Ammo
          </Button>
        )}

        {/* Selected Ammo List */}
        {ammo.length > 0 && (
          <div className="border border-abi-border rounded-lg overflow-hidden">
            <div className="px-4 py-3 bg-abi-bg border-b border-abi-border flex justify-between items-center">
              <h3 className="text-sm font-semibold text-abi-text-muted uppercase tracking-wider">
                Selected ({ammo.length})
              </h3>
              <span className="text-sm text-abi-orange font-bold">
                ${totalCost.toLocaleString()}
              </span>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {ammo.map(a => (
                <div
                  key={a.id}
                  className="flex items-center gap-3 p-3 border-b border-abi-border last:border-0"
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
                    className="w-20 px-2 py-1 text-sm bg-abi-bg border border-abi-border rounded text-abi-text text-center"
                  />
                  <p className="text-sm text-abi-orange w-20 text-right">
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
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-4 border-t border-abi-border">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} glow>
            Save Ammo
          </Button>
        </div>
      </div>
    </Modal>
  );
}
