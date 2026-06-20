import { useState } from 'react';
import { Modal, Button } from '../components/ui';
import { CONSUMABLES, AMMO_CALIBERS } from '../data/constants';
import { generateId } from '../utils/storage';
import { Plus, Trash2, Minus } from 'lucide-react';
import type { ConsumableEntry } from '../types';

interface AddConsumablesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (consumables: ConsumableEntry[]) => void;
  initialConsumables?: ConsumableEntry[];
}

export function AddConsumablesModal({
  isOpen,
  onClose,
  onSave,
  initialConsumables = [],
}: AddConsumablesModalProps) {
  const [consumables, setConsumables] = useState<ConsumableEntry[]>(initialConsumables);

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
    onClose();
  };

  const totalCost = consumables.reduce((sum, c) => sum + c.totalCost, 0);

  // Counter block component
  const CounterBlock = ({ item, type }: { item: typeof CONSUMABLES[0], type: 'treatment' | 'throwable' }) => {
    const existing = consumables.find(c => c.name === item.name);
    const quantity = existing?.quantity || 0;
    const totalCost = existing?.totalCost || 0;

    return (
      <div className="flex flex-col items-center gap-1 p-2 bg-abi-bg border border-abi-border rounded-lg min-w-[120px]">
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              if (existing) {
                handleUpdateQuantity(existing.id, quantity - 1);
              } else {
                handleAdd(item);
                // Decrease quantity back to 0 to show the counter
                setTimeout(() => {
                  const updated = consumables.find(c => c.name === item.name);
                  if (updated && updated.quantity > 1) {
                    handleUpdateQuantity(updated.id, updated.quantity - 1);
                  }
                }, 0);
              }
            }}
            className="p-1 rounded bg-abi-bg-elevated border border-abi-border hover:border-abi-orange text-abi-text-muted hover:text-abi-orange transition-colors"
          >
            <Minus size={12} />
          </button>
          <span className="text-sm font-bold text-abi-text w-8 text-center">{quantity}</span>
          <button
            onClick={() => handleAdd(item)}
            className="p-1 rounded bg-abi-orange/20 border border-abi-orange text-abi-orange hover:bg-abi-orange hover:text-white transition-colors"
          >
            <Plus size={12} />
          </button>
        </div>
        <p className="text-xs text-abi-text-muted text-center leading-tight">{item.name}</p>
        {quantity > 0 && (
          <p className="text-xs text-abi-orange font-semibold">${totalCost.toLocaleString()}</p>
        )}
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Consumables" size="xl">
      <div className="space-y-6">
        {/* Treatments Section */}
        <div>
          <h3 className="text-sm font-semibold text-abi-text-muted uppercase tracking-wider mb-3">
            Add Treatments
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(treatmentGroups).map(([groupName, items]) => (
              <div key={groupName} className="space-y-2">
                <p className="text-xs text-abi-text-dim uppercase tracking-wider">{groupName}</p>
                <div className="flex flex-wrap gap-2">
                  {items.map(item => (
                    <CounterBlock key={item.id} item={item} type="treatment" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Throwables Section */}
        <div>
          <h3 className="text-sm font-semibold text-abi-text-muted uppercase tracking-wider mb-3">
            Add Throwables
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(throwableGroups).map(([groupName, items]) => (
              <div key={groupName} className="space-y-2">
                <p className="text-xs text-abi-text-dim uppercase tracking-wider">{groupName}</p>
                <div className="flex flex-wrap gap-2">
                  {items.map(item => (
                    <CounterBlock key={item.id} item={item} type="throwable" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected List */}
        {consumables.length > 0 && (
          <div className="border border-abi-border rounded-lg overflow-hidden">
            <div className="px-4 py-3 bg-abi-bg border-b border-abi-border flex justify-between items-center">
              <h3 className="text-sm font-semibold text-abi-text-muted uppercase tracking-wider">
                Selected ({consumables.length})
              </h3>
              <span className="text-sm text-abi-orange font-bold">
                ${totalCost.toLocaleString()}
              </span>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {consumables.map(c => (
                <div
                  key={c.id}
                  className="flex items-center gap-3 p-3 border-b border-abi-border last:border-0"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-abi-text">{c.name}</p>
                    <p className="text-xs text-abi-text-dim">${c.costPerUnit.toLocaleString()}/each</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleUpdateQuantity(c.id, c.quantity - 1)}
                      className="p-1 rounded bg-abi-bg-elevated border border-abi-border hover:border-abi-orange text-abi-text-muted hover:text-abi-orange transition-colors"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="text-sm font-bold text-abi-text w-8 text-center">{c.quantity}</span>
                    <button
                      onClick={() => handleUpdateQuantity(c.id, c.quantity + 1)}
                      className="p-1 rounded bg-abi-orange/20 border border-abi-orange text-abi-orange hover:bg-abi-orange hover:text-white transition-colors"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <p className="text-sm text-abi-orange w-20 text-right">
                    ${c.totalCost.toLocaleString()}
                  </p>
                  <button
                    onClick={() => handleRemove(c.id)}
                    className="p-1 text-abi-text-muted hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-abi-border">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} glow>
            Save Consumables
          </Button>
        </div>
      </div>
    </Modal>
  );
}
