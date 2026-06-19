import { useState, useMemo } from 'react';
import { Card, Badge, Button, EmptyState, Tabs } from '../components/ui';
import { getHighlights, getRaids } from '../utils/storage';
import { formatCurrency, formatDateTime } from '../utils/economy';
import { STATUS_ICONS } from '../data/constants';
import { Star, Heart, TrendingUp, Target, Package } from 'lucide-react';
import type { Highlight, Raid } from '../types';

interface HighlightsProps {
  onRaidClick: (raidId: string) => void;
}

type HighlightCategory = 'all' | 'profit' | 'kills' | 'rare' | 'manual';

export function Highlights({ onRaidClick }: HighlightsProps) {
  const highlights = getHighlights();
  const raids = getRaids();
  const [categoryFilter, setCategoryFilter] = useState<HighlightCategory>('all');
  const [showFavorites, setShowFavorites] = useState(false);

  // Map raid id to raid
  const raidMap = useMemo(() => {
    const map = new Map<string, Raid>();
    raids.forEach(r => map.set(r.id, r));
    return map;
  }, [raids]);

  // Filtered highlights
  const filteredHighlights = useMemo(() => {
    let result = highlights.map(h => ({
      highlight: h,
      raid: raidMap.get(h.raidId),
    })).filter(item => item.raid) as { highlight: Highlight; raid: Raid }[];

    if (showFavorites) {
      result = result.filter(item => item.highlight.isFavorite);
    }

    if (categoryFilter !== 'all') {
      result = result.filter(item => item.highlight.category === categoryFilter);
    }

    return result.sort((a, b) => b.highlight.timestamp - a.highlight.timestamp);
  }, [highlights, raidMap, categoryFilter, showFavorites]);

  const categoryIcons = {
    profit: <TrendingUp size={14} />,
    kills: <Target size={14} />,
    rare: <Package size={14} />,
    manual: <Star size={14} />,
  };

  const categoryLabels = {
    profit: 'Profit',
    kills: 'Kills',
    rare: 'Rare Loot',
    manual: 'Manual',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-abi-text flex items-center gap-2">
            <Star className="text-abi-orange" size={28} />
            Highlights
          </h1>
          <p className="text-abi-text-muted text-sm mt-1">
            Your most memorable raids
          </p>
        </div>
        <Button
          variant={showFavorites ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setShowFavorites(!showFavorites)}
        >
          <Heart size={16} className="mr-1" /> Favorites
        </Button>
      </div>

      {/* Filters */}
      <Tabs
        tabs={[
          { id: 'all', label: 'All' },
          { id: 'profit', label: 'Profit', icon: <TrendingUp size={14} /> },
          { id: 'kills', label: 'Kills', icon: <Target size={14} /> },
          { id: 'rare', label: 'Rare', icon: <Package size={14} /> },
          { id: 'manual', label: 'Manual', icon: <Star size={14} /> },
        ]}
        activeTab={categoryFilter}
        onChange={(id) => setCategoryFilter(id as HighlightCategory)}
      />

      {/* Highlights Grid */}
      {filteredHighlights.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredHighlights.map(({ highlight, raid }) => (
            <Card
              key={highlight.raidId}
              className="p-4 cursor-pointer group"
              hover
              onClick={() => onRaidClick(raid.id)}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <Badge variant="orange" size="sm">
                  {categoryIcons[highlight.category]}
                  <span className="ml-1">{categoryLabels[highlight.category]}</span>
                </Badge>
                {highlight.isFavorite && (
                  <Heart size={16} className="text-red-400 fill-red-400" />
                )}
              </div>

              {/* Stats */}
              <div className="mb-3">
                <p className={`text-2xl font-bold ${raid.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {raid.netProfit >= 0 ? '+' : ''}${formatCurrency(raid.netProfit)}
                </p>
                <p className="text-sm text-abi-text-muted">
                  {raid.map} • {STATUS_ICONS[raid.status]} {raid.status}
                </p>
              </div>

              {/* Reason */}
              <p className="text-sm text-abi-text">{highlight.reason}</p>

              {/* Footer */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-abi-border text-xs text-abi-text-dim">
                <span>{formatDateTime(highlight.timestamp)}</span>
                <span>{raid.kills} kills</span>
              </div>

              {/* Hover glow effect */}
              <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-br from-abi-orange/5 to-transparent rounded-xl" />
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Star size={48} />}
          title="No highlights yet"
          description={
            showFavorites
              ? "You haven't favorited any highlights"
              : "Raids with exceptional profit, kills, or rare loot will appear here"
          }
        />
      )}
    </div>
  );
}
