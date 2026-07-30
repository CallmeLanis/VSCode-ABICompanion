import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Badge, Button, Caption, DataValue, DisplayValue, EmptyState, MapName, MetaLabel, PageHeader, RoiViewToggle, Select } from '../components/ui';
import { useHighlights, useRoiRaids } from '../hooks/useStorageQuery';
import { formatCurrency, formatDateTime } from '../utils/economy';
import { Eye, Star, Heart } from 'lucide-react';
import type { Highlight, Raid } from '../types';
import HighlightDetailModal from '../components/highlights/HighlightDetailModal';
import { AnimatedStatValue, RevealSection, StaggerContainer, StaggerItem } from '../components/motion';

interface HighlightsProps {
  onRaidClick?: (raidId: string) => void;
}

export function Highlights(_: HighlightsProps) {
  const highlights = useHighlights();
  const raids = useRoiRaids();
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
      <PageHeader
        eyebrow="Combat history"
        title="Highlights"
        meta={`${highlights.length} archived`}
        actions={
          <div className="flex flex-wrap items-center justify-end gap-3">
            <RoiViewToggle />
            <Button variant="secondary" size="sm" onClick={() => setShowFavorites(!showFavorites)}>
              <Heart size={14} className="mr-2" /> Favorites
            </Button>
          </div>
        }
      />

      <RevealSection immediate>
      <div className="hud-card p-4 grid grid-cols-2 md:grid-cols-3 gap-4">
        <div>
          <MetaLabel className="block mb-[var(--space-label-value)]">Total profit</MetaLabel>
          <DisplayValue tone="positive">
            <AnimatedStatValue value={`$${formatCurrency(raids.reduce((s, r) => s + r.netProfit, 0))}`} />
          </DisplayValue>
        </div>
        <div>
          <MetaLabel className="block mb-[var(--space-label-value)]">Total loot</MetaLabel>
          <DisplayValue tone="positive">
            <AnimatedStatValue value={`$${formatCurrency(raids.reduce((s, r) => s + r.lootValue, 0))}`} />
          </DisplayValue>
        </div>
        <div>
          <MetaLabel className="block mb-[var(--space-label-value)]">Total kills</MetaLabel>
          <DataValue tone="accent">
            <AnimatedStatValue value={raids.reduce((s, r) => s + (r.kills || 0), 0)} />
          </DataValue>
        </div>
      </div>
      </RevealSection>

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

      <StaggerContainer className="space-y-3">
        {filteredHighlights.length > 0 ? (
          filteredHighlights.map(({ highlight, raid }) => (
            <StaggerItem key={highlight.raidId}>
            <motion.div
              className="hud-card rounded-xl p-2 flex items-center justify-between hover-glow-orange"
              whileHover={{ y: -2 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center gap-3">
                <div className="hud-icon" aria-hidden>
                  {raid.status === 'EXTRACTED' ? (
                    <div className="text-positive text-lg">●</div>
                  ) : (
                    <div className="text-negative text-lg">✖</div>
                  )}
                </div>
                <div className="min-w-0">
                  <MapName className="block truncate">{raid.map} · {raid.mode}</MapName>
                  <Caption tone="muted" className="block mt-[var(--space-value-meta)]">{formatDateTime(highlight.timestamp)}</Caption>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="orange">{highlight.category}</Badge>
                    {highlight.isFavorite && <Badge variant="default">Favorite</Badge>}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="grid grid-cols-4 gap-2 text-right hud-stats">
                  <div>
                    <MetaLabel className="block mb-[var(--space-label-value)]">Kills</MetaLabel>
                    <DataValue>{raid.kills}</DataValue>
                  </div>
                  <div>
                    <MetaLabel className="block mb-[var(--space-label-value)]">Loot</MetaLabel>
                    <DataValue tone="positive">${formatCurrency(raid.lootValue)}</DataValue>
                  </div>
                  <div>
                    <MetaLabel className="block mb-[var(--space-label-value)]">Net</MetaLabel>
                    <DataValue tone={raid.netProfit >= 0 ? 'positive' : 'negative'}>${formatCurrency(raid.netProfit)}</DataValue>
                  </div>
                  <div>
                    <MetaLabel className="block mb-[var(--space-label-value)]">ROI</MetaLabel>
                    <DataValue tone={(raid.roi ?? 0) >= 0 ? 'positive' : 'negative'}>{(raid.roi ?? 0).toFixed(1)}%</DataValue>
                  </div>
                </div>

                <button className="p-2 rounded-md hover-glow-orange" onClick={() => setDetailRaidId(raid.id)} aria-label="View details">
                  <Eye className="text-abi-orange" />
                </button>
              </div>
            </motion.div>
            </StaggerItem>
          ))
        ) : (
          <EmptyState icon={<Star size={48} />} title="No highlights" description={showFavorites ? "No favorites yet" : "No highlight archive entries"} />
        )}
      </StaggerContainer>

      {detailRaidId && (
        <HighlightDetailModal raidId={detailRaidId} onClose={() => setDetailRaidId(null)} />
      )}
    </div>
  );
}
