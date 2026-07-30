import type { Raid, Session, Highlight, RaidMode, RaidStatus } from '../types';
import { generateId, getSessionId, saveRaids, saveSessions, saveHighlights } from './storage';

const DEMO_RAID_COUNT = 48;
const SESSION_DURATION_MINUTES = 60;

const DEMO_MAPS = ['TV Station', 'Farm', 'Valley', 'Northridge', 'Armory'] as const;
const DEMO_MODES: RaidMode[] = ['Normal', 'Lockdown', 'Forbidden'];
const DEMO_STATUSES: RaidStatus[] = ['EXTRACTED', 'DIED'];

const LOOT_NAMES = [
  'Graphics Card',
  'Motor',
  'Bolts',
  'Tetriz',
  'Rolex',
  'LEDX',
  'Golden Rooster',
  'Fuel Conditioner',
];

type DemoScenario = {
  map: (typeof DEMO_MAPS)[number];
  mode: RaidMode;
  status: RaidStatus;
  gearValue: number;
  ammoCost: number;
  consumableCost: number;
  lootValue: number;
  kills: number;
  durationMin: number;
  lootNames: string[];
  rescuePercentage?: number;
  highlight?: boolean;
  highlightReason?: string;
};

const SCENARIOS: DemoScenario[] = [
  {
    map: 'TV Station',
    mode: 'Forbidden',
    status: 'EXTRACTED',
    gearValue: 720_000,
    ammoCost: 48_000,
    consumableCost: 22_000,
    lootValue: 1_420_000,
    kills: 4,
    durationMin: 28,
    lootNames: ['Graphics Card', 'Motor'],
    highlight: true,
    highlightReason: 'Strong Forbidden extract on TV Station',
  },
  {
    map: 'Farm',
    mode: 'Lockdown',
    status: 'EXTRACTED',
    gearValue: 215_000,
    ammoCost: 12_000,
    consumableCost: 8_500,
    lootValue: 410_000,
    kills: 2,
    durationMin: 19,
    lootNames: ['Bolts', 'Fuel Conditioner'],
  },
  {
    map: 'Valley',
    mode: 'Normal',
    status: 'DIED',
    gearValue: 580_000,
    ammoCost: 35_000,
    consumableCost: 14_000,
    lootValue: 95_000,
    kills: 1,
    durationMin: 11,
    lootNames: ['Tetriz'],
    rescuePercentage: 72,
  },
  {
    map: 'Northridge',
    mode: 'Lockdown',
    status: 'EXTRACTED',
    gearValue: 890_000,
    ammoCost: 62_000,
    consumableCost: 18_000,
    lootValue: 1_960_000,
    kills: 6,
    durationMin: 34,
    lootNames: ['Rolex', 'LEDX'],
    highlight: true,
    highlightReason: 'High-value Northridge Lockdown run',
  },
  {
    map: 'Armory',
    mode: 'Forbidden',
    status: 'DIED',
    gearValue: 640_000,
    ammoCost: 195_000,
    consumableCost: 24_000,
    lootValue: 118_000,
    kills: 0,
    durationMin: 8,
    lootNames: [],
    rescuePercentage: 0,
  },
  {
    map: 'TV Station',
    mode: 'Lockdown',
    status: 'DIED',
    gearValue: 310_000,
    ammoCost: 18_000,
    consumableCost: 6_000,
    lootValue: 42_000,
    kills: 0,
    durationMin: 6,
    lootNames: [],
  },
];

function buildAmmo(totalCost: number) {
  const quantity = Math.max(10, Math.round(totalCost / 800));
  const costPerRound = Math.round(totalCost / quantity);
  return [
    {
      id: generateId(),
      caliber: '5.56x45',
      tier: 'T4',
      quantity,
      costPerRound,
      totalCost,
    },
  ];
}

function buildConsumables(totalCost: number) {
  const qty = 2;
  const costPerUnit = Math.round(totalCost / qty);
  return [
    {
      id: generateId(),
      name: 'IFAK',
      quantity: qty,
      costPerUnit,
      totalCost,
      type: 'treatment' as const,
    },
  ];
}

function buildLoot(names: string[], lootValue: number) {
  if (names.length === 0 || lootValue <= 0) return [];
  const share = Math.floor(lootValue / names.length);
  return names.map((name, index) => ({
    id: generateId(),
    name,
    baseValue: index === names.length - 1 ? lootValue - share * (names.length - 1) : share,
    quantity: 1,
    rarity: name === 'LEDX' || name === 'Rolex' ? ('rare' as const) : ('uncommon' as const),
  }));
}

function buildRaidFromScenario(scenario: DemoScenario, index: number, timestamp: number): Raid {
  let gearRescue: Raid['gearRescue'];
  let realizedGearLoss = 0;

  if (scenario.status === 'DIED') {
    const rescuePercentage = scenario.rescuePercentage ?? 0;
    const rescuedValue = Math.floor(scenario.gearValue * (rescuePercentage / 100));
    const gearLoss = scenario.gearValue - rescuedValue;
    realizedGearLoss = gearLoss;
    gearRescue = {
      gearValue: scenario.gearValue,
      rescuePercentage,
      rescuedValue,
      gearLoss,
    };
  }

  const adjustedInvestment = realizedGearLoss + scenario.ammoCost + scenario.consumableCost;
  const adjustedNetProfit = scenario.lootValue - adjustedInvestment;
  const adjustedRoi =
    adjustedInvestment > 0 ? (adjustedNetProfit / adjustedInvestment) * 100 : 0;

  return {
    id: `demo-raid-${String(index + 1).padStart(3, '0')}`,
    timestamp,
    map: scenario.map,
    mode: scenario.mode,
    status: scenario.status,
    duration: scenario.durationMin,
    ammo: buildAmmo(scenario.ammoCost),
    consumables: buildConsumables(scenario.consumableCost),
    gearValue: scenario.gearValue,
    gearRescue,
    loot: buildLoot(scenario.lootNames, scenario.lootValue),
    lootValue: scenario.lootValue,
    kills: scenario.kills,
    deaths: scenario.status === 'DIED' ? 1 : 0,
    investment: adjustedInvestment,
    netProfit: adjustedNetProfit,
    roi: adjustedRoi,
    isHighlight: scenario.highlight === true,
    highlightReason: scenario.highlightReason,
    highlightCategory: scenario.highlight ? 'profit' : undefined,
    sessionId: getSessionId(timestamp, SESSION_DURATION_MINUTES),
  };
}

function buildRandomScenario(index: number): DemoScenario {
  const map = DEMO_MAPS[index % DEMO_MAPS.length];
  const mode = DEMO_MODES[index % DEMO_MODES.length];
  const status = DEMO_STATUSES[index % DEMO_STATUSES.length];
  const gearValue = 180_000 + (index % 7) * 95_000;
  const ammoCost = 8_000 + (index % 5) * 11_000;
  const consumableCost = 4_000 + (index % 4) * 3_500;
  const investment = gearValue + ammoCost + consumableCost;
  const lootValue =
    status === 'EXTRACTED'
      ? investment + 50_000 + (index % 9) * 75_000
      : Math.floor(investment * (0.05 + (index % 3) * 0.04));

  return {
    map,
    mode,
    status,
    gearValue,
    ammoCost,
    consumableCost,
    lootValue,
    kills: status === 'EXTRACTED' ? (index % 6) + 1 : index % 3,
    durationMin: 8 + (index % 25),
    lootNames: status === 'EXTRACTED' ? [LOOT_NAMES[index % LOOT_NAMES.length]] : [],
    rescuePercentage: status === 'DIED' ? (index % 4) * 25 : undefined,
  };
}

/** Tactical demo raids for Raids page testing: filters, sort, and summary stats. */
export function generateMockRaids(count = DEMO_RAID_COUNT): Raid[] {
  const raids: Raid[] = [];
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const daysAgo = Math.floor(i / 3);
    const hourOffset = (i % 3) * 4;
    const timestamp = now - daysAgo * 24 * 60 * 60 * 1000 - hourOffset * 60 * 60 * 1000;
    const scenario = i < SCENARIOS.length ? SCENARIOS[i] : buildRandomScenario(i);
    raids.push(buildRaidFromScenario(scenario, i, timestamp));
  }

  return raids.sort((a, b) => b.timestamp - a.timestamp);
}

export function generateMockSessions(raids: Raid[]): Session[] {
  const bySession = new Map<string, Raid[]>();

  for (const raid of raids) {
    const group = bySession.get(raid.sessionId) ?? [];
    group.push(raid);
    bySession.set(raid.sessionId, group);
  }

  return Array.from(bySession.entries()).map(([id, sessionRaids]) => {
    const sorted = [...sessionRaids].sort((a, b) => a.timestamp - b.timestamp);
    const startTime = sorted[0].timestamp;
    const endTime = sorted[sorted.length - 1].timestamp + sorted[sorted.length - 1].duration * 60_000;
    const totalProfit = sorted.reduce((sum, raid) => sum + raid.netProfit, 0);
    const totalInvestment = sorted.reduce((sum, raid) => sum + raid.investment, 0);
    const totalLoot = sorted.reduce((sum, raid) => sum + raid.lootValue, 0);
    const extracted = sorted.filter((raid) => raid.status === 'EXTRACTED').length;

    return {
      id,
      startTime,
      endTime,
      raidCount: sorted.length,
      totalProfit,
      totalInvestment,
      totalLoot,
      extractionRate: sorted.length > 0 ? (extracted / sorted.length) * 100 : 0,
    };
  });
}

export function generateMockHighlights(raids: Raid[]): Highlight[] {
  const highlighted = raids.filter((raid) => raid.isHighlight);
  const fallback = [...raids]
    .sort((a, b) => b.netProfit - a.netProfit)
    .slice(0, 3);

  const source = highlighted.length > 0 ? highlighted : fallback;

  return source.map((raid, index) => ({
    raidId: raid.id,
    timestamp: raid.timestamp,
    category: raid.highlightCategory ?? (raid.kills >= 5 ? 'kills' : 'profit'),
    reason: raid.highlightReason ?? (index === 0 ? 'Top profit operation' : 'Notable field run'),
    isFavorite: index === 0,
  }));
}

export interface DemoDataSummary {
  raids: number;
  sessions: number;
  highlights: number;
}

/** Load demo raids + derived sessions/highlights into localStorage. */
export function loadDemoData(count = DEMO_RAID_COUNT): DemoDataSummary {
  const raids = generateMockRaids(count);
  const sessions = generateMockSessions(raids);
  const highlights = generateMockHighlights(raids);

  saveRaids(raids);
  saveSessions(sessions);
  saveHighlights(highlights);

  return {
    raids: raids.length,
    sessions: sessions.length,
    highlights: highlights.length,
  };
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
