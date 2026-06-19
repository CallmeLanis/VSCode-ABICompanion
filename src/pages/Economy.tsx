import { useMemo, useState } from 'react';
import { Card, Badge, Tabs, ProgressBar } from '../components/ui';
import { calculateEconomyBreakdown, calculatePerformanceTimeline } from '../utils/analytics';
import { formatCurrency, formatPercentage } from '../utils/economy';
import { TrendingUp, TrendingDown, Map, Target, BarChart, LineChart } from 'lucide-react';

type MapData = [string, { raids: number; profit: number; investment: number }];

export function Economy() {
  const [activeTab, setActiveTab] = useState('overview');
  const economyBreakdown = useMemo(() => calculateEconomyBreakdown(), []);
  const timeline = useMemo(() => calculatePerformanceTimeline(30), []);

  // Calculate best/worst map and mode
  const bestMap = useMemo((): MapData | null => {
    const entries = Object.entries(economyBreakdown.byMap) as MapData[];
    if (entries.length === 0) return null;
    return entries.reduce((best, current) =>
      current[1].profit > best[1].profit ? current : best
    );
  }, [economyBreakdown]);

  const worstMap = useMemo((): MapData | null => {
    const entries = Object.entries(economyBreakdown.byMap) as MapData[];
    if (entries.length === 0) return null;
    return entries.reduce((worst, current) =>
      current[1].profit < worst[1].profit ? current : worst
    );
  }, [economyBreakdown]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-abi-text flex items-center gap-2">
          <TrendingUp className="text-abi-orange" size={28} />
          Economy
        </h1>
        <p className="text-abi-text-muted text-sm mt-1">
          Detailed spending and profit analysis
        </p>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: 'overview', label: 'Overview', icon: <BarChart size={16} /> },
          { id: 'maps', label: 'Maps', icon: <Map size={16} /> },
          { id: 'modes', label: 'Modes', icon: <Target size={16} /> },
          { id: 'timeline', label: 'Timeline', icon: <LineChart size={16} /> },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === 'overview' && (
        <>
          {/* Spend Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="p-4">
              <h3 className="text-sm font-semibold text-abi-text-muted uppercase tracking-wider mb-4">
                Spending Breakdown
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-abi-text-muted">Ammo</span>
                    <span className="text-sm text-abi-text">${formatCurrency(economyBreakdown.ammoSpent)}</span>
                  </div>
                  <ProgressBar
                    value={economyBreakdown.ammoSpent}
                    max={economyBreakdown.totalSpend || 1}
                    variant="orange"
                    showLabel
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-abi-text-muted">Consumables</span>
                    <span className="text-sm text-abi-text">${formatCurrency(economyBreakdown.consumablesSpent)}</span>
                  </div>
                  <ProgressBar
                    value={economyBreakdown.consumablesSpent}
                    max={economyBreakdown.totalSpend || 1}
                    variant="info"
                    showLabel
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-abi-text-muted">Gear Lost</span>
                    <span className="text-sm text-abi-text">${formatCurrency(economyBreakdown.gearLost)}</span>
                  </div>
                  <ProgressBar
                    value={economyBreakdown.gearLost}
                    max={economyBreakdown.totalSpend || 1}
                    variant="danger"
                    showLabel
                  />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-abi-border">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-abi-text">Total Spend</span>
                  <span className="text-lg font-bold text-abi-orange">
                    ${formatCurrency(economyBreakdown.totalSpend)}
                  </span>
                </div>
              </div>
            </Card>

            {/* Best/Worst Performance */}
            <Card className="p-4">
              <h3 className="text-sm font-semibold text-abi-text-muted uppercase tracking-wider mb-4">
                Map Profitability
              </h3>
              {bestMap && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp size={16} className="text-green-400" />
                    <span className="text-sm text-abi-text-muted">Best Map</span>
                  </div>
                  <p className="text-lg font-bold text-abi-text">{bestMap[0]}</p>
                  <p className="text-green-400">
                    +${formatCurrency(bestMap[1].profit)} ({bestMap[1].raids} raids)
                  </p>
                </div>
              )}
              {worstMap && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown size={16} className="text-red-400" />
                    <span className="text-sm text-abi-text-muted">Worst Map</span>
                  </div>
                  <p className="text-lg font-bold text-abi-text">{worstMap[0]}</p>
                  <p className={worstMap[1].profit < 0 ? 'text-red-400' : 'text-abi-text-muted'}>
                    {worstMap[1].profit < 0 ? '' : '+'}${formatCurrency(worstMap[1].profit)} ({worstMap[1].raids} raids)
                  </p>
                </div>
              )}
              {!bestMap && !worstMap && (
                <p className="text-abi-text-dim text-sm">Not enough data</p>
              )}
            </Card>

            {/* Spend Ratios */}
            <Card className="p-4">
              <h3 className="text-sm font-semibold text-abi-text-muted uppercase tracking-wider mb-4">
                Investment Ratios
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-abi-text-muted">Ammo %</span>
                  <span className="text-abi-text">
                    {economyBreakdown.totalSpend > 0
                      ? formatPercentage((economyBreakdown.ammoSpent / economyBreakdown.totalSpend) * 100)
                      : '0%'
                    }
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-abi-text-muted">Consumables %</span>
                  <span className="text-abi-text">
                    {economyBreakdown.totalSpend > 0
                      ? formatPercentage((economyBreakdown.consumablesSpent / economyBreakdown.totalSpend) * 100)
                      : '0%'
                    }
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-abi-text-muted">Gear Loss %</span>
                  <span className="text-abi-text">
                    {economyBreakdown.totalSpend > 0
                      ? formatPercentage((economyBreakdown.gearLost / economyBreakdown.totalSpend) * 100)
                      : '0%'
                    }
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}

      {activeTab === 'maps' && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-abi-text-muted uppercase tracking-wider mb-4">
            Profit by Map
          </h3>
          {Object.keys(economyBreakdown.byMap).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(economyBreakdown.byMap).map(([map, data]) => (
                <div key={map} className="flex items-center gap-4">
                  <span className="w-32 text-sm text-abi-text">{map}</span>
                  <ProgressBar
                    value={Math.abs(data.profit)}
                    max={Math.max(...Object.values(economyBreakdown.byMap).map(d => Math.abs(d.profit)))}
                    variant={data.profit >= 0 ? 'success' : 'danger'}
                    className="flex-1"
                  />
                  <span className={`w-24 text-right text-sm ${data.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {data.profit >= 0 ? '+' : ''}${formatCurrency(data.profit)}
                  </span>
                  <Badge variant="default" size="sm">{data.raids}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-abi-text-dim">No map data available</p>
          )}
        </Card>
      )}

      {activeTab === 'modes' && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-abi-text-muted uppercase tracking-wider mb-4">
            Profit by Game Mode
          </h3>
          {Object.keys(economyBreakdown.byMode).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(economyBreakdown.byMode).map(([mode, data]) => (
                <div key={mode} className="flex items-center gap-4">
                  <span className="w-32 text-sm text-abi-text">{mode}</span>
                  <ProgressBar
                    value={Math.abs(data.profit)}
                    max={Math.max(...Object.values(economyBreakdown.byMode).map(d => Math.abs(d.profit)))}
                    variant={data.profit >= 0 ? 'success' : 'danger'}
                    className="flex-1"
                  />
                  <span className={`w-24 text-right text-sm ${data.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {data.profit >= 0 ? '+' : ''}${formatCurrency(data.profit)}
                  </span>
                  <Badge variant="default" size="sm">{data.raids}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-abi-text-dim">No mode data available</p>
          )}
        </Card>
      )}

      {activeTab === 'timeline' && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-abi-text-muted uppercase tracking-wider mb-4">
            30-Day Performance
          </h3>
          {timeline.length > 0 ? (
            <div className="overflow-x-auto">
              <div className="min-w-[600px] h-48 flex items-end gap-1">
                {timeline.map((day, i) => {
                  const maxProfit = Math.max(...timeline.map(t => Math.abs(t.profit)));
                  const height = maxProfit > 0 ? (Math.abs(day.profit) / maxProfit) * 100 : 0;
                  return (
                    <div
                      key={i}
                      className="flex-1 flex flex-col items-center justify-end"
                      title={`${day.date}: $${formatCurrency(day.profit)} (${day.raids} raids)`}
                    >
                      <div
                        className={`w-full rounded-t transition-all duration-200 hover:opacity-80 ${day.profit >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                        style={{ height: `${Math.max(height, 4)}%` }}
                      />
                    </div>
                  );
                })}
              </div>
              {/* X-axis labels */}
              <div className="flex justify-between text-xs text-abi-text-dim mt-2 min-w-[600px]">
                <span>{timeline[0]?.date}</span>
                <span>{timeline[Math.floor(timeline.length / 2)]?.date}</span>
                <span>{timeline[timeline.length - 1]?.date}</span>
              </div>
            </div>
          ) : (
            <p className="text-abi-text-dim">No timeline data available</p>
          )}
        </Card>
      )}
    </div>
  );
}
