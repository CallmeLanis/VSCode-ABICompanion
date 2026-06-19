import { useState } from 'react';
import { Modal, Button, Tabs } from '../components/ui';
import { CONSUMABLES } from '../data/constants';
import { generateId } from '../utils/storage';
import { Plus, Trash2, Pill, Bomb } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'treatment' | 'throwable'>('treatment');

  const treatments = CONSUMABLES.filter(c => c.type === 'treatment');
  const throwables = CONSUMABLES.filter(c => c.type === 'throwable');

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

  const handleUpdateQuantity = (id: string, quantity: number) => {
    setConsumables(consumables.map(c => {
      if (c.id === id) {
        return {
          ...c,
          quantity,
          totalCost: c.costPerUnit * quantity,
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Consumables" size="lg">
      <Tabs
        tabs={[
          { id: 'treatment', label: 'Treatments', icon: <Pill size={16} /> },
          { id: 'throwable', label: 'Throwables', icon: <Bomb size={16} /> },
        ]}
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as 'treatment' | 'throwable')}
        className="mb-4"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: Browser */}
        <div className="border border-abi-border rounded-lg overflow-hidden">
          <div className="px-4 py-3 bg-abi-bg border-b border-abi-border">
            <h3 className="text-sm font-semibold text-abi-text-muted uppercase tracking-wider">
              {activeTab === 'treatment' ? 'Treatments' : 'Throwables'}
            </h3>
          </div>
          <div className="max-h-[40vh] overflow-y-auto">
            {(activeTab === 'treatment' ? treatments : throwables).map(item => (
              <div
                key={item.id}
                className="flex items-center justify-between px-4 py-3 border-b border-abi-border last:border-0 hover:bg-abi-bg-hover/50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-abi-text">{item.name}</p>
                  <p className="text-xs text-abi-text-dim">${item.baseCost.toLocaleString()}</p>
                </div>
                <button
                  onClick={() => handleAdd(item)}
                  className="p-1.5 rounded bg-abi-orange/20 text-abi-orange hover:bg-abi-orange hover:text-white transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Selected */}
        <div className="border border-abi-border rounded-lg overflow-hidden flex flex-col">
          <div className="px-4 py-3 bg-abi-bg border-b border-abi-border flex justify-between items-center">
            <h3 className="text-sm font-semibold text-abi-text-muted uppercase tracking-wider">
              Selected ({consumables.length})
            </h3>
            <span className="text-sm text-abi-orange">
              ${totalCost.toLocaleString()}
            </span>
          </div>
          <div className="flex-1 max-h-[40vh] overflow-y-auto">
            {consumables.length === 0 ? (
              <div className="flex items-center justify-center h-full text-abi-text-dim text-sm p-4">
                No consumables selected
              </div>
            ) : (
              <div className="space-y-2 p-3">
                {consumables.map(c => (
                  <div
                    key={c.id}
                    className="flex items-center gap-3 p-2 bg-abi-bg rounded-lg border border-abi-border"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {c.type === 'treatment' ? (
                          <Pill size={14} className="text-green-400" />
                        ) : (
                          <Bomb size={14} className="text-red-400" />
                        )}
                        <p className="text-sm font-medium text-abi-text">{c.name}</p>
                      </div>
                      <p className="text-xs text-abi-text-dim">${c.costPerUnit.toLocaleString()}/each</p>
                    </div>
                    <input
                      type="number"
                      min={1}
                      value={c.quantity}
                      onChange={(e) => handleUpdateQuantity(c.id, parseInt(e.target.value) || 1)}
                      className="w-16 px-2 py-1 text-sm bg-abi-bg-elevated border border-abi-border rounded text-abi-text text-center"
                    />
                    <p className="text-sm text-abi-orange w-16 text-right">
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
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-abi-border">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={handleSave} glow>
          Save Consumables
        </Button>
      </div>
    </Modal>
  );
}
