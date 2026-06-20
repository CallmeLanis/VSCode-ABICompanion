import { useMemo } from 'react';
import { getRaids } from '../utils/storage';
import { formatCurrency, formatPercentage, formatNumber } from '../utils/mockData';

export function Performance() {
  const raids = useMemo(() => getRaids(), []);

  const modeEfficiency = useMemo(() => {
    const modes = ['Normal', 'Lockdown', 'Forbidden'];
    return modes.map(mode => {
      const modeRaids = raids.filter(r => r.mode === mode);
      const extracted = modeRaids.filter(r => r.status === 'EXTRACTED');
      const extractPct = modeRaids.length > 0 ? (extracted.length / modeRaids.length) * 100 : 0;
      const avgProfit = modeRaids.length > 0
        ? modeRaids.reduce((sum, r) => sum + r.netProfit, 0) / modeRaids.length
        : 0;
      const avgROI = modeRaids.length > 0
        ? modeRaids.reduce((sum, r) => sum + r.roi, 0) / modeRaids.length
        : 0;
      const avgAmmo = modeRaids.length > 0
        ? modeRaids.reduce((sum, r) => sum + r.ammo.reduce((aSum, a) => aSum + a.totalCost, 0), 0) / modeRaids.length
        : 0;
      const avgCons = modeRaids.length > 0
        ? modeRaids.reduce((sum, r) => sum + r.consumables.reduce((cSum, c) => cSum + c.totalCost, 0), 0) / modeRaids.length
        : 0;
      const totalNet = modeRaids.reduce((sum, r) => sum + r.netProfit, 0);

      return {
        mode,
        raids: modeRaids.length,
        extractPct,
        avgProfit,
        avgROI,
        avgAmmo,
        avgCons,
        totalNet,
      };
    });
  }, [raids]);

  const mapProfitability = useMemo(() => {
    const maps = ['Valley', 'TV Station', 'Farm'];
    return maps.map(map => {
      const mapRaids = raids.filter(r => r.map === map);
      const extracted = mapRaids.filter(r => r.status === 'EXTRACTED');
      const extractPct = mapRaids.length > 0 ? (extracted.length / mapRaids.length) * 100 : 0;
      const avgProfit = mapRaids.length > 0
        ? mapRaids.reduce((sum, r) => sum + r.netProfit, 0) / mapRaids.length
        : 0;
      const avgROI = mapRaids.length > 0
        ? mapRaids.reduce((sum, r) => sum + r.roi, 0) / mapRaids.length
        : 0;
      const totalNet = mapRaids.reduce((sum, r) => sum + r.netProfit, 0);

      return {
        map,
        raids: mapRaids.length,
        extractPct,
        avgProfit,
        avgROI,
        totalNet,
      };
    });
  }, [raids]);

  const tacticalHeatmap = useMemo(() => {
    const maps = ['Valley', 'TV Station', 'Farm'];
    return maps.map(map => {
      const mapRaids = raids.filter(r => r.map === map);
      const extracted = mapRaids.filter(r => r.status === 'EXTRACTED');
      const extractPct = mapRaids.length > 0 ? (extracted.length / mapRaids.length) * 100 : 0;
      const avgNet = mapRaids.length > 0
        ? mapRaids.reduce((sum, r) => sum + r.netProfit, 0) / mapRaids.length
        : 0;
      const totalNet = mapRaids.reduce((sum, r) => sum + r.netProfit, 0);

      const bestMode = mapRaids.length > 0
        ? mapRaids.reduce((best, r) => r.netProfit > best.netProfit ? r : best, mapRaids[0]).mode
        : 'N/A';

      return {
        map,
        totalRaids: mapRaids.length,
        extractPct,
        avgNet,
        totalNet,
        bestMode,
      };
    });
  }, [raids]);

  const performanceTrends = useMemo(() => {
    const sorted = [...raids].sort((a, b) => a.timestamp - b.timestamp);
    return sorted.map(raid => raid.netProfit);
  }, [raids]);

  const roiAnalytics = useMemo(() => {
    const sorted = [...raids].sort((a, b) => a.timestamp - b.timestamp);
    return sorted.map(raid => raid.roi);
  }, [raids]);

  const chartWidth = 760;
  const chartHeight = 320;
  const padding = 32;
  const chartDrawHeight = chartHeight - padding * 2;

  const performancePath = useMemo(() => {
    if (performanceTrends.length === 0) return '';
    const min = Math.min(...performanceTrends);
    const max = Math.max(...performanceTrends);
    const range = max - min || 1;
    return performanceTrends
      .map((value, index) => {
        const x = (index / (performanceTrends.length - 1)) * chartWidth;
        const y = padding + chartDrawHeight * (1 - (value - min) / range);
        return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(' ');
  }, [performanceTrends]);

  const roiPath = useMemo(() => {
    if (roiAnalytics.length === 0) return '';
    const min = Math.min(...roiAnalytics, 0);
    const max = Math.max(...roiAnalytics, 0);
    const range = max - min || 1;
    return roiAnalytics
      .map((value, index) => {
        const x = (index / (roiAnalytics.length - 1)) * chartWidth;
        const y = padding + chartDrawHeight * (1 - (value - min) / range);
        return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(' ');
  }, [roiAnalytics]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="hud-label text-xs tracking-[0.3em] mb-2">TACTICAL PERFORMANCE</p>
          <h1 className="text-4xl lg:text-5xl font-black text-abi-text">Performance Analytics</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="hud-chip rounded-full px-4 py-2 tracking-[0.24em] text-xs uppercase text-abi-orange border border-abi-orange/25">
            All Modes
          </span>
        </div>
      </div>

      {/* Mode Efficiency */}
      <div className="hud-card rounded-xl p-5 relative">
        <div className="corner-accent top-left" />
        <div className="corner-accent top-right" />
        <div className="corner-accent bottom-left" />
        <div className="corner-accent bottom-right" />

        <h3 className="hud-heading text-sm mb-4">MODE EFFICIENCY</h3>

        <div className="overflow-hidden rounded-2xl border border-abi-border">
          <div className="grid grid-cols-[1.5fr_1fr_1fr_1.2fr_1fr_1fr_1fr_1.2fr] gap-3 px-4 py-3 text-xs uppercase tracking-[0.24em] text-abi-text-muted bg-[#10101a]">
            <span>Mode</span>
            <span>Raids</span>
            <span>Extract %</span>
            <span>Avg Profit</span>
            <span>Avg ROI</span>
            <span>Avg Ammo</span>
            <span>Avg Cons.</span>
            <span>Total Net</span>
          </div>
          <div className="divide-y divide-abi-border">
            {modeEfficiency.map((row) => (
              <div key={row.mode} className="grid grid-cols-[1.5fr_1fr_1fr_1.2fr_1fr_1fr_1fr_1.2fr] gap-3 px-4 py-4 transition hover:bg-abi-bg-hover cursor-default">
                <span className="text-sm font-medium text-abi-text uppercase">{row.mode}</span>
                <span className="text-sm text-abi-text">{formatNumber(row.raids)}</span>
                <span className="text-sm text-abi-text">{formatPercentage(row.extractPct)}</span>
                <span className="text-sm font-semibold text-green-400">{formatCurrency(row.avgProfit)}</span>
                <span className="text-sm font-semibold text-green-400">{formatPercentage(row.avgROI)}</span>
                <span className="text-sm text-abi-text">{formatCurrency(row.avgAmmo)}</span>
                <span className="text-sm text-abi-text">{formatCurrency(row.avgCons)}</span>
                <span className={`text-sm font-semibold ${row.totalNet >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatCurrency(row.totalNet)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Map Profitability */}
      <div className="hud-card rounded-xl p-5 relative">
        <div className="corner-accent top-left" />
        <div className="corner-accent top-right" />
        <div className="corner-accent bottom-left" />
        <div className="corner-accent bottom-right" />

        <h3 className="hud-heading text-sm mb-4">MAP PROFITABILITY</h3>

        <div className="overflow-hidden rounded-2xl border border-abi-border">
          <div className="grid grid-cols-[1.5fr_1fr_1fr_1.2fr_1fr_1.2fr] gap-3 px-4 py-3 text-xs uppercase tracking-[0.24em] text-abi-text-muted bg-[#10101a]">
            <span>Map</span>
            <span>Raids</span>
            <span>Extract %</span>
            <span>Avg Profit</span>
            <span>Avg ROI</span>
            <span>Total Net</span>
          </div>
          <div className="divide-y divide-abi-border">
            {mapProfitability.map((row) => (
              <div key={row.map} className="grid grid-cols-[1.5fr_1fr_1fr_1.2fr_1fr_1.2fr] gap-3 px-4 py-4 transition hover:bg-abi-bg-hover cursor-default">
                <span className="text-sm font-medium text-abi-text uppercase">{row.map}</span>
                <span className="text-sm text-abi-text">{formatNumber(row.raids)}</span>
                <span className="text-sm text-abi-text">{formatPercentage(row.extractPct)}</span>
                <span className={`text-sm font-semibold ${row.avgProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatCurrency(row.avgProfit)}
                </span>
                <span className={`text-sm font-semibold ${row.avgROI >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatPercentage(row.avgROI)}
                </span>
                <span className={`text-sm font-semibold ${row.totalNet >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatCurrency(row.totalNet)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tactical Heatmap */}
      <div className="hud-card rounded-xl p-5 relative">
        <div className="corner-accent top-left" />
        <div className="corner-accent top-right" />
        <div className="corner-accent bottom-left" />
        <div className="corner-accent bottom-right" />

        <div className="flex items-center justify-between mb-4">
          <h3 className="hud-heading text-sm">TACTICAL HEATMAP</h3>
          <span className="text-xs text-abi-text-muted uppercase tracking-wider">Per-Map Performance</span>
        </div>

        <div className="overflow-hidden rounded-2xl border border-abi-border">
          <div className="grid grid-cols-[1.5fr_1fr_1fr_1.2fr_1.2fr] gap-3 px-4 py-3 text-xs uppercase tracking-[0.24em] text-abi-text-muted bg-[#10101a]">
            <span>Map</span>
            <span>Total Raids</span>
            <span>Extraction %</span>
            <span>Avg Net</span>
            <span>Best Mode</span>
          </div>
          <div className="divide-y divide-abi-border">
            {tacticalHeatmap.map((row) => (
              <div key={row.map} className="grid grid-cols-[1.5fr_1fr_1fr_1.2fr_1.2fr] gap-3 px-4 py-4 transition hover:bg-abi-bg-hover cursor-default">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${row.map === 'Valley' ? 'bg-green-400' : row.map === 'TV Station' ? 'bg-abi-orange' : 'bg-red-400'}`} />
                  <span className="text-sm font-medium text-abi-text uppercase">{row.map}</span>
                </div>
                <span className="text-sm text-abi-text">{formatNumber(row.totalRaids)}</span>
                <span className="text-sm text-abi-text">{formatPercentage(row.extractPct)}</span>
                <span className={`text-sm font-semibold ${row.avgNet >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatCurrency(row.avgNet)}
                </span>
                <span className="text-sm font-medium text-abi-text uppercase">{row.bestMode}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row: Two Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Performance Trends */}
        <div className="hud-card rounded-xl p-5 relative">
          <div className="corner-accent top-left" />
          <div className="corner-accent top-right" />
          <div className="corner-accent bottom-left" />
          <div className="corner-accent bottom-right" />

          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="hud-label mb-2">PERFORMANCE TRENDS</p>
              <h2 className="text-xl font-black text-abi-text">Raid Variance</h2>
            </div>
          </div>

          <div className="relative">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-[320px]">
              <defs>
                <linearGradient id="perfGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#00ff66" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#00ff66" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Grid lines */}
              {[0, 1, 2, 3].map((row) => {
                const y = padding + row * chartDrawHeight / 3;
                return (
                  <g key={row}>
                    <line x1="0" y1={y} x2={chartWidth} y2={y} stroke="rgba(255,255,255,0.08)" strokeDasharray="4 6" />
                  </g>
                );
              })}

              {/* Zero line */}
              {(() => {
                const min = Math.min(...performanceTrends, 0);
                const max = Math.max(...performanceTrends, 0);
                const range = max - min || 1;
                const zeroY = padding + chartDrawHeight * (1 - (0 - min) / range);
                return (
                  <line x1="0" y1={zeroY} x2={chartWidth} y2={zeroY} stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                );
              })()}

              {/* Line path */}
              {performancePath && (
                <>
                  <path d={performancePath} fill="none" stroke="#00ff66" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d={`${performancePath} L ${chartWidth} ${chartHeight - padding} L 0 ${chartHeight - padding} Z`} fill="url(#perfGradient)" opacity="0.6" />
                </>
              )}

              {/* Y-axis labels */}
              {(() => {
                const min = Math.min(...performanceTrends, 0);
                const max = Math.max(...performanceTrends, 0);
                const range = max - min || 1;
                const values = [min, 0, max];
                return values.map((value, i) => {
                  const y = padding + chartDrawHeight * (1 - (value - min) / range);
                  return (
                    <text key={i} x="-4" y={y + 4} textAnchor="end" fontSize="11" fill="#888888">
                      {(value / 1000000).toFixed(1)}M
                    </text>
                  );
                });
              })()}
            </svg>
          </div>
        </div>

        {/* ROI Analytics */}
        <div className="hud-card rounded-xl p-5 relative">
          <div className="corner-accent top-left" />
          <div className="corner-accent top-right" />
          <div className="corner-accent bottom-left" />
          <div className="corner-accent bottom-right" />

          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="hud-label mb-2">ROI ANALYTICS</p>
              <h2 className="text-xl font-black text-abi-text">Return on Investment</h2>
            </div>
          </div>

          <div className="relative">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-[320px]">
              <defs>
                <linearGradient id="roiGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#ff5500" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#ff5500" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Grid lines */}
              {[0, 1, 2, 3].map((row) => {
                const y = padding + row * chartDrawHeight / 3;
                return (
                  <g key={row}>
                    <line x1="0" y1={y} x2={chartWidth} y2={y} stroke="rgba(255,255,255,0.08)" strokeDasharray="4 6" />
                  </g>
                );
              })}

              {/* Zero line */}
              {(() => {
                const min = Math.min(...roiAnalytics, 0);
                const max = Math.max(...roiAnalytics, 0);
                const range = max - min || 1;
                const zeroY = padding + chartDrawHeight * (1 - (0 - min) / range);
                return (
                  <line x1="0" y1={zeroY} x2={chartWidth} y2={zeroY} stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                );
              })()}

              {/* Line path */}
              {roiPath && (
                <>
                  <path d={roiPath} fill="none" stroke="#ff5500" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d={`${roiPath} L ${chartWidth} ${chartHeight - padding} L 0 ${chartHeight - padding} Z`} fill="url(#roiGradient)" opacity="0.6" />
                </>
              )}

              {/* Y-axis labels */}
              {(() => {
                const min = Math.min(...roiAnalytics, 0);
                const max = Math.max(...roiAnalytics, 0);
                const range = max - min || 1;
                const values = [min, 0, max];
                return values.map((value, i) => {
                  const y = padding + chartDrawHeight * (1 - (value - min) / range);
                  return (
                    <text key={i} x="-4" y={y + 4} textAnchor="end" fontSize="11" fill="#888888">
                      {value.toFixed(0)}%
                    </text>
                  );
                });
              })()}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}