import type { Raid, Session, Highlight } from '../types';
import { generateId } from './storage';

// Generate mock raids matching the reference images
export function generateMockRaids(): Raid[] {
  const raids: Raid[] = [];
  const maps = ['TV Station', 'Farm', 'Valley', 'Lockdown', 'Forbidden'];
  const modes: Array<'Normal' | 'Lockdown' | 'Forbidden'> = ['Normal', 'Lockdown', 'Forbidden'];
  const statuses: Array<'EXTRACTED' | 'DIED'> = ['EXTRACTED', 'DIED'];

  const baseTime = Date.now() - 143 * 24 * 60 * 60 * 1000; // 143 days ago

  for (let i = 0; i < 143; i++) {
    const timestamp = baseTime + i * 24 * 60 * 60 * 1000 + Math.random() * 12 * 60 * 60 * 1000;
    const map = maps[Math.floor(Math.random() * maps.length)];
    const mode = modes[Math.floor(Math.random() * modes.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    const gearValue = Math.floor(Math.random() * 50000000) + 1000000;
    const ammoCost = Math.floor(Math.random() * 5000000) + 500000;
    const consumableCost = Math.floor(Math.random() * 2000000) + 100000;
    const investment = gearValue + ammoCost + consumableCost;

    const lootValue = status === 'EXTRACTED'
      ? Math.floor(Math.random() * 10000000) + investment
      : Math.floor(Math.random() * 500000);

    const netProfit = lootValue - investment;
    const roi = investment > 0 ? (netProfit / investment) * 100 : 0;

    const ammo = [
      {
        id: generateId(),
        caliber: '5.56x45mm',
        tier: 'T5',
        quantity: Math.floor(Math.random() * 500) + 50,
        costPerRound: 500,
        totalCost: Math.floor(Math.random() * 250000) + 25000,
      },
    ];

    const consumables = [
      {
        id: generateId(),
        name: 'IFAK',
        quantity: Math.floor(Math.random() * 5) + 1,
        costPerUnit: 3500,
        totalCost: Math.floor(Math.random() * 17500) + 3500,
        type: 'treatment' as const,
      },
    ];

    const gearRescue = status === 'DIED' ? {
      gearValue,
      rescuePercentage: Math.random() * 100,
      rescuedValue: Math.floor(Math.random() * gearValue),
      gearLoss: gearValue - Math.floor(Math.random() * gearValue),
    } : undefined;

    raids.push({
      id: `raid-${i + 1}`,
      timestamp,
      map,
      mode,
      status,
      duration: Math.floor(Math.random() * 3600) + 600,
      ammo,
      consumables,
      gearValue,
      gearRescue,
      loot: [],
      lootValue,
      kills: Math.floor(Math.random() * 10),
      deaths: status === 'DIED' ? 1 : 0,
      investment,
      netProfit,
      roi,
      isHighlight: i === 142 || i === 100 || i === 50,
      highlightReason: i === 142 ? 'Best raid today' : i === 100 ? 'High profit' : 'Notable',
      highlightCategory: 'profit',
      sessionId: `session-${Math.floor(i / 5)}`,
    });
  }

  return raids;
}

export function generateMockSessions(): Session[] {
  const sessions: Session[] = [];
  const baseTime = Date.now() - 30 * 24 * 60 * 60 * 1000;

  for (let i = 0; i < 29; i++) {
    const startTime = baseTime + i * 24 * 60 * 60 * 1000;
    const endTime = startTime + Math.random() * 4 * 60 * 60 * 1000;
    const raidCount = Math.floor(Math.random() * 10) + 1;
    const totalProfit = Math.floor(Math.random() * 50000000) - 10000000;
    const totalInvestment = Math.floor(Math.random() * 30000000) + 5000000;
    const totalLoot = totalProfit + totalInvestment;
    const extractionRate = Math.random() * 100;

    sessions.push({
      id: `session-${i}`,
      startTime,
      endTime,
      raidCount,
      totalProfit,
      totalInvestment,
      totalLoot,
      extractionRate,
    });
  }

  return sessions;
}

export function generateMockHighlights(): Highlight[] {
  return [
    {
      raidId: 'raid-143',
      timestamp: Date.now() - 1 * 24 * 60 * 60 * 1000,
      category: 'profit',
      reason: 'Best raid today',
      isFavorite: true,
    },
    {
      raidId: 'raid-100',
      timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000,
      category: 'profit',
      reason: 'High profit',
      isFavorite: false,
    },
  ];
}

// Format utilities
export function formatCurrency(value: number): string {
  if (value < 0) {
    return `-$${Math.abs(value).toLocaleString()}`;
  }
  return `$${value.toLocaleString()}`;
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatNumber(value: number): string {
  return value.toLocaleString();
}