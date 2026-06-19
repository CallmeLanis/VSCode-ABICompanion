import { getRaidById } from '../../utils/storage';
import { formatCurrency, formatDateTime } from '../../utils/economy';
import { X } from 'lucide-react';
import { Button } from '../ui';
import type { Raid, LootItem } from '../../types';

export default function HighlightDetailModal({ raidId, onClose }: { raidId: string; onClose: () => void }) {
  const raid: Raid | undefined = getRaidById(raidId);
  if (!raid) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-[900px] max-w-full bg-[#0b0b0f] border border-abi-border rounded-xl p-6 shadow-lg hud-modal">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-orbitron text-2xl text-abi-text">{raid.map} — {formatDateTime(raid.timestamp || Date.now())}</h3>
            <p className="text-sm text-abi-text-dim mt-1">Status: <span className={raid.status === 'EXTRACTED' ? 'text-green-400' : 'text-red-500'}>{raid.status}</span></p>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-2 rounded-md hover:bg-white/5">
            <X />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-6">
            <div className="hud-section p-4 rounded-lg">
            <h4 className="hud-section-title">Combat Summary</h4>
            <div className="mt-2">
              <p>Kills: <span className="font-orbitron text-lg">{raid.kills}</span></p>
              <p>Assists: <span className="font-orbitron text-lg">{raid.assists ?? 0}</span></p>
              <p>Deaths: <span className="font-orbitron text-lg text-red-500">{raid.deaths ?? 0}</span></p>
            </div>
          </div>

            <div className="hud-section p-4 rounded-lg">
            <h4 className="hud-section-title">Economy Summary</h4>
            <div className="mt-2 space-y-1">
              <p>Loot Value: <span className="font-orbitron text-lg text-green-400">${formatCurrency(raid.lootValue)}</span></p>
              <p>Ammo Cost: <span className="font-orbitron text-lg">${formatCurrency((raid.ammo || []).reduce((s, a) => s + (a.totalCost ?? 0), 0))}</span></p>
              <p>Consumables: <span className="font-orbitron text-lg">${formatCurrency((raid.consumables || []).reduce((s, c) => s + (c.totalCost ?? 0), 0))}</span></p>
              <p>Net Profit: <span className={`font-orbitron text-lg ${raid.netProfit >= 0 ? 'text-green-400' : 'text-red-500'}`}>${formatCurrency(raid.netProfit)}</span></p>
              <p>ROI: <span className="font-orbitron text-lg">{(raid.roi ?? 0).toFixed(1)}%</span></p>
            </div>
          </div>

          <div className="hud-section p-4 rounded-lg">
            <h4 className="hud-section-title">Equipment</h4>
            <div className="mt-2 text-sm">
              {raid.loot && raid.loot.length > 0 ? (
                <ul className="list-disc list-inside">
                  {raid.loot.map((item: LootItem, i: number) => (
                    <li key={i}>{item.name} ×{item.quantity}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-abi-text-dim">No equipment recorded</p>
              )}
            </div>
          </div>
        </div>

        {raid.notes && (
          <div className="mt-4 hud-section p-4 rounded-lg">
            <h4 className="hud-section-title">Notes</h4>
            <p className="mt-2 text-sm">{raid.notes}</p>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}
