import { useState, useMemo } from 'react';
import { Button, EmptyState, Select } from '../components/ui';
import { useHighlights, useRaids } from '../hooks/useStorageQuery';
import { formatCurrency, formatDateTime } from '../utils/economy';
import { Eye, Star, Heart } from 'lucide-react';
import type { Highlight, Raid } from '../types';
import HighlightDetailModal from '../components/highlights/HighlightDetailModal';

interface HighlightsProps {
  onRaidClick?: (raidId: string) => void;
}

export function Highlights(_: HighlightsProps) {
  const highlights = useHighlights();
  const raids = useRaids();
  const [sortMode, setSortMode] = useState<'newest' | 'oldest' | 'profit'>('newest');
  const [showFavorites, setShowFavorites] = useState(false);
  const [detailRaidId, setDetailRaidId] = useState<string | null>(null);

  const raidMap = useMemo(() => {
    const map = new Map<string, Raid>();
    raids.forEach(r => map.set(r.id, r));
    return map;
  }, [raids]);

  const filteredHighlights = useMemo(() => {
    let result = highlights
      .map(h => ({ highlight: h, raid: raidMap.get(h.raidId) }))
      .filter(item => item.raid) as { highlight: Highlight; raid: Raid }[];

    if (showFavorites) result = result.filter(i => i.highlight.isFavorite);

    if (sortMode === 'newest') result.sort((a, b) => b.highlight.timestamp - a.highlight.timestamp);
    if (sortMode === 'oldest') result.sort((a, b) => a.highlight.timestamp - b.highlight.timestamp);
    if (sortMode === 'profit') result.sort((a, b) => (b.raid!.netProfit ?? 0) - (a.raid!.netProfit ?? 0));

    return result;
  }, [highlights, raidMap, sortMode, showFavorites]);

  return (
    <div className="space-y-6">
      {/* Top Status Banner */}
      <div className="hud-chip rounded-lg p-4 flex items-center justify-between">
        <div>
          <p className="hud-label text-xs">PERSONAL COMBAT HISTORY</p>
          <h2 className="font-orbitron text-3xl text-abi-text mt-1 glow-orange-sm">{highlights.length} Highlights Archived</h2>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-sm text-abi-text">
            <p className="hud-label">Total Profit</p>
            <p className="font-orbitron text-lg text-green-400">${formatCurrency(raids.reduce((s, r) => s + r.netProfit, 0))}</p>
          </div>
          <div className="text-sm text-abi-text">
            <p className="hud-label">Total Loot</p>
            <p className="font-orbitron text-lg text-green-400">${formatCurrency(raids.reduce((s, r) => s + r.lootValue, 0))}</p>
          </div>
          <div className="text-sm text-abi-text">
            <p className="hud-label">Total Kills</p>
            <p className="font-orbitron text-lg text-abi-orange">{raids.reduce((s, r) => s + (r.kills || 0), 0)}</p>
          </div>
          <div>
            <Button variant="secondary" size="sm" onClick={() => setShowFavorites(!showFavorites)}>
              <Heart size={14} className="mr-2" /> Favorites
            </Button>
          </div>
        </div>
      </div>

      {/* Main Section */}
      <div className="flex items-center justify-between">
        <h3 className="hud-heading text-lg">HIGHLIGHT ARCHIVE</h3>
        <div className="flex items-center gap-3 w-40">
          <Select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as any)}
            options={[
              { value: 'newest', label: 'Newest First' },
              { value: 'oldest', label: 'Oldest First' },
              { value: 'profit', label: 'Highest Profit' },
            ]}
          />
        </div>
      </div>

      <div className="space-y-3">
        {filteredHighlights.length > 0 ? (
          filteredHighlights.map(({ highlight, raid }) => (
            <div key={highlight.raidId} className="hud-card rounded-xl p-2 flex items-center justify-between hover-glow-orange hover:scale-[1.01]">
              <div className="flex items-center gap-3">
                <div className="hud-icon" aria-hidden>
                  {raid.status === 'EXTRACTED' ? (
                    <div className="text-green-400 text-lg">●</div>
                  ) : (
                    <div className="text-red-500 text-lg">✖</div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-orbitron text-abi-text truncate">{raid.map} · {raid.mode}</p>
                  <p className="text-[11px] text-abi-text-dim">{formatDateTime(highlight.timestamp)}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="hud-chip">{highlight.category.toUpperCase()}</span>
                    {highlight.isFavorite && <span className="hud-chip">FAVORITE</span>}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="grid grid-cols-4 gap-2 text-right hud-stats">
                  <div>
                    <p className="hud-label">KILLS</p>
                    <p className="font-orbitron text-base text-abi-text">{raid.kills}</p>
                  </div>
                  <div>
                    <p className="hud-label">LOOT</p>
                    <p className="font-orbitron text-base text-green-400">${formatCurrency(raid.lootValue)}</p>
                  </div>
                  <div>
                    <p className="hud-label">NET</p>
                    <p className={`font-orbitron text-base ${raid.netProfit >= 0 ? 'text-green-400' : 'text-red-500'}`}>${formatCurrency(raid.netProfit)}</p>
                  </div>
                  <div>
                    <p className="hud-label">ROI</p>
                    <p className="font-orbitron text-base text-abi-text">{(raid.roi ?? 0).toFixed(1)}%</p>
                  </div>
                </div>

                <button className="p-2 rounded-md hover-glow-orange" onClick={() => setDetailRaidId(raid.id)} aria-label="View details">
                  <Eye className="text-abi-orange" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <EmptyState icon={<Star size={48} />} title="No highlights" description={showFavorites ? "No favorites yet" : "No highlight archive entries"} />
        )}
      </div>

      {detailRaidId && (
        <HighlightDetailModal raidId={detailRaidId} onClose={() => setDetailRaidId(null)} />
      )}
    </div>
  );
}
