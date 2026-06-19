import { useMemo } from 'react';
import { Modal, Badge, Divider } from '../components/ui';
import { formatCurrency, formatDateTime, formatDuration, formatPercentage } from '../utils/economy';
import { getRaidById } from '../utils/storage';
import { STATUS_ICONS, RARITY_COLORS } from '../data/constants';
import { Skull, Package, Clock, Target, DollarSign } from 'lucide-react';

interface RaidDetailPopupProps {
  raidId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function RaidDetailPopup({ raidId, isOpen, onClose }: RaidDetailPopupProps) {
  const raid = useMemo(() => {
    if (!raidId) return null;
    return getRaidById(raidId);
  }, [raidId]);

  if (!raid) return null;

  const statusIcon = STATUS_ICONS[raid.status];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Raid Details" size="lg">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge
                variant={raid.status === 'EXTRACTED' ? 'success' : raid.status === 'DIED' ? 'danger' : 'warning'}
                size="sm"
              >
                {statusIcon} {raid.status}
              </Badge>
              <Badge variant="default" size="sm">{raid.map}</Badge>
              <Badge variant="default" size="sm">{raid.mode}</Badge>
            </div>
            <p className="text-sm text-abi-text-muted">{formatDateTime(raid.timestamp)}</p>
          </div>
          <div className="text-right">
            <p className={`text-2xl font-bold ${raid.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {raid.netProfit >= 0 ? '+' : ''}{formatCurrency(raid.netProfit)}
            </p>
            <p className="text-sm text-abi-text-muted">
              ROI: {formatPercentage(raid.roi)}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <Clock size={16} className="mx-auto text-abi-text-dim mb-1" />
            <p className="text-lg font-bold text-abi-text">{formatDuration(raid.duration)}</p>
            <p className="text-xs text-abi-text-muted">Duration</p>
          </div>
          <div className="text-center">
            <Target size={16} className="mx-auto text-abi-text-dim mb-1" />
            <p className="text-lg font-bold text-abi-text">{raid.kills}</p>
            <p className="text-xs text-abi-text-muted">Kills</p>
          </div>
          <div className="text-center">
            <Skull size={16} className="mx-auto text-abi-text-dim mb-1" />
            <p className="text-lg font-bold text-abi-text">{raid.deaths}</p>
            <p className="text-xs text-abi-text-muted">Deaths</p>
          </div>
          <div className="text-center">
            <Package size={16} className="mx-auto text-abi-text-dim mb-1" />
            <p className="text-lg font-bold text-abi-text">{raid.loot.length}</p>
            <p className="text-xs text-abi-text-muted">Items</p>
          </div>
        </div>

        <Divider />

        {/* Investment Breakdown */}
        <div>
          <h3 className="text-sm font-semibold text-abi-text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
            <DollarSign size={16} /> Investment
          </h3>
          <div className="space-y-2 bg-abi-bg rounded-lg p-3">
            {/* Ammo */}
            {raid.ammo.length > 0 && (
              <div>
                <p className="text-xs text-abi-text-dim mb-1">Ammo</p>
                {raid.ammo.map(a => (
                  <div key={a.id} className="flex justify-between text-sm">
                    <span className="text-abi-text-muted">{a.caliber} x{a.quantity}</span>
                    <span className="text-abi-text">${formatCurrency(a.totalCost)}</span>
                  </div>
                ))}
              </div>
            )}
            {/* Consumables */}
            {raid.consumables.length > 0 && (
              <div>
                <p className="text-xs text-abi-text-dim mb-1">Consumables</p>
                {raid.consumables.map(c => (
                  <div key={c.id} className="flex justify-between text-sm">
                    <span className="text-abi-text-muted">{c.name} x{c.quantity}</span>
                    <span className="text-abi-text">${formatCurrency(c.totalCost)}</span>
                  </div>
                ))}
              </div>
            )}
            {/* Gear */}
            {raid.gearValue > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-abi-text-muted">Gear Value</span>
                <span className="text-abi-text">${formatCurrency(raid.gearValue)}</span>
              </div>
            )}
            {/* Gear Rescue */}
            {raid.gearRescue && (
              <div className="text-sm border-t border-abi-border pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="text-abi-text-muted">Rescued ({raid.gearRescue.rescuePercentage}%)</span>
                  <span className="text-green-400">${formatCurrency(raid.gearRescue.rescuedValue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-abi-text-muted">Gear Loss</span>
                  <span className="text-red-400">${formatCurrency(raid.gearRescue.gearLoss)}</span>
                </div>
              </div>
            )}
            <div className="flex justify-between text-sm font-semibold border-t border-abi-border pt-2 mt-2">
              <span className="text-abi-text">Total Investment</span>
              <span className="text-abi-text">${formatCurrency(raid.investment)}</span>
            </div>
          </div>
        </div>

        <Divider />

        {/* Loot */}
        <div>
          <h3 className="text-sm font-semibold text-abi-text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
            <Package size={16} /> Loot Extracted
          </h3>
          {raid.loot.length > 0 ? (
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {raid.loot.map(item => (
                <div key={item.id} className="flex justify-between items-center text-sm">
                  <div>
                    <span className={item.rarity ? RARITY_COLORS[item.rarity] : 'text-abi-text'}>
                      {item.name}
                    </span>
                    <span className="text-abi-text-dim ml-1">x{item.quantity}</span>
                  </div>
                  <span className="text-abi-text">${formatCurrency(item.baseValue * item.quantity)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-abi-text-dim text-sm">No loot extracted</p>
          )}
          <div className="flex justify-between text-sm font-semibold border-t border-abi-border pt-2 mt-2">
            <span className="text-abi-text">Total Loot Value</span>
            <span className="text-green-400">${formatCurrency(raid.lootValue)}</span>
          </div>
        </div>

        {/* Highlight */}
        {raid.isHighlight && (
          <>
            <Divider />
            <div className="bg-abi-orange/10 border border-abi-orange/30 rounded-lg p-3">
              <p className="text-sm font-semibold text-abi-orange mb-1">Highlight</p>
              <p className="text-sm text-abi-text">{raid.highlightReason || 'Notable raid'}</p>
            </div>
          </>
        )}

        {/* Notes */}
        {raid.notes && (
          <>
            <Divider />
            <div>
              <h3 className="text-sm font-semibold text-abi-text-muted uppercase tracking-wider mb-2">
                Notes
              </h3>
              <p className="text-sm text-abi-text">{raid.notes}</p>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
