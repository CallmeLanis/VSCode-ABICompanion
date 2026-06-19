import type { Raid, Session, AnalyticsCache } from '../types';
import { getRaids, getSessions, getHighlights, saveAnalyticsCache, getAnalyticsCache } from './storage';

// Analytics cache duration (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

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
export function calculateDashboardAnalytics(): AnalyticsCache {
  const raids = getRaids();
  const sessions = getSessions();
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
export function calculateSessionStats(sessionId: string): Session | null {
  const raids = getRaids().filter(r => r.sessionId === sessionId);

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
export function aggregateSessions(): Session[] {
  const raids = getRaids();
  const sessionMap = new Map<string, Raid[]>();

  // Group raids by session
  raids.forEach(raid => {
    const sessionId = raid.sessionId;
    if (!sessionMap.has(sessionId)) {
      sessionMap.set(sessionId, []);
    }
    sessionMap.get(sessionId)!.push(raid);
  });

  // Calculate stats for each session
  const sessions: Session[] = [];
  sessionMap.forEach((sessionRaids, sessionId) => {
    const sortedRaids = [...sessionRaids].sort((a, b) => a.timestamp - b.timestamp);
    const startTime = sortedRaids[0].timestamp;
    const endTime = sortedRaids[sortedRaids.length - 1].timestamp;

    const totalInvestment = sessionRaids.reduce((sum, r) => sum + r.investment, 0);
    const totalLoot = sessionRaids.reduce((sum, r) => sum + r.lootValue, 0);
    const totalProfit = sessionRaids.reduce((sum, r) => sum + r.netProfit, 0);

    const extractedRaids = sessionRaids.filter(r => r.status === 'EXTRACTED');
    const extractionRate = (extractedRaids.length / sessionRaids.length) * 100;

    const sortedByProfit = [...sessionRaids].sort((a, b) => b.netProfit - a.netProfit);
    const bestRaid = sortedByProfit[0]?.id;
    const worstRaid = sortedByProfit[sortedByProfit.length - 1]?.id;

    sessions.push({
      id: sessionId,
      startTime,
      endTime,
      raidCount: sessionRaids.length,
      totalProfit,
      totalInvestment,
      totalLoot,
      extractionRate,
      bestRaid,
      worstRaid,
    });
  });

  return sessions.sort((a, b) => b.startTime - a.startTime);
}

/**
 * Calculate gear analytics
 */
export function calculateGearAnalytics(): {
  totalGearValueBrought: number;
  totalGearValueLost: number;
  totalGearValueRescued: number;
  recoveryRate: number;
  bestRescuePercentage: number;
  worstRescuePercentage: number;
} {
  const raids = getRaids();

  const raidsWithGear = raids.filter(r => r.gearValue > 0);

  if (raidsWithGear.length === 0) {
    return {
      totalGearValueBrought: 0,
      totalGearValueLost: 0,
      totalGearValueRescued: 0,
      recoveryRate: 0,
      bestRescuePercentage: 0,
      worstRescuePercentage: 0,
    };
  }

  const totalGearValueBrought = raidsWithGear.reduce((sum, r) => sum + r.gearValue, 0);

  const diedRaids = raidsWithGear.filter(r => r.status === 'DIED');
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

  const bestRescuePercentage = Math.max(...rescuePercentages, 0);
  const worstRescuePercentage = Math.min(...rescuePercentages, 0);

  return {
    totalGearValueBrought,
    totalGearValueLost,
    totalGearValueRescued,
    recoveryRate,
    bestRescuePercentage,
    worstRescuePercentage,
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

  const ammoSpent = raids.reduce((sum, r) =>
    sum + r.ammo.reduce((aSum, a) => aSum + a.totalCost, 0), 0);

  const consumablesSpent = raids.reduce((sum, r) =>
    sum + r.consumables.reduce((cSum, c) => cSum + c.totalCost, 0), 0);

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
