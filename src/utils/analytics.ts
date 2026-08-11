import type {
  Raid,
  Session,
  AnalyticsCache,
  ProfitCurveData,
  SpendBreakdownData,
  SpendSegment,
  AmmoUsageData,
  AmmoUsageRow,
  ConsumableUsageData,
  ConsumableUsageRow,
  SessionSummary,
  FinancialIntelligenceData,
  PerformanceIntelligenceData,
  CombatIntelligenceData,
  MapPerformanceRow,
  ModePerformanceRow,
  PerformanceInsight,
  RiskAnalysisData,
  GearSummaryData,
  LoadoutCard,
  LoadoutUsageRow,
  LoadoutRoiComparison,
  GearIntelligenceData,
  LootDBRecord,
  LootIntelligenceData,
  LootSellAction,
  LootDBItem,
  Highlight,
  CommanderIntelligenceData,
  CommanderPlaystyle,
  CommanderCareerRecord,
  CommanderAchievement,
  CommanderMapRow,
  CommanderLoadoutRow,
  CareerTimelineEntry,
  CommanderStreaks,
  CommanderServiceRecord,
} from '../types';
import { getRaids, getHighlights, saveAnalyticsCache, getAnalyticsCache } from './storage';
import { formatCurrency, formatPercentage } from './mockData';
import { getLootSellRecommendation } from './economy';

// Analytics cache duration (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

const SPEND_SEGMENT_COLORS = {
  GEAR: '#FF5500',
  AMMO: '#FF2233',
  CONSUMABLES: '#00CC44',
} as const;

const DEFAULT_PROFIT_CURVE_BOUNDS = {
  minY: -20000000,
  maxY: 60000000,
  yAxisTicks: [-20000000, 0, 20000000, 40000000, 60000000],
};

function buildYAxisTicks(minY: number, maxY: number): number[] {
  if (minY === maxY) {
    const pad = Math.max(Math.abs(minY) * 0.2, 10000);
    return [minY - pad, minY, minY + pad];
  }

  const range = maxY - minY;
  return [0, 1, 2, 3, 4].map((step) => Math.round(minY + (range * step) / 4));
}

function sumAmmoSpend(raids: Raid[]): number {
  return raids.reduce(
    (sum, raid) => sum + raid.ammo.reduce((ammoSum, ammo) => ammoSum + ammo.totalCost, 0),
    0,
  );
}

function sumConsumableSpend(raids: Raid[]): number {
  return raids.reduce(
    (sum, raid) => sum + raid.consumables.reduce((consumableSum, consumable) => consumableSum + consumable.totalCost, 0),
    0,
  );
}

/**
 * Calculate cumulative profit curve across all raids.
 */
export function calculateProfitCurve(raids: Raid[] = getRaids()): ProfitCurveData {
  const sorted = [...raids].sort((a, b) => a.timestamp - b.timestamp);

  let cumulative = 0;
  const points = sorted.map((raid, index) => {
    cumulative += raid.netProfit;
    return {
      index,
      label: `R${index + 1}`,
      raidId: raid.id,
      map: raid.map,
      mode: raid.mode,
      status: raid.status,
      timestamp: raid.timestamp,
      netProfit: raid.netProfit,
      cumulative,
    };
  });
  const values = points.map((point) => point.cumulative);
  const labels = points.map((point) => point.label);

  if (values.length === 0) {
    return {
      values: [],
      labels: [],
      points: [],
      ...DEFAULT_PROFIT_CURVE_BOUNDS,
    };
  }

  const dataMin = Math.min(...values, 0);
  const dataMax = Math.max(...values, 0);
  const padding = Math.max((dataMax - dataMin) * 0.1, 1);
  const minY = dataMin - padding;
  const maxY = dataMax + padding;

  return {
    values,
    labels,
    points,
    minY,
    maxY,
    yAxisTicks: buildYAxisTicks(minY, maxY),
  };
}

/**
 * Calculate gear, ammo, and consumable spend segments for charts.
 */
export function calculateSpendBreakdown(raids: Raid[] = getRaids()): SpendBreakdownData {
  const ammoSpent = sumAmmoSpend(raids);
  const consumablesSpent = sumConsumableSpend(raids);
  const gearValue = raids.reduce((sum, raid) => {
    const ammoCost = raid.ammo.reduce((raidSum, ammo) => raidSum + ammo.totalCost, 0);
    const consumablesCost = raid.consumables.reduce(
      (raidSum, consumable) => raidSum + consumable.totalCost,
      0
    );
    return sum + Math.max(raid.investment - ammoCost - consumablesCost, 0);
  }, 0);

  const segments: SpendSegment[] = [
    { label: 'GEAR', value: gearValue, color: SPEND_SEGMENT_COLORS.GEAR },
    { label: 'AMMO', value: ammoSpent, color: SPEND_SEGMENT_COLORS.AMMO },
    { label: 'CONSUMABLES', value: consumablesSpent, color: SPEND_SEGMENT_COLORS.CONSUMABLES },
  ].filter((segment) => segment.value > 0);

  return {
    segments,
    total: segments.reduce((sum, segment) => sum + segment.value, 0),
  };
}

/**
 * Calculate top ammo usage rows for dashboard tables.
 */
export function calculateAmmoUsage(raids: Raid[] = getRaids(), limit = 6): AmmoUsageData {
  const ammoMap = new Map<string, AmmoUsageRow>();

  raids.forEach((raid) => {
    raid.ammo.forEach((ammo) => {
      const key = ammo.caliber;
      const existing = ammoMap.get(key);

      if (existing) {
        existing.rounds += ammo.quantity;
        existing.total += ammo.totalCost;
        existing.unit = Math.max(existing.unit, ammo.costPerRound);
        return;
      }

      ammoMap.set(key, {
        ammo: ammo.caliber,
        family: ammo.caliber,
        tier: ammo.tier,
        rounds: ammo.quantity,
        unit: ammo.costPerRound,
        total: ammo.totalCost,
      });
    });
  });

  const rows = Array.from(ammoMap.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);

  return {
    rows,
    totalSpend: rows.reduce((sum, row) => sum + row.total, 0),
  };
}

/**
 * Calculate top consumable usage rows for dashboard tables.
 */
export function calculateConsumableUsage(raids: Raid[] = getRaids(), limit = 6): ConsumableUsageData {
  const consumableMap = new Map<string, ConsumableUsageRow>();

  raids.forEach((raid) => {
    raid.consumables.forEach((consumable) => {
      const existing = consumableMap.get(consumable.name);

      if (existing) {
        existing.qty += consumable.quantity;
        existing.total += consumable.totalCost;
        existing.unit = Math.max(existing.unit, consumable.costPerUnit);
        return;
      }

      consumableMap.set(consumable.name, {
        item: consumable.name,
        subtype: consumable.type === 'treatment' ? 'Treatments' : 'Blast',
        qty: consumable.quantity,
        unit: consumable.costPerUnit,
        total: consumable.totalCost,
      });
    });
  });

  const rows = Array.from(consumableMap.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);

  return {
    rows,
    totalSpend: rows.reduce((sum, row) => sum + row.total, 0),
  };
}

/**
 * Calculate aggregated session summary metrics.
 */
export function calculateSessionSummary(raids: Raid[] = getRaids()): SessionSummary {
  const sessions = aggregateSessionsFromRaids(raids);
  const totalRaids = raids.length;
  const totalProfit = raids.reduce((sum, raid) => sum + raid.netProfit, 0);
  const totalInvestment = raids.reduce((sum, raid) => sum + raid.investment, 0);
  const averageExtractionRate = sessions.length > 0
    ? sessions.reduce((sum, session) => sum + session.extractionRate, 0) / sessions.length
    : 0;
  const bestSession = sessions.length > 0
    ? sessions.reduce((best, session) => (session.totalProfit > best.totalProfit ? session : best), sessions[0])
    : null;

  return {
    sessions,
    totalSessions: sessions.length,
    totalRaids,
    totalProfit,
    totalInvestment,
    averageExtractionRate,
    bestSession,
  };
}

function aggregateSessionsFromRaids(raids: Raid[]): Session[] {
  const sessionMap = new Map<string, Raid[]>();

  raids.forEach((raid) => {
    if (!sessionMap.has(raid.sessionId)) {
      sessionMap.set(raid.sessionId, []);
    }
    sessionMap.get(raid.sessionId)!.push(raid);
  });

  const sessions: Session[] = [];
  sessionMap.forEach((sessionRaids, sessionId) => {
    const stats = calculateSessionStats(sessionId, sessionRaids);
    if (stats) {
      sessions.push(stats);
    }
  });

  return sessions.sort((a, b) => b.startTime - a.startTime);
}

/**
 * Check if cache is still valid
 */
function isCacheValid(cache: AnalyticsCache | null): boolean {
  if (!cache) return false;
  return Date.now() - cache.lastUpdated < CACHE_DURATION;
}

/**
 * Calculate all dashboard analytics
 */
export function calculateDashboardAnalytics(raids: Raid[] = getRaids()): AnalyticsCache {
  const sessions = aggregateSessionsFromRaids(raids);
  const highlights = getHighlights();

  if (raids.length === 0) {
    return {
      lastUpdated: Date.now(),
      totalRaids: 0,
      extractionRate: 0,
      averageROI: 0,
      lifetimeProfit: 0,
      averageLootValue: 0,
      totalExtracted: 0,
      dryStreak: 0,
    };
  }

  // Total raids
  const totalRaids = raids.length;

  // Extraction rate
  const extractedRaids = raids.filter(r => r.status === 'EXTRACTED');
  const extractionRate = (extractedRaids.length / totalRaids) * 100;

  // Lifetime profit
  const lifetimeProfit = raids.reduce((sum, r) => sum + r.netProfit, 0);

  // Average ROI
  const raidsWithInvestment = raids.filter(r => r.investment > 0);
  const averageROI = raidsWithInvestment.length > 0
    ? raidsWithInvestment.reduce((sum, r) => sum + r.roi, 0) / raidsWithInvestment.length
    : 0;

  // Average loot value
  const averageLootValue = raids.reduce((sum, r) => sum + r.lootValue, 0) / totalRaids;

  // Total extracted
  const totalExtracted = extractedRaids.reduce((sum, r) => sum + r.lootValue, 0);

  // Dry streak (consecutive raids without extraction)
  let dryStreak = 0;
  for (let i = raids.length - 1; i >= 0; i--) {
    if (raids[i].status !== 'EXTRACTED') {
      dryStreak++;
    } else {
      break;
    }
  }

  // Best raid today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTimestamp = today.getTime();
  const todayRaids = raids.filter(r => r.timestamp >= todayTimestamp);
  const bestRaidToday = todayRaids.reduce<Raid | undefined>((best, raid) => {
    if (!best || raid.netProfit > best.netProfit) return raid;
    return best;
  }, undefined);

  // Latest highlight
  const sortedHighlights = [...highlights].sort((a, b) => b.timestamp - a.timestamp);
  const latestHighlight = sortedHighlights[0];

  // Best session
  const sessionProfits = sessions.map(s => ({
    session: s,
    totalProfit: s.totalProfit,
  })).sort((a, b) => b.totalProfit - a.totalProfit);
  const bestSession = sessionProfits[0]?.session;

  const cache: AnalyticsCache = {
    lastUpdated: Date.now(),
    totalRaids,
    extractionRate,
    averageROI,
    lifetimeProfit,
    averageLootValue,
    totalExtracted,
    dryStreak,
    bestRaidToday,
    latestHighlight,
    bestSession,
  };

  saveAnalyticsCache(cache);
  return cache;
}

/**
 * Get analytics with cache support
 */
export function getAnalytics(): AnalyticsCache {
  const cached = getAnalyticsCache();
  if (isCacheValid(cached)) {
    return cached!;
  }
  return calculateDashboardAnalytics();
}

/**
 * Calculate session statistics
 */
export function calculateSessionStats(sessionId: string, sourceRaids: Raid[] = getRaids()): Session | null {
  const raids = sourceRaids.filter(r => r.sessionId === sessionId);

  if (raids.length === 0) return null;

  const sortedRaids = [...raids].sort((a, b) => a.timestamp - b.timestamp);
  const startTime = sortedRaids[0].timestamp;
  const endTime = sortedRaids[sortedRaids.length - 1].timestamp;

  const totalInvestment = raids.reduce((sum, r) => sum + r.investment, 0);
  const totalLoot = raids.reduce((sum, r) => sum + r.lootValue, 0);
  const totalProfit = raids.reduce((sum, r) => sum + r.netProfit, 0);

  const extractedRaids = raids.filter(r => r.status === 'EXTRACTED');
  const extractionRate = (extractedRaids.length / raids.length) * 100;

  // Find best and worst raids
  const sortedByProfit = [...raids].sort((a, b) => b.netProfit - a.netProfit);
  const bestRaid = sortedByProfit[0]?.id;
  const worstRaid = sortedByProfit[sortedByProfit.length - 1]?.id;

  return {
    id: sessionId,
    startTime,
    endTime,
    raidCount: raids.length,
    totalProfit,
    totalInvestment,
    totalLoot,
    extractionRate,
    bestRaid,
    worstRaid,
  };
}

/**
 * Aggregate sessions from raids
 */
export function aggregateSessions(raids: Raid[] = getRaids()): Session[] {
  return aggregateSessionsFromRaids(raids);
}

/**
 * Calculate gear analytics
 */
export function calculateGearAnalytics(raids: Raid[] = getRaids()): GearSummaryData & {
  bestRescuePercentage: number;
  worstRescuePercentage: number;
} {
  const raidsWithGear = raids.filter(r => r.gearValue > 0);

  if (raidsWithGear.length === 0) {
    return {
      totalGearValueBrought: 0,
      totalGearValueLost: 0,
      totalGearValueRescued: 0,
      recoveryRate: 0,
      bestRescuePercentage: 0,
      worstRescuePercentage: 0,
      extractedCount: 0,
      kiaCount: 0,
    };
  }

  const totalGearValueBrought = raidsWithGear.reduce((sum, r) => sum + r.gearValue, 0);

  const diedRaids = raidsWithGear.filter(r => r.status === 'DIED');
  const extractedRaids = raidsWithGear.filter(r => r.status === 'EXTRACTED');
  const totalGearValueLost = diedRaids.reduce((sum, r) => {
    if (r.gearRescue) {
      return sum + r.gearRescue.gearLoss;
    }
    return sum + r.gearValue;
  }, 0);

  const totalGearValueRescued = diedRaids.reduce((sum, r) => {
    if (r.gearRescue) {
      return sum + r.gearRescue.rescuedValue;
    }
    return sum;
  }, 0);

  const gearAtRisk = diedRaids.reduce((sum, r) => sum + r.gearValue, 0);
  const recoveryRate = gearAtRisk > 0 ? (totalGearValueRescued / gearAtRisk) * 100 : 0;

  const rescuePercentages = diedRaids
    .filter(r => r.gearRescue)
    .map(r => r.gearRescue!.rescuePercentage);

  const bestRescuePercentage = rescuePercentages.length > 0 ? Math.max(...rescuePercentages) : 0;
  const worstRescuePercentage = rescuePercentages.length > 0 ? Math.min(...rescuePercentages) : 0;

  return {
    totalGearValueBrought,
    totalGearValueLost,
    totalGearValueRescued,
    recoveryRate,
    bestRescuePercentage,
    worstRescuePercentage,
    extractedCount: extractedRaids.length,
    kiaCount: diedRaids.length,
  };
}

/**
 * Calculate economy breakdown
 */
export function calculateEconomyBreakdown(): {
  ammoSpent: number;
  consumablesSpent: number;
  gearLost: number;
  totalSpend: number;
  byMap: Record<string, { raids: number; profit: number; investment: number }>;
  byMode: Record<string, { raids: number; profit: number; investment: number }>;
} {
  const raids = getRaids();

  const ammoSpent = sumAmmoSpend(raids);

  const consumablesSpent = sumConsumableSpend(raids);

  const gearLost = raids.reduce((sum, r) => {
    if (r.status === 'DIED' && r.gearRescue) {
      return sum + r.gearRescue.gearLoss;
    } else if (r.status === 'DIED') {
      return sum + r.gearValue;
    }
    return sum;
  }, 0);

  const totalSpend = ammoSpent + consumablesSpent + gearLost;

  const byMap: Record<string, { raids: number; profit: number; investment: number }> = {};
  const byMode: Record<string, { raids: number; profit: number; investment: number }> = {};

  raids.forEach(raid => {
    // By map
    if (!byMap[raid.map]) {
      byMap[raid.map] = { raids: 0, profit: 0, investment: 0 };
    }
    byMap[raid.map].raids++;
    byMap[raid.map].profit += raid.netProfit;
    byMap[raid.map].investment += raid.investment;

    // By mode
    if (!byMode[raid.mode]) {
      byMode[raid.mode] = { raids: 0, profit: 0, investment: 0 };
    }
    byMode[raid.mode].raids++;
    byMode[raid.mode].profit += raid.netProfit;
    byMode[raid.mode].investment += raid.investment;
  });

  return { ammoSpent, consumablesSpent, gearLost, totalSpend, byMap, byMode };
}

/**
 * Calculate performance over time
 */
export function calculatePerformanceTimeline(days: number = 30): {
  date: string;
  raids: number;
  profit: number;
  extractionRate: number;
}[] {
  const raids = getRaids();
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const startTime = now - (days * dayMs);

  const timeline: Record<string, { raids: Raid[] }> = {};

  // Initialize all days
  for (let i = 0; i <= days; i++) {
    const date = new Date(startTime + i * dayMs).toISOString().split('T')[0];
    timeline[date] = { raids: [] };
  }

  // Group raids by date
  raids
    .filter(r => r.timestamp >= startTime)
    .forEach(raid => {
      const date = new Date(raid.timestamp).toISOString().split('T')[0];
      if (timeline[date]) {
        timeline[date].raids.push(raid);
      }
    });

  // Calculate stats for each day
  return Object.entries(timeline).map(([date, data]) => {
    const profit = data.raids.reduce((sum, r) => sum + r.netProfit, 0);
    const extracted = data.raids.filter(r => r.status === 'EXTRACTED').length;
    const extractionRate = data.raids.length > 0
      ? (extracted / data.raids.length) * 100
      : 0;

    return {
      date,
      raids: data.raids.length,
      profit,
      extractionRate,
    };
  }).sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Financial intelligence aggregates for a set of raids.
 * Pure and deterministic; callers pass an already range-filtered raid list.
 */
export function calculateFinancialIntelligence(raids: Raid[]): FinancialIntelligenceData {
  if (raids.length === 0) {
    return {
      totalLoot: 0,
      totalInvestment: 0,
      netProfit: 0,
      profitMargin: 0,
      averageNetPerRaid: 0,
      averageROI: 0,
      medianROI: 0,
      profitableShare: 0,
      bestRaid: null,
      worstRaid: null,
    };
  }

  const totalLoot = raids.reduce((sum, r) => sum + r.lootValue, 0);
  const totalInvestment = raids.reduce((sum, r) => sum + r.investment, 0);
  const netProfit = totalLoot - totalInvestment;

  const sortedROI = raids.map(r => r.roi).sort((a, b) => a - b);
  const mid = Math.floor(sortedROI.length / 2);
  const medianROI = sortedROI.length % 2 === 0
    ? (sortedROI[mid - 1] + sortedROI[mid]) / 2
    : sortedROI[mid];

  const byNet = [...raids].sort((a, b) => b.netProfit - a.netProfit);

  return {
    totalLoot,
    totalInvestment,
    netProfit,
    profitMargin: totalLoot > 0 ? (netProfit / totalLoot) * 100 : 0,
    averageNetPerRaid: netProfit / raids.length,
    averageROI: raids.reduce((sum, r) => sum + r.roi, 0) / raids.length,
    medianROI,
    profitableShare: (raids.filter(r => r.netProfit > 0).length / raids.length) * 100,
    bestRaid: byNet[0],
    worstRaid: byNet[byNet.length - 1],
  };
}

const PERF_MIN_MAP_SAMPLE = 3;
const PERF_MIN_MODE_SAMPLE = 2;
const PERF_RECENT_WINDOW = 10;
const STRENGTH_EXTRACT_THRESHOLD = 60;
const WEAKNESS_EXTRACT_THRESHOLD = 40;
const WEAKNESS_DEATH_RATE_THRESHOLD = 50;
const DRY_STREAK_WEAKNESS_THRESHOLD = 3;

function perfExtractionRate(raids: Raid[]): number {
  if (raids.length === 0) return 0;
  return (raids.filter(r => r.status === 'EXTRACTED').length / raids.length) * 100;
}

function resolveBestModeForMap(mapRaids: Raid[]): string | null {
  if (mapRaids.length === 0) return null;
  const byMode = new Map<string, { raids: number; totalNet: number }>();
  for (const raid of mapRaids) {
    const entry = byMode.get(raid.mode) ?? { raids: 0, totalNet: 0 };
    entry.raids += 1;
    entry.totalNet += raid.netProfit;
    byMode.set(raid.mode, entry);
  }
  const qualified = Array.from(byMode.entries())
    .filter(([, stats]) => stats.raids >= PERF_MIN_MODE_SAMPLE)
    .map(([mode, stats]) => ({ mode, averageNet: stats.totalNet / stats.raids }));
  if (qualified.length > 0) {
    return [...qualified].sort((a, b) => b.averageNet - a.averageNet)[0].mode;
  }
  return [...mapRaids].sort((a, b) => b.netProfit - a.netProfit)[0].mode;
}

function buildMapPerformanceRows(raids: Raid[]): MapPerformanceRow[] {
  const byMap = new Map<string, Raid[]>();
  for (const raid of raids) {
    const list = byMap.get(raid.map) ?? [];
    list.push(raid);
    byMap.set(raid.map, list);
  }
  return Array.from(byMap.entries())
    .map(([map, mapRaids]) => {
      const extracted = mapRaids.filter(r => r.status === 'EXTRACTED').length;
      const totalNet = mapRaids.reduce((sum, r) => sum + r.netProfit, 0);
      return {
        map,
        raids: mapRaids.length,
        extractionRate: (extracted / mapRaids.length) * 100,
        averageProfit: totalNet / mapRaids.length,
        averageROI: mapRaids.reduce((sum, r) => sum + r.roi, 0) / mapRaids.length,
        totalNet,
        bestMode: resolveBestModeForMap(mapRaids),
      };
    })
    .sort((a, b) => b.totalNet - a.totalNet);
}

function buildModePerformanceRows(raids: Raid[]): ModePerformanceRow[] {
  const byMode = new Map<string, Raid[]>();
  for (const raid of raids) {
    const list = byMode.get(raid.mode) ?? [];
    list.push(raid);
    byMode.set(raid.mode, list);
  }
  return Array.from(byMode.entries())
    .map(([mode, modeRaids]) => {
      const extracted = modeRaids.filter(r => r.status === 'EXTRACTED').length;
      const totalNet = modeRaids.reduce((sum, r) => sum + r.netProfit, 0);
      return {
        mode,
        raids: modeRaids.length,
        extractionRate: (extracted / modeRaids.length) * 100,
        averageProfit: totalNet / modeRaids.length,
        averageROI: modeRaids.reduce((sum, r) => sum + r.roi, 0) / modeRaids.length,
        averageAmmo: modeRaids.reduce(
          (sum, r) => sum + r.ammo.reduce((aSum, a) => aSum + a.totalCost, 0),
          0
        ) / modeRaids.length,
        averageConsumables: modeRaids.reduce(
          (sum, r) => sum + r.consumables.reduce((cSum, c) => cSum + c.totalCost, 0),
          0
        ) / modeRaids.length,
        totalNet,
      };
    })
    .sort((a, b) => b.totalNet - a.totalNet);
}

function buildPerformanceInsights(
  raids: Raid[],
  maps: MapPerformanceRow[],
  modes: ModePerformanceRow[],
  extractionRate: number,
  deathRate: number,
  dryStreak: number,
  extractionTrendDelta: number
): { strengths: PerformanceInsight[]; weaknesses: PerformanceInsight[] } {
  const strengths: PerformanceInsight[] = [];
  const weaknesses: PerformanceInsight[] = [];

  const qualifiedMaps = maps.filter(m => m.raids >= PERF_MIN_MAP_SAMPLE);
  const bestMap = qualifiedMaps.length > 0
    ? [...qualifiedMaps].sort((a, b) => b.averageProfit - a.averageProfit)[0]
    : null;
  if (bestMap && bestMap.averageProfit > 0) {
    strengths.push({
      id: 'best-map-profit',
      type: 'strength',
      label: `${bestMap.map} leads profitability`,
      evidence: `${formatCurrency(bestMap.averageProfit)} average net across ${bestMap.raids} operations`,
    });
  }

  const worstMap = qualifiedMaps.length > 0
    ? [...qualifiedMaps].sort((a, b) => a.averageProfit - b.averageProfit)[0]
    : null;
  if (worstMap && worstMap.averageProfit < 0) {
    weaknesses.push({
      id: 'worst-map-profit',
      type: 'weakness',
      label: `${worstMap.map} is underperforming`,
      evidence: `${formatCurrency(worstMap.averageProfit)} average net across ${worstMap.raids} operations`,
    });
  }

  const qualifiedModes = modes.filter(m => m.raids >= PERF_MIN_MAP_SAMPLE);
  const bestMode = qualifiedModes.length > 0
    ? [...qualifiedModes].sort((a, b) => b.averageProfit - a.averageProfit)[0]
    : null;
  if (bestMode && bestMode.averageProfit > 0) {
    strengths.push({
      id: 'best-mode-profit',
      type: 'strength',
      label: `${bestMode.mode} mode is your strongest`,
      evidence: `${formatCurrency(bestMode.averageProfit)} average net at ${formatPercentage(bestMode.extractionRate)} extract`,
    });
  }

  if (raids.length >= 5 && extractionRate >= STRENGTH_EXTRACT_THRESHOLD) {
    strengths.push({
      id: 'high-extraction',
      type: 'strength',
      label: 'Extraction rate is solid',
      evidence: `${formatPercentage(extractionRate)} across ${raids.length} operations`,
    });
  }

  if (raids.length >= 5 && extractionRate < WEAKNESS_EXTRACT_THRESHOLD) {
    weaknesses.push({
      id: 'low-extraction',
      type: 'weakness',
      label: 'Extraction rate needs recovery',
      evidence: `${formatPercentage(extractionRate)} across ${raids.length} operations`,
    });
  }

  if (extractionTrendDelta >= 15) {
    strengths.push({
      id: 'extraction-trend-up',
      type: 'strength',
      label: 'Recent extraction trend is improving',
      evidence: `Last ${Math.min(PERF_RECENT_WINDOW, raids.length)} ops up ${extractionTrendDelta.toFixed(0)} points vs prior window`,
    });
  } else if (extractionTrendDelta <= -15) {
    weaknesses.push({
      id: 'extraction-trend-down',
      type: 'weakness',
      label: 'Recent extraction trend is declining',
      evidence: `Last ${Math.min(PERF_RECENT_WINDOW, raids.length)} ops down ${Math.abs(extractionTrendDelta).toFixed(0)} points vs prior window`,
    });
  }

  if (deathRate >= WEAKNESS_DEATH_RATE_THRESHOLD && raids.length >= 5) {
    weaknesses.push({
      id: 'high-death-rate',
      type: 'weakness',
      label: 'Death rate is elevated',
      evidence: `${formatPercentage(deathRate)} of operations end in KIA`,
    });
  }

  if (dryStreak >= DRY_STREAK_WEAKNESS_THRESHOLD) {
    weaknesses.push({
      id: 'dry-streak',
      type: 'weakness',
      label: `${dryStreak} consecutive operations without extract`,
      evidence: 'Current streak is eroding survival momentum',
    });
  }

  return {
    strengths: strengths.slice(0, 4),
    weaknesses: weaknesses.slice(0, 4),
  };
}

/**
 * Performance intelligence aggregates for combat, map/mode analysis, risk, and insights.
 * Pure and deterministic; callers pass the full raid history.
 */
export function calculatePerformanceIntelligence(raids: Raid[]): PerformanceIntelligenceData {
  const empty: PerformanceIntelligenceData = {
    combat: {
      totalOperations: 0,
      totalKills: 0,
      averageKills: 0,
      totalDeaths: 0,
      extractionRate: 0,
      deathRate: 0,
      killsPerExtract: 0,
      averageNetPerRaid: 0,
    },
    maps: [],
    modes: [],
    strengths: [],
    weaknesses: [],
    risk: {
      currentDryStreak: 0,
      deathRate: 0,
      recentExtractionRate: 0,
      priorExtractionRate: 0,
      extractionTrendDelta: 0,
      highestRiskMap: null,
      highestRiskMapExtractRate: 0,
    },
    profitTrend: [],
    roiTrend: [],
  };

  if (raids.length === 0) return empty;

  const sorted = [...raids].sort((a, b) => a.timestamp - b.timestamp);
  const extracted = raids.filter(r => r.status === 'EXTRACTED');
  const died = raids.filter(r => r.status === 'DIED');
  const totalKills = raids.reduce((sum, r) => sum + r.kills, 0);
  const totalDeaths = raids.reduce((sum, r) => sum + r.deaths, 0);
  const extractionRate = perfExtractionRate(raids);
  const deathRate = (died.length / raids.length) * 100;

  let dryStreak = 0;
  for (let i = sorted.length - 1; i >= 0; i -= 1) {
    if (sorted[i].status === 'EXTRACTED') break;
    dryStreak += 1;
  }

  const recent = sorted.slice(-PERF_RECENT_WINDOW);
  const prior = sorted.slice(0, -PERF_RECENT_WINDOW);
  const recentExtractionRate = perfExtractionRate(recent);
  const priorExtractionRate = prior.length > 0 ? perfExtractionRate(prior) : recentExtractionRate;
  const extractionTrendDelta = recentExtractionRate - priorExtractionRate;

  const maps = buildMapPerformanceRows(raids);
  const modes = buildModePerformanceRows(raids);

  const qualifiedMaps = maps.filter(m => m.raids >= PERF_MIN_MAP_SAMPLE);
  const highestRisk = qualifiedMaps.length > 0
    ? [...qualifiedMaps].sort((a, b) => a.extractionRate - b.extractionRate)[0]
    : null;

  const { strengths, weaknesses } = buildPerformanceInsights(
    raids,
    maps,
    modes,
    extractionRate,
    deathRate,
    dryStreak,
    extractionTrendDelta
  );

  return {
    combat: {
      totalOperations: raids.length,
      totalKills,
      averageKills: totalKills / raids.length,
      totalDeaths,
      extractionRate,
      deathRate,
      killsPerExtract: extracted.length > 0 ? totalKills / extracted.length : 0,
      averageNetPerRaid: raids.reduce((sum, r) => sum + r.netProfit, 0) / raids.length,
    },
    maps,
    modes,
    strengths,
    weaknesses,
    risk: {
      currentDryStreak: dryStreak,
      deathRate,
      recentExtractionRate,
      priorExtractionRate,
      extractionTrendDelta,
      highestRiskMap: highestRisk?.map ?? null,
      highestRiskMapExtractRate: highestRisk?.extractionRate ?? 0,
    },
    profitTrend: sorted.map(r => r.netProfit),
    roiTrend: sorted.map(r => r.roi),
  };
}

const LOADOUT_TIERS = [
  { id: 'light', label: 'Light (<1M)', min: 1, max: 999_999 },
  { id: 'standard', label: 'Standard (1M–5M)', min: 1_000_000, max: 4_999_999 },
  { id: 'heavy', label: 'Heavy (5M–20M)', min: 5_000_000, max: 19_999_999 },
  { id: 'elite', label: 'Elite (20M+)', min: 20_000_000, max: Infinity },
] as const;

function resolveLoadoutTier(gearValue: number): typeof LOADOUT_TIERS[number] | null {
  if (gearValue <= 0) return null;
  return LOADOUT_TIERS.find(t => gearValue >= t.min && gearValue <= t.max) ?? LOADOUT_TIERS[LOADOUT_TIERS.length - 1];
}

function buildLoadoutTrendDelta(tierRaids: Raid[]): number {
  const sorted = [...tierRaids].sort((a, b) => a.timestamp - b.timestamp);
  if (sorted.length < 4) return 0;
  const mid = Math.floor(sorted.length / 2);
  const prior = sorted.slice(0, mid);
  const recent = sorted.slice(mid);
  const priorAvg = prior.reduce((sum, r) => sum + r.netProfit, 0) / prior.length;
  const recentAvg = recent.reduce((sum, r) => sum + r.netProfit, 0) / recent.length;
  return recentAvg - priorAvg;
}

function buildLoadoutCards(raids: Raid[]): LoadoutCard[] {
  const withGear = raids.filter(r => r.gearValue > 0);
  const byTier = new Map<string, Raid[]>();

  for (const raid of withGear) {
    const tier = resolveLoadoutTier(raid.gearValue);
    if (!tier) continue;
    const list = byTier.get(tier.id) ?? [];
    list.push(raid);
    byTier.set(tier.id, list);
  }

  return LOADOUT_TIERS
    .filter(tier => (byTier.get(tier.id)?.length ?? 0) > 0)
    .map(tier => {
      const tierRaids = byTier.get(tier.id)!;
      const extracted = tierRaids.filter(r => r.status === 'EXTRACTED').length;
      const totalNet = tierRaids.reduce((sum, r) => sum + r.netProfit, 0);
      const totalInvestment = tierRaids.reduce((sum, r) => sum + r.investment, 0);

      const mapCounts = new Map<string, number>();
      for (const raid of tierRaids) {
        mapCounts.set(raid.map, (mapCounts.get(raid.map) ?? 0) + 1);
      }
      const topMap = [...mapCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

      return {
        id: tier.id,
        label: tier.label,
        usage: tierRaids.length,
        averageInvestment: totalInvestment / tierRaids.length,
        averageProfit: totalNet / tierRaids.length,
        averageROI: tierRaids.reduce((sum, r) => sum + r.roi, 0) / tierRaids.length,
        extractionRate: (extracted / tierRaids.length) * 100,
        totalNet,
        topMap,
        trendDelta: buildLoadoutTrendDelta(tierRaids),
      };
    })
    .sort((a, b) => b.usage - a.usage);
}

/**
 * Gear intelligence: loadout tiers, ROI comparison, usage and performance history.
 */
export function calculateGearIntelligence(raids: Raid[]): GearIntelligenceData {
  const summary = calculateGearAnalytics(raids);
  const loadouts = buildLoadoutCards(raids);

  const roiComparison: LoadoutRoiComparison[] = loadouts.map(l => ({
    id: l.id,
    label: l.label,
    averageROI: l.averageROI,
    usage: l.usage,
  }));

  const gearRaids = [...raids]
    .filter(r => r.gearValue > 0)
    .sort((a, b) => a.timestamp - b.timestamp);

  const usageHistory: LoadoutUsageRow[] = [...gearRaids]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 15)
    .map(r => ({
      raidId: r.id,
      timestamp: r.timestamp,
      map: r.map,
      mode: r.mode,
      gearValue: r.gearValue,
      investment: r.investment,
      netProfit: r.netProfit,
      roi: r.roi,
      status: r.status,
    }));

  let cumulative = 0;
  const performanceHistory = gearRaids.map(r => {
    cumulative += r.netProfit;
    return cumulative;
  });

  return {
    summary,
    loadouts,
    roiComparison,
    usageHistory,
    performanceHistory,
  };
}

function buildLootFoundStats(raids: Raid[]): Map<string, { count: number; earnings: number }> {
  const stats = new Map<string, { count: number; earnings: number }>();

  for (const raid of raids) {
    if (!raid.loot?.length) continue;
    for (const loot of raid.loot) {
      const key = loot.name.toLowerCase().trim();
      const entry = stats.get(key) ?? { count: 0, earnings: 0 };
      entry.count += loot.quantity;
      entry.earnings += loot.baseValue * loot.quantity;
      stats.set(key, entry);
    }
  }

  return stats;
}

/**
 * Loot intelligence: cross-reference catalog with raid loot history and sell actions.
 */
export function calculateLootIntelligence(
  items: LootDBItem[],
  raids: Raid[],
  taxRate: number = 0.10
): LootIntelligenceData {
  const foundStats = buildLootFoundStats(raids);

  const records: LootDBRecord[] = items.map(item => {
    const found = foundStats.get(item.name.toLowerCase().trim()) ?? { count: 0, earnings: 0 };
    const recommendation = getLootSellRecommendation(item, taxRate);

    return {
      ...item,
      foundCount: found.count,
      totalEarnings: found.earnings,
      marketNet: recommendation.marketNet,
      bestVendorPrice: recommendation.bestVendorPrice,
      bestVendorName: recommendation.bestVendorName,
      action: recommendation.action,
    };
  });

  const byRarity: Record<string, number> = {};
  for (const item of items) {
    byRarity[item.rarity] = (byRarity[item.rarity] ?? 0) + 1;
  }

  return {
    summary: {
      totalItems: items.length,
      catalogMarketValue: items.reduce((sum, item) => sum + item.marketPrice, 0),
      totalFoundCount: records.reduce((sum, record) => sum + record.foundCount, 0),
      trackedInRaids: records.filter(record => record.foundCount > 0).length,
      sellToMarket: records.filter(record => record.action === 'market').length,
      sellToVendor: records.filter(record => record.action === 'vendor').length,
      needsData: records.filter(record => record.action === 'hold').length,
      byRarity,
    },
    records,
  };
}

const COMMANDER_MIN_HISTORY = 5;
const COMMANDER_PLAYSTYLE_HISTORY = 20;

const PRESTIGE_TIERS = [
  { minRaids: 1000, level: 10, title: 'Legend' },
  { minRaids: 500, level: 9, title: 'Master' },
  { minRaids: 250, level: 8, title: 'Expert' },
  { minRaids: 100, level: 7, title: 'Veteran' },
  { minRaids: 75, level: 6, title: 'Seasoned' },
  { minRaids: 50, level: 5, title: 'Skilled' },
  { minRaids: 25, level: 4, title: 'Trained' },
  { minRaids: 10, level: 3, title: 'Rookie' },
  { minRaids: 5, level: 2, title: 'Beginner' },
  { minRaids: 1, level: 1, title: 'Recruit' },
] as const;

function resolvePrestige(raidCount: number): { level: number; title: string } {
  const tier = PRESTIGE_TIERS.find(entry => raidCount >= entry.minRaids);
  return tier ?? { level: 0, title: 'Unknown' };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function calculateCommanderStreaks(sortedDesc: Raid[]): CommanderStreaks {
  let currentExtraction = 0;
  for (const raid of sortedDesc) {
    if (raid.status === 'EXTRACTED') currentExtraction += 1;
    else break;
  }

  let currentProfit = 0;
  for (const raid of sortedDesc) {
    if (raid.netProfit > 0) currentProfit += 1;
    else break;
  }

  let currentDry = 0;
  for (const raid of sortedDesc) {
    if (raid.status !== 'EXTRACTED') currentDry += 1;
    else break;
  }

  const asc = [...sortedDesc].reverse();
  let longestExtraction = 0;
  let extractionRun = 0;
  let longestProfit = 0;
  let profitRun = 0;

  for (const raid of asc) {
    if (raid.status === 'EXTRACTED') {
      extractionRun += 1;
      longestExtraction = Math.max(longestExtraction, extractionRun);
    } else {
      extractionRun = 0;
    }

    if (raid.netProfit > 0) {
      profitRun += 1;
      longestProfit = Math.max(longestProfit, profitRun);
    } else {
      profitRun = 0;
    }
  }

  return {
    currentExtraction,
    longestExtraction,
    currentProfit,
    longestProfit,
    currentDry,
  };
}

function calculateTacticalScore(raids: Raid[]): number {
  if (raids.length < COMMANDER_MIN_HISTORY) return 0;

  const extractionRate = perfExtractionRate(raids);
  const investedRaids = raids.filter(raid => raid.investment > 0);
  const averageROI = investedRaids.length > 0
    ? investedRaids.reduce((sum, raid) => sum + raid.roi, 0) / investedRaids.length
    : 0;
  const profitableRate = (raids.filter(raid => raid.netProfit > 0).length / raids.length) * 100;
  const roiNorm = clamp(((averageROI + 50) / 250) * 100, 0, 100);

  const recent = [...raids].sort((a, b) => a.timestamp - b.timestamp).slice(-20);
  const profits = recent.map(raid => raid.netProfit);
  const mean = profits.reduce((sum, value) => sum + value, 0) / profits.length;
  const variance = profits.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / profits.length;
  const stdDev = Math.sqrt(variance);
  const consistencyNorm = mean !== 0
    ? clamp(100 - (stdDev / Math.abs(mean)) * 50, 0, 100)
    : 50;

  const averageInvestment = raids.reduce((sum, raid) => sum + raid.investment, 0) / raids.length;
  const averageNet = raids.reduce((sum, raid) => sum + raid.netProfit, 0) / raids.length;
  const efficiencyNorm = averageInvestment > 0
    ? clamp((averageNet / averageInvestment + 0.5) * 50, 0, 100)
    : 0;

  return Math.round(
    extractionRate * 0.25 +
    roiNorm * 0.25 +
    profitableRate * 0.20 +
    consistencyNorm * 0.15 +
    efficiencyNorm * 0.15
  );
}

function classifyCommanderPlaystyle(raids: Raid[]): {
  playstyle: CommanderPlaystyle | null;
  confidence: 'low' | 'medium' | 'high';
} {
  if (raids.length < COMMANDER_MIN_HISTORY) {
    return { playstyle: null, confidence: 'low' };
  }

  const extractionRate = perfExtractionRate(raids);
  const averageKills = raids.reduce((sum, raid) => sum + raid.kills, 0) / raids.length;
  const averageGear = raids.reduce((sum, raid) => sum + raid.gearValue, 0) / raids.length;
  const investedRaids = raids.filter(raid => raid.investment > 0);
  const averageROI = investedRaids.length > 0
    ? investedRaids.reduce((sum, raid) => sum + raid.roi, 0) / investedRaids.length
    : 0;
  const lootRatios = investedRaids.map(raid => raid.lootValue / raid.investment);
  const averageLootRatio = lootRatios.length > 0
    ? lootRatios.reduce((sum, value) => sum + value, 0) / lootRatios.length
    : 0;
  const deathRate = (raids.filter(raid => raid.status === 'DIED').length / raids.length) * 100;

  const scores: Record<CommanderPlaystyle, number> = {
    'Economic Farmer': 0,
    'Aggressive Raider': 0,
    'Balanced Operator': 35,
    'Loot Hunter': 0,
    'High Risk Commander': 0,
    'Survival Specialist': 0,
  };

  if (extractionRate >= 55 && averageROI > 0) scores['Economic Farmer'] += 30;
  if (averageKills < 2) scores['Economic Farmer'] += 20;
  if (averageROI > 10) scores['Economic Farmer'] += 10;

  if (averageKills >= 3) scores['Aggressive Raider'] += averageKills * 8;
  if (deathRate > 40) scores['Aggressive Raider'] += 15;
  if (averageKills >= 5) scores['Aggressive Raider'] += 10;

  if (averageLootRatio >= 1.5) scores['Loot Hunter'] += 35;
  if (averageLootRatio >= 2) scores['Loot Hunter'] += 20;

  if (averageGear >= 5_000_000) scores['High Risk Commander'] += 30;
  if (extractionRate < 45) scores['High Risk Commander'] += 20;
  if (averageGear >= 20_000_000) scores['High Risk Commander'] += 25;

  if (extractionRate >= 65) scores['Survival Specialist'] += 35;
  if (deathRate < 25) scores['Survival Specialist'] += 25;

  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]) as [CommanderPlaystyle, number][];
  const [topPlaystyle, topScore] = ranked[0];
  const [, secondScore] = ranked[1];
  const margin = topScore - secondScore;

  const confidence = raids.length >= 50 && margin >= 20
    ? 'high'
    : raids.length >= COMMANDER_PLAYSTYLE_HISTORY
      ? 'medium'
      : 'low';

  if (topPlaystyle === 'Balanced Operator' || margin < 10) {
    return { playstyle: 'Balanced Operator', confidence };
  }

  return { playstyle: topPlaystyle, confidence };
}

function buildCommanderMapRows(raids: Raid[]): CommanderMapRow[] {
  return buildMapPerformanceRows(raids).map(row => ({
    map: row.map,
    raids: row.raids,
    extractionRate: row.extractionRate,
    totalProfit: row.totalNet,
    averageROI: row.averageROI,
  }));
}

function buildCommanderLoadoutRows(raids: Raid[]): CommanderLoadoutRow[] {
  const byTier = new Map<string, Raid[]>();
  for (const raid of raids) {
    const tier = resolveLoadoutTier(raid.gearValue);
    if (!tier) continue;
    const list = byTier.get(tier.id) ?? [];
    list.push(raid);
    byTier.set(tier.id, list);
  }

  return LOADOUT_TIERS
    .filter(tier => (byTier.get(tier.id)?.length ?? 0) > 0)
    .map(tier => {
      const tierRaids = byTier.get(tier.id)!;
      const extracted = tierRaids.filter(raid => raid.status === 'EXTRACTED').length;
      const totalNet = tierRaids.reduce((sum, raid) => sum + raid.netProfit, 0);
      return {
        id: tier.id,
        label: tier.label,
        raids: tierRaids.length,
        extractionRate: (extracted / tierRaids.length) * 100,
        averageProfit: totalNet / tierRaids.length,
      };
    })
    .sort((a, b) => b.raids - a.raids);
}

function buildCommanderRecords(raids: Raid[]): CommanderCareerRecord[] {
  if (raids.length === 0) return [];

  const bestProfit = raids.reduce((best, raid) => (raid.netProfit > best.netProfit ? raid : best), raids[0]);
  const worstProfit = raids.reduce((worst, raid) => (raid.netProfit < worst.netProfit ? raid : worst), raids[0]);
  const mostKills = raids.reduce((best, raid) => (raid.kills > best.kills ? raid : best), raids[0]);
  const longestRaid = raids.reduce((longest, raid) => (raid.duration > longest.duration ? raid : longest), raids[0]);
  const bestROI = raids.reduce((best, raid) => (raid.roi > best.roi ? raid : best), raids[0]);
  const highestLoot = raids.reduce((best, raid) => (raid.lootValue > best.lootValue ? raid : best), raids[0]);

  return [
    {
      label: 'Best profit',
      value: `+$${formatCurrency(bestProfit.netProfit)}`,
      subValue: bestProfit.map,
      raidId: bestProfit.id,
      timestamp: bestProfit.timestamp,
    },
    {
      label: 'Worst profit',
      value: `$${formatCurrency(worstProfit.netProfit)}`,
      subValue: worstProfit.map,
      raidId: worstProfit.id,
      timestamp: worstProfit.timestamp,
    },
    {
      label: 'Most kills',
      value: String(mostKills.kills),
      subValue: mostKills.map,
      raidId: mostKills.id,
      timestamp: mostKills.timestamp,
    },
    {
      label: 'Longest operation',
      value: `${longestRaid.duration}m`,
      subValue: longestRaid.map,
      raidId: longestRaid.id,
      timestamp: longestRaid.timestamp,
    },
    {
      label: 'Best ROI',
      value: formatPercentage(bestROI.roi),
      subValue: bestROI.map,
      raidId: bestROI.id,
      timestamp: bestROI.timestamp,
    },
    {
      label: 'Highest loot',
      value: `$${formatCurrency(highestLoot.lootValue)}`,
      subValue: highestLoot.map,
      raidId: highestLoot.id,
      timestamp: highestLoot.timestamp,
    },
  ];
}

function buildCommanderAchievements(
  raids: Raid[],
  lifetimeProfit: number,
  extractionRate: number,
  gearSummary: GearSummaryData
): CommanderAchievement[] {
  const bestProfit = raids.length > 0
    ? raids.reduce((best, raid) => (raid.netProfit > best.netProfit ? raid : best), raids[0]).netProfit
    : 0;
  const mostKills = raids.length > 0
    ? raids.reduce((best, raid) => (raid.kills > best.kills ? raid : best), raids[0]).kills
    : 0;
  const longestRaid = raids.length > 0
    ? raids.reduce((longest, raid) => (raid.duration > longest.duration ? raid : longest), raids[0]).duration
    : 0;

  return [
    {
      id: 'first_raid',
      name: 'First Blood',
      description: 'Complete your first operation',
      unlocked: raids.length >= 1,
    },
    {
      id: 'veteran',
      name: 'Veteran',
      description: 'Complete 100 operations',
      unlocked: raids.length >= 100,
      progress: raids.length,
      maxProgress: 100,
    },
    {
      id: 'profit_king',
      name: 'Profit King',
      description: 'Accumulate $1,000,000 lifetime profit',
      unlocked: lifetimeProfit >= 1_000_000,
      progress: lifetimeProfit,
      maxProgress: 1_000_000,
    },
    {
      id: 'extractor',
      name: 'The Extractor',
      description: 'Achieve 75% extraction rate across 50 operations',
      unlocked: extractionRate >= 75 && raids.length >= 50,
      progress: extractionRate,
      maxProgress: 75,
    },
    {
      id: 'money_maker',
      name: 'Money Maker',
      description: 'Earn $100,000 in a single operation',
      unlocked: bestProfit >= 100_000,
    },
    {
      id: 'slayer',
      name: 'Slayer',
      description: 'Get 10 kills in a single operation',
      unlocked: mostKills >= 10,
    },
    {
      id: 'rescue_expert',
      name: 'Rescue Expert',
      description: 'Recover 90%+ gear value in death',
      unlocked: gearSummary.bestRescuePercentage >= 90,
    },
    {
      id: 'marathon',
      name: 'Marathon Man',
      description: 'Survive an operation lasting 60+ minutes',
      unlocked: longestRaid >= 60,
    },
  ];
}

function buildCareerTimeline(raids: Raid[], highlights: Highlight[]): CareerTimelineEntry[] {
  if (raids.length === 0) return [];

  const sorted = [...raids].sort((a, b) => a.timestamp - b.timestamp);
  const events: CareerTimelineEntry[] = [];
  const reachedProfitMilestones = new Set<number>();

  events.push({
    timestamp: sorted[0].timestamp,
    type: 'first_raid',
    label: 'First deployment',
    detail: `${sorted[0].map} · ${sorted[0].status}`,
  });

  const raidMilestones = [10, 25, 50, 100, 250, 500, 1000];
  for (const milestone of raidMilestones) {
    if (sorted.length >= milestone) {
      events.push({
        timestamp: sorted[milestone - 1].timestamp,
        type: 'milestone_raids',
        label: `${milestone} operations logged`,
        detail: 'Career deployment milestone',
      });
    }
  }

  let cumulativeProfit = 0;
  const profitMilestones = [100_000, 500_000, 1_000_000, 5_000_000];
  for (const raid of sorted) {
    cumulativeProfit += raid.netProfit;
    for (const milestone of profitMilestones) {
      if (cumulativeProfit >= milestone && !reachedProfitMilestones.has(milestone)) {
        reachedProfitMilestones.add(milestone);
        events.push({
          timestamp: raid.timestamp,
          type: 'milestone_profit',
          label: `$${formatCurrency(milestone)} lifetime profit`,
          detail: 'Financial career milestone',
        });
      }
    }
  }

  const bestRaid = sorted.reduce((best, raid) => (raid.netProfit > best.netProfit ? raid : best), sorted[0]);
  events.push({
    timestamp: bestRaid.timestamp,
    type: 'best_raid',
    label: 'Peak operation',
    detail: `+$${formatCurrency(bestRaid.netProfit)} on ${bestRaid.map}`,
  });

  for (const highlight of [...highlights].sort((a, b) => b.timestamp - a.timestamp).slice(0, 5)) {
    events.push({
      timestamp: highlight.timestamp,
      type: 'highlight',
      label: 'Highlight recorded',
      detail: highlight.reason,
    });
  }

  return events
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 12);
}

function buildEmptyCommanderIntelligence(): CommanderIntelligenceData {
  return {
    prestige: { level: 0, title: 'Unknown' },
    tacticalScore: 0,
    playstyle: null,
    playstyleConfidence: 'low',
    serviceRecord: {
      firstDeployment: null,
      lastDeployment: null,
      totalDeployments: 0,
      totalSessions: 0,
      totalHighlights: 0,
      totalKills: 0,
      totalDeaths: 0,
      lifetimeInvestment: 0,
      lifetimeLoot: 0,
      averageDuration: 0,
      extractionRate: 0,
      lifetimeProfit: 0,
      averageROI: 0,
    },
    streaks: {
      currentExtraction: 0,
      longestExtraction: 0,
      currentProfit: 0,
      longestProfit: 0,
      currentDry: 0,
    },
    records: [],
    mapBreakdown: [],
    loadoutBreakdown: [],
    careerTimeline: [],
    achievements: [],
    unlockedAchievementCount: 0,
  };
}

/**
 * Commander dossier intelligence: service record, streaks, records, maps, loadouts, timeline.
 */
export function calculateCommanderIntelligence(
  raids: Raid[],
  sessions: Session[],
  highlights: Highlight[],
  gearSummary: GearSummaryData
): CommanderIntelligenceData {
  if (raids.length === 0) {
    return buildEmptyCommanderIntelligence();
  }

  const sortedDesc = [...raids].sort((a, b) => b.timestamp - a.timestamp);
  const sortedAsc = [...sortedDesc].reverse();
  const investedRaids = raids.filter(raid => raid.investment > 0);

  const lifetimeProfit = raids.reduce((sum, raid) => sum + raid.netProfit, 0);
  const lifetimeInvestment = raids.reduce((sum, raid) => sum + raid.investment, 0);
  const lifetimeLoot = raids.reduce((sum, raid) => sum + raid.lootValue, 0);
  const extractionRate = perfExtractionRate(raids);
  const averageROI = investedRaids.length > 0
    ? investedRaids.reduce((sum, raid) => sum + raid.roi, 0) / investedRaids.length
    : 0;

  const { playstyle, confidence: playstyleConfidence } = classifyCommanderPlaystyle(raids);
  const achievements = buildCommanderAchievements(raids, lifetimeProfit, extractionRate, gearSummary);

  return {
    prestige: resolvePrestige(raids.length),
    tacticalScore: calculateTacticalScore(raids),
    playstyle,
    playstyleConfidence,
    serviceRecord: {
      firstDeployment: sortedAsc[0].timestamp,
      lastDeployment: sortedDesc[0].timestamp,
      totalDeployments: raids.length,
      totalSessions: sessions.length,
      totalHighlights: highlights.length,
      totalKills: raids.reduce((sum, raid) => sum + raid.kills, 0),
      totalDeaths: raids.reduce((sum, raid) => sum + raid.deaths, 0),
      lifetimeInvestment,
      lifetimeLoot,
      averageDuration: raids.reduce((sum, raid) => sum + raid.duration, 0) / raids.length,
      extractionRate,
      lifetimeProfit,
      averageROI,
    },
    streaks: calculateCommanderStreaks(sortedDesc),
    records: buildCommanderRecords(raids),
    mapBreakdown: buildCommanderMapRows(raids).slice(0, 6),
    loadoutBreakdown: buildCommanderLoadoutRows(raids),
    careerTimeline: buildCareerTimeline(raids, highlights),
    achievements,
    unlockedAchievementCount: achievements.filter(achievement => achievement.unlocked).length,
  };
}
