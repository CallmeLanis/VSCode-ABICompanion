import { useMemo } from 'react';
import { getRaids } from '../utils/storage';
import { formatCurrency, formatNumber } from '../utils/mockData';

export function Economy() {
  const raids = useMemo(() => getRaids(), []);

  const ammoSpent = useMemo(() => {
    return raids.reduce((sum, r) =>
      sum + r.ammo.reduce((aSum, a) => aSum + a.totalCost, 0), 0);
  }, [raids]);

  const consumablesSpent = useMemo(() => {
    return raids.reduce((sum, r) =>
      sum + r.consumables.reduce((cSum, c) => cSum + c.totalCost, 0), 0);
  }, [raids]);

  const gearLost = useMemo(() => {
    return raids.reduce((sum, r) => {
      if (r.status === 'DIED' && r.gearRescue) {
        return sum + r.gearRescue.gearLoss;
      } else if (r.status === 'DIED') {
        return sum + r.gearValue;
      }
      return sum;
    }, 0);
  }, [raids]);

  const totalSpend = ammoSpent + consumablesSpent + gearLost;

  const cumulativePL = useMemo(() => {
    const sorted = [...raids].sort((a, b) => a.timestamp - b.timestamp);
    let cumulative = 0;
    return sorted.map(raid => {
      cumulative += raid.netProfit;
      return cumulative;
    });
  }, [raids]);

  const spendSegments = useMemo(() => {
    const gearValue = raids.reduce((sum, r) => sum + r.gearValue, 0);
    return [
      { label: 'GEAR', value: gearValue, color: '#FF5500' },
      { label: 'AMMO', value: ammoSpent, color: '#FF2233' },
      { label: 'CONSUMABLES', value: consumablesSpent, color: '#00CC44' },
    ];
  }, [raids, ammoSpent, consumablesSpent]);

  const ammoUsageRows = useMemo(() => {
    const ammoMap = new Map<string, {
      ammo: string;
      family: string;
      tier: string;
      rounds: number;
      unit: number;
      total: number;
    }>();

    raids.forEach(raid => {
      raid.ammo.forEach(ammo => {
        const key = ammo.caliber;
        const existing = ammoMap.get(key);
        if (existing) {
          existing.rounds += ammo.quantity;
          existing.total += ammo.totalCost;
          existing.unit = Math.max(existing.unit, ammo.costPerRound);
        } else {
          ammoMap.set(key, {
            ammo: ammo.caliber,
            family: ammo.caliber,
            tier: ammo.tier,
            rounds: ammo.quantity,
            unit: ammo.costPerRound,
            total: ammo.totalCost,
          });
        }
      });
    });

    return Array.from(ammoMap.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);
  }, [raids]);

  const consumableRows = useMemo(() => {
    const consumableMap = new Map<string, {
      item: string;
      subtype: string;
      qty: number;
      unit: number;
      total: number;
    }>();

    raids.forEach(raid => {
      raid.consumables.forEach(consumable => {
        const key = consumable.name;
        const existing = consumableMap.get(key);
        if (existing) {
          existing.qty += consumable.quantity;
          existing.total += consumable.totalCost;
          existing.unit = Math.max(existing.unit, consumable.costPerUnit);
        } else {
          consumableMap.set(key, {
            item: consumable.name,
            subtype: consumable.type === 'treatment' ? 'Treatments' : 'Blast',
            qty: consumable.quantity,
            unit: consumable.costPerUnit,
            total: consumable.totalCost,
          });
        }
      });
    });

    return Array.from(consumableMap.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);
  }, [raids]);

  const totals = spendSegments.reduce((sum, item) => sum + item.value, 0);

  const minY = Math.min(...cumulativePL, 0);
  const maxY = Math.max(...cumulativePL, 0);
  const padding = 20;
  const chartWidth = 760;
  const chartHeight = 320;

  const linePath = useMemo(() => {
    if (cumulativePL.length === 0) return '';
    return cumulativePL
      .map((value, index) => {
        const x = (index / (cumulativePL.length - 1)) * chartWidth;
        const y = padding + (chartHeight - padding * 2) * (1 - (value - minY) / (maxY - minY || 1));
        return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(' ');
  }, [cumulativePL, minY, maxY]);

  const donutOffsets = useMemo(() => {
    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    let offset = 0;
    return spendSegments.map((segment) => {
      const dash = (segment.value / totals) * circumference;
      const current = { dash, offset };
      offset += dash;
      return current;
    });
  }, [spendSegments, totals]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="hud-label text-xs tracking-[0.3em] mb-2">ECONOMY INTELLIGENCE</p>
          <h1 className="text-4xl lg:text-5xl font-black text-abi-text">Financial Overview</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="hud-chip rounded-full px-4 py-2 tracking-[0.24em] text-xs uppercase text-abi-orange border border-abi-orange/25">
            All Raids
          </span>
        </div>
      </div>

      {/* Main Content: 60/40 Split */}
      <div className="grid grid-cols-1 xl:grid-cols-[60%_40%] gap-4">
        {/* Cumulative P/L Chart */}
        <div className="hud-card rounded-xl p-5 relative">
          <div className="corner-accent top-left" />
          <div className="corner-accent top-right" />
          <div className="corner-accent bottom-left" />
          <div className="corner-accent bottom-right" />

          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="hud-label mb-2">CUMULATIVE P/L</p>
              <h2 className="text-2xl font-black text-abi-text">Net Worth Performance</h2>
            </div>
            <span className="text-xs uppercase tracking-[0.28em] text-abi-text-muted mt-1">ALL RAIDS</span>
          </div>

          <div className="relative">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-[320px]">
              <defs>
                <linearGradient id="plGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#ff5500" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#ff5500" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Grid lines */}
              {[0, 1, 2, 3].map((row) => {
                const y = padding + row * (chartHeight - padding * 2) / 3;
                return (
                  <g key={row}>
                    <line x1="0" y1={y} x2={chartWidth} y2={y} stroke="rgba(255,255,255,0.08)" strokeDasharray="4 6" />
                  </g>
                );
              })}

              {/* Y-axis labels */}
              {[-20000000, 0, 20000000, 40000000, 60000000].map((value) => {
                const y = padding + (chartHeight - padding * 2) * (1 - (value - minY) / (maxY - minY || 1));
                return (
                  <text key={value} x="-4" y={y + 4} textAnchor="end" fontSize="11" fill="#888888">
                    {value.toLocaleString()}
                  </text>
                );
              })}

              {/* Line path */}
              {linePath && (
                <>
                  <path d={linePath} fill="none" stroke="#ff5500" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  <path d={`${linePath} L ${chartWidth} ${chartHeight - padding} L 0 ${chartHeight - padding} Z`} fill="url(#plGradient)" opacity="0.8" />
                </>
              )}

              {/* X-axis labels */}
              {cumulativePL.length > 0 && [0, Math.floor(cumulativePL.length / 4), Math.floor(cumulativePL.length / 2), Math.floor(cumulativePL.length * 3 / 4), cumulativePL.length - 1].map((index) => {
                const x = (index / (cumulativePL.length - 1)) * chartWidth;
                return (
                  <text key={index} x={x} y={chartHeight - 5} textAnchor="middle" fontSize="11" fill="#888888">
                    R{index + 1}
                  </text>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Spend Breakdown Donut */}
        <div className="hud-card rounded-xl p-5 relative">
          <div className="corner-accent top-left" />
          <div className="corner-accent top-right" />
          <div className="corner-accent bottom-left" />
          <div className="corner-accent bottom-right" />

          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="hud-label mb-2">SPEND BREAKDOWN</p>
              <h2 className="text-2xl font-black text-abi-text">Expense Distribution</h2>
            </div>
          </div>

          <div className="flex flex-col items-center gap-6">
            <div className="relative w-full max-w-[280px] h-[280px]">
              <svg viewBox="0 0 220 220" className="w-full h-full">
                <circle cx="110" cy="110" r="80" fill="transparent" stroke="rgba(255,255,255,0.08)" strokeWidth="20" />
                {spendSegments.map((segment, index) => {
                  const radius = 80;
                  const circumference = 2 * Math.PI * radius;
                  const offset = donutOffsets[index].offset;
                  const dash = donutOffsets[index].dash;
                  return (
                    <circle
                      key={segment.label}
                      cx="110"
                      cy="110"
                      r={radius}
                      fill="transparent"
                      stroke={segment.color}
                      strokeWidth="20"
                      strokeDasharray={`${dash} ${circumference - dash}`}
                      strokeDashoffset={-offset}
                      strokeLinecap="butt"
                      transform="rotate(-90 110 110)"
                    >
                      <title>{`${segment.label}: ${formatCurrency(segment.value)}`}</title>
                    </circle>
                  );
                })}
                <text x="110" y="112" textAnchor="middle" fontSize="14" fill="#ffffff" fontWeight="700">Spend</text>
                <text x="110" y="132" textAnchor="middle" fontSize="10" fill="#888888">Breakdown</text>
              </svg>
            </div>

            <div className="space-y-3 w-full">
              {spendSegments.map((segment) => (
                <div key={segment.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: segment.color }} />
                    <span className="text-sm uppercase tracking-[0.28em] text-abi-text-muted">{segment.label}</span>
                  </div>
                  <span className="text-sm font-semibold text-abi-text">{formatCurrency(segment.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Two Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Most Expensive Ammo Usage */}
        <div className="hud-card rounded-xl p-5 relative">
          <div className="corner-accent top-left" />
          <div className="corner-accent top-right" />
          <div className="corner-accent bottom-left" />
          <div className="corner-accent bottom-right" />

          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="hud-label mb-2">MOST EXPENSIVE AMMO USAGE</p>
              <h2 className="text-xl font-black text-abi-text">Ammo spend leaderboard</h2>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-abi-border">
            <div className="grid grid-cols-[1.4fr_1fr_0.7fr_0.7fr_0.9fr_1fr] gap-3 px-4 py-3 text-xs uppercase tracking-[0.24em] text-abi-text-muted bg-[#10101a]">
              <span>Ammo</span>
              <span>Family</span>
              <span>Tier</span>
              <span>Rounds</span>
              <span>Unit</span>
              <span>Total</span>
            </div>
            <div className="divide-y divide-abi-border">
              {ammoUsageRows.map((row) => (
                <div key={row.ammo} className="grid grid-cols-[1.4fr_1fr_0.7fr_0.7fr_0.9fr_1fr] gap-3 px-4 py-4 transition hover:bg-abi-bg-hover cursor-default">
                  <span className="text-sm text-abi-text">{row.ammo}</span>
                  <span className="text-sm text-abi-text-muted">{row.family}</span>
                  <span className="inline-flex items-center justify-center rounded-full border border-abi-orange px-2 py-1 text-[11px] uppercase tracking-[0.24em] text-abi-orange">
                    {row.tier}
                  </span>
                  <span className="text-sm text-abi-text">{formatNumber(row.rounds)}</span>
                  <span className="text-sm text-abi-text">{formatCurrency(row.unit)}</span>
                  <span className="text-sm font-semibold text-red-400">{formatCurrency(row.total)}</span>
                </div>
              ))}
              {ammoUsageRows.length > 0 && (
                <div className="grid grid-cols-[1.4fr_1fr_0.7fr_0.7fr_0.9fr_1fr] gap-3 px-4 py-3 bg-abi-bg/30">
                  <span className="text-xs uppercase tracking-wider text-abi-text-muted">Total</span>
                  <span />
                  <span />
                  <span />
                  <span />
                  <span className="text-sm font-bold text-red-400">
                    {formatCurrency(ammoUsageRows.reduce((sum, r) => sum + r.total, 0))}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Consumable Spending */}
        <div className="hud-card rounded-xl p-5 relative">
          <div className="corner-accent top-left" />
          <div className="corner-accent top-right" />
          <div className="corner-accent bottom-left" />
          <div className="corner-accent bottom-right" />

          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="hud-label mb-2">CONSUMABLE SPENDING</p>
              <h2 className="text-xl font-black text-abi-text">Outlay by item</h2>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-abi-border">
            <div className="grid grid-cols-[1.4fr_1fr_0.7fr_0.9fr_1fr] gap-3 px-4 py-3 text-xs uppercase tracking-[0.24em] text-abi-text-muted bg-[#10101a]">
              <span>Item</span>
              <span>Subtype</span>
              <span>Qty</span>
              <span>Unit</span>
              <span>Total</span>
            </div>
            <div className="divide-y divide-abi-border">
              {consumableRows.map((row) => (
                <div key={row.item} className="grid grid-cols-[1.4fr_1fr_0.7fr_0.9fr_1fr] gap-3 px-4 py-4 transition hover:bg-abi-bg-hover cursor-default">
                  <span className="text-sm text-abi-text">{row.item}</span>
                  <span className="text-sm text-abi-text-muted">{row.subtype}</span>
                  <span className="text-sm text-abi-text">{formatNumber(row.qty)}</span>
                  <span className="text-sm text-abi-text">{formatCurrency(row.unit)}</span>
                  <span className="text-sm font-semibold text-red-400">{formatCurrency(row.total)}</span>
                </div>
              ))}
              {consumableRows.length > 0 && (
                <div className="grid grid-cols-[1.4fr_1fr_0.7fr_0.9fr_1fr] gap-3 px-4 py-3 bg-abi-bg/30">
                  <span className="text-xs uppercase tracking-wider text-abi-text-muted">Total</span>
                  <span />
                  <span />
                  <span />
                  <span className="text-sm font-bold text-red-400">
                    {formatCurrency(consumableRows.reduce((sum, r) => sum + r.total, 0))}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}