// Deterministic tactical intelligence engine.
// Every recommendation is derived directly from recorded raid data.
// If the data is insufficient for a rule, that rule stays silent.

import type { Raid } from '../types';
import { formatCurrency, formatPercentage } from './mockData';

export type RecommendationTone = 'positive' | 'warning' | 'negative';

export type RecommendationCategory = 'risk' | 'economy' | 'performance' | 'opportunity';

export interface TacticalRecommendation {
  id: string;
  category: RecommendationCategory;
  observation: string;
  evidence: string;
  action: string;
  tone: RecommendationTone;
}

/** Minimum raids required before the engine produces any output. */
export const MIN_OPERATIONAL_HISTORY = 5;

/** Minimum raids on a single map before map-level conclusions are drawn. */
const MIN_MAP_SAMPLE = 3;

const RECENT_WINDOW = 10;
const EXTRACTION_TREND_THRESHOLD = 15;
const DRY_STREAK_THRESHOLD = 3;
const AMMO_SHARE_THRESHOLD = 0.45;
const MAX_RECOMMENDATIONS = 4;

interface MapStats {
  map: string;
  raids: number;
  totalNet: number;
  averageNet: number;
}

function extractionRate(raids: Raid[]): number {
  if (raids.length === 0) return 0;
  return (raids.filter((r) => r.status === 'EXTRACTED').length / raids.length) * 100;
}

function buildMapStats(raids: Raid[]): MapStats[] {
  const byMap = new Map<string, { raids: number; totalNet: number }>();
  for (const raid of raids) {
    const entry = byMap.get(raid.map) ?? { raids: 0, totalNet: 0 };
    entry.raids += 1;
    entry.totalNet += raid.netProfit;
    byMap.set(raid.map, entry);
  }
  return Array.from(byMap.entries()).map(([map, { raids: count, totalNet }]) => ({
    map,
    raids: count,
    totalNet,
    averageNet: totalNet / count,
  }));
}

function detectExtractionTrend(sorted: Raid[]): TacticalRecommendation | null {
  const recent = sorted.slice(-RECENT_WINDOW);
  const prior = sorted.slice(0, -RECENT_WINDOW);
  if (prior.length < MIN_OPERATIONAL_HISTORY) return null;

  const recentRate = extractionRate(recent);
  const priorRate = extractionRate(prior);
  const delta = recentRate - priorRate;

  if (delta <= -EXTRACTION_TREND_THRESHOLD) {
    return {
      id: 'extraction-trend-down',
      category: 'risk',
      observation: 'Extraction rate is dropping',
      evidence: `Last ${recent.length} operations: ${formatPercentage(recentRate)} vs ${formatPercentage(priorRate)} career baseline`,
      action: 'Slow the tempo. Favor familiar routes and earlier extractions until the rate recovers.',
      tone: 'negative',
    };
  }
  if (delta >= EXTRACTION_TREND_THRESHOLD) {
    return {
      id: 'extraction-trend-up',
      category: 'performance',
      observation: 'Extraction rate is climbing',
      evidence: `Last ${recent.length} operations: ${formatPercentage(recentRate)} vs ${formatPercentage(priorRate)} career baseline`,
      action: 'Current approach is working. Consider raising loadout investment to capitalize.',
      tone: 'positive',
    };
  }
  return null;
}

function detectBestMap(mapStats: MapStats[]): TacticalRecommendation | null {
  const qualified = mapStats.filter((m) => m.raids >= MIN_MAP_SAMPLE);
  if (qualified.length < 2) return null;

  const best = [...qualified].sort((a, b) => b.averageNet - a.averageNet)[0];
  if (best.averageNet <= 0) return null;

  return {
    id: 'best-map',
    category: 'opportunity',
    observation: `${best.map} is your most profitable theater`,
    evidence: `${formatCurrency(best.averageNet)} average net across ${best.raids} operations`,
    action: `Prioritize deployments on ${best.map} while the margin holds.`,
    tone: 'positive',
  };
}

function detectLosingMap(mapStats: MapStats[]): TacticalRecommendation | null {
  const qualified = mapStats.filter((m) => m.raids >= MIN_MAP_SAMPLE);
  if (qualified.length < 2) return null;

  const worst = [...qualified].sort((a, b) => a.averageNet - b.averageNet)[0];
  if (worst.averageNet >= 0) return null;

  return {
    id: 'losing-map',
    category: 'risk',
    observation: `${worst.map} is draining resources`,
    evidence: `${formatCurrency(worst.averageNet)} average net across ${worst.raids} operations`,
    action: `Reduce loadout cost on ${worst.map} or reroute to stronger theaters.`,
    tone: 'warning',
  };
}

function detectDryStreak(sorted: Raid[]): TacticalRecommendation | null {
  let streak = 0;
  for (let i = sorted.length - 1; i >= 0; i -= 1) {
    if (sorted[i].status === 'EXTRACTED') break;
    streak += 1;
  }
  if (streak < DRY_STREAK_THRESHOLD) return null;

  const streakLoss = sorted
    .slice(sorted.length - streak)
    .reduce((sum, raid) => sum + raid.netProfit, 0);

  return {
    id: 'dry-streak',
    category: 'risk',
    observation: `${streak} consecutive operations without extraction`,
    evidence: `${formatCurrency(streakLoss)} net result over the current streak`,
    action: 'Deploy a low-cost loadout on your best-performing map to break the streak safely.',
    tone: 'negative',
  };
}

function detectAmmoSpendShare(raids: Raid[]): TacticalRecommendation | null {
  const totals = raids.reduce(
    (acc, raid) => {
      acc.ammo += raid.ammo.reduce((sum, entry) => sum + entry.totalCost, 0);
      acc.investment += raid.investment;
      return acc;
    },
    { ammo: 0, investment: 0 }
  );
  if (totals.investment <= 0) return null;

  const share = totals.ammo / totals.investment;
  if (share <= AMMO_SHARE_THRESHOLD) return null;

  return {
    id: 'ammo-share',
    category: 'economy',
    observation: 'Ammunition dominates your investment',
    evidence: `${formatPercentage(share * 100)} of total spend (${formatCurrency(totals.ammo)}) goes to ammo`,
    action: 'Review ammo tiers. A cheaper tier on low-threat operations protects your margin.',
    tone: 'warning',
  };
}

const GEAR_LOSS_SHARE_THRESHOLD = 0.5;
const HEALTHY_MARGIN_RATIO = 1.5;
const MIN_MODE_SAMPLE = 3;

function detectGearLossShare(raids: Raid[]): TacticalRecommendation | null {
  const totals = raids.reduce(
    (acc, raid) => {
      const ammoCost = raid.ammo.reduce((sum, entry) => sum + entry.totalCost, 0);
      const consumablesCost = raid.consumables.reduce((sum, entry) => sum + entry.totalCost, 0);
      acc.gear += Math.max(raid.investment - ammoCost - consumablesCost, 0);
      acc.investment += raid.investment;
      return acc;
    },
    { gear: 0, investment: 0 }
  );
  if (totals.investment <= 0) return null;

  const share = totals.gear / totals.investment;
  if (share <= GEAR_LOSS_SHARE_THRESHOLD) return null;

  return {
    id: 'gear-loss-share',
    category: 'economy',
    observation: 'Gear losses dominate your expenses',
    evidence: `${formatPercentage(share * 100)} of total investment (${formatCurrency(totals.gear)}) is gear loss`,
    action: 'Run cheaper loadouts on risky deployments and prioritize gear rescue when downed.',
    tone: 'warning',
  };
}

function detectLosingMode(raids: Raid[]): TacticalRecommendation | null {
  const byMode = new Map<string, { raids: number; totalNet: number }>();
  for (const raid of raids) {
    const entry = byMode.get(raid.mode) ?? { raids: 0, totalNet: 0 };
    entry.raids += 1;
    entry.totalNet += raid.netProfit;
    byMode.set(raid.mode, entry);
  }

  const qualified = Array.from(byMode.entries())
    .filter(([, stats]) => stats.raids >= MIN_MODE_SAMPLE)
    .map(([mode, stats]) => ({ mode, raids: stats.raids, averageNet: stats.totalNet / stats.raids }));
  if (qualified.length < 2) return null;

  const worst = [...qualified].sort((a, b) => a.averageNet - b.averageNet)[0];
  if (worst.averageNet >= 0) return null;

  return {
    id: 'losing-mode',
    category: 'economy',
    observation: `${worst.mode} mode is running at a loss`,
    evidence: `${formatCurrency(worst.averageNet)} average net across ${worst.raids} operations`,
    action: `Reduce investment in ${worst.mode} mode or shift deployments to a profitable mode.`,
    tone: 'warning',
  };
}

function detectHealthyMargin(raids: Raid[]): TacticalRecommendation | null {
  const totals = raids.reduce(
    (acc, raid) => {
      acc.loot += raid.lootValue;
      acc.investment += raid.investment;
      return acc;
    },
    { loot: 0, investment: 0 }
  );
  if (totals.investment <= 0) return null;

  const ratio = totals.loot / totals.investment;
  if (ratio < HEALTHY_MARGIN_RATIO) return null;

  return {
    id: 'healthy-margin',
    category: 'opportunity',
    observation: 'Loot returns comfortably exceed investment',
    evidence: `${ratio.toFixed(1)}x return on ${formatCurrency(totals.investment)} invested`,
    action: 'Margins support scaling up loadout quality on your strongest maps.',
    tone: 'positive',
  };
}

function detectBestMode(raids: Raid[]): TacticalRecommendation | null {
  const byMode = new Map<string, { raids: number; totalNet: number }>();
  for (const raid of raids) {
    const entry = byMode.get(raid.mode) ?? { raids: 0, totalNet: 0 };
    entry.raids += 1;
    entry.totalNet += raid.netProfit;
    byMode.set(raid.mode, entry);
  }

  const qualified = Array.from(byMode.entries())
    .filter(([, stats]) => stats.raids >= MIN_MODE_SAMPLE)
    .map(([mode, stats]) => ({ mode, raids: stats.raids, averageNet: stats.totalNet / stats.raids }));
  if (qualified.length < 2) return null;

  const best = [...qualified].sort((a, b) => b.averageNet - a.averageNet)[0];
  if (best.averageNet <= 0) return null;

  return {
    id: 'best-mode',
    category: 'performance',
    observation: `${best.mode} mode delivers your best results`,
    evidence: `${formatCurrency(best.averageNet)} average net across ${best.raids} operations`,
    action: `Prioritize ${best.mode} deployments when pushing for consistent performance.`,
    tone: 'positive',
  };
}

function detectHighDeathRate(raids: Raid[]): TacticalRecommendation | null {
  if (raids.length < MIN_OPERATIONAL_HISTORY) return null;
  const deathRate = (raids.filter(r => r.status === 'DIED').length / raids.length) * 100;
  if (deathRate < 50) return null;

  return {
    id: 'high-death-rate',
    category: 'risk',
    observation: 'Death rate is elevated across recent operations',
    evidence: `${formatPercentage(deathRate)} of operations end in KIA`,
    action: 'Reduce engagement tempo, favor safer extract routes, and review loadout survivability.',
    tone: 'negative',
  };
}

function detectLowExtractMap(raids: Raid[]): TacticalRecommendation | null {
  const byMap = new Map<string, { raids: number; extracted: number }>();
  for (const raid of raids) {
    const entry = byMap.get(raid.map) ?? { raids: 0, extracted: 0 };
    entry.raids += 1;
    if (raid.status === 'EXTRACTED') entry.extracted += 1;
    byMap.set(raid.map, entry);
  }

  const qualified = Array.from(byMap.entries())
    .filter(([, stats]) => stats.raids >= MIN_MAP_SAMPLE)
    .map(([map, stats]) => ({
      map,
      raids: stats.raids,
      rate: (stats.extracted / stats.raids) * 100,
    }));
  if (qualified.length < 2) return null;

  const worst = [...qualified].sort((a, b) => a.rate - b.rate)[0];
  if (worst.rate >= 30) return null;

  return {
    id: 'low-extract-map',
    category: 'risk',
    observation: `${worst.map} has a critical extraction deficit`,
    evidence: `${formatPercentage(worst.rate)} extract rate across ${worst.raids} operations`,
    action: `Study safer routes on ${worst.map} or reduce exposure until extract rate recovers.`,
    tone: 'warning',
  };
}

function detectBestLoadout(raids: Raid[]): TacticalRecommendation | null {
  const withGear = raids.filter(r => r.gearValue > 0);
  if (withGear.length < MIN_OPERATIONAL_HISTORY) return null;

  const tiers = new Map<string, { label: string; raids: number; totalNet: number }>();
  for (const raid of withGear) {
    let tierId = 'elite';
    let label = 'Elite (20M+)';
    if (raid.gearValue < 1_000_000) {
      tierId = 'light';
      label = 'Light (<1M)';
    } else if (raid.gearValue < 5_000_000) {
      tierId = 'standard';
      label = 'Standard (1M–5M)';
    } else if (raid.gearValue < 20_000_000) {
      tierId = 'heavy';
      label = 'Heavy (5M–20M)';
    }
    const entry = tiers.get(tierId) ?? { label, raids: 0, totalNet: 0 };
    entry.raids += 1;
    entry.totalNet += raid.netProfit;
    tiers.set(tierId, entry);
  }

  const qualified = [...tiers.values()].filter(t => t.raids >= MIN_MAP_SAMPLE);
  if (qualified.length < 2) return null;

  const best = [...qualified].sort((a, b) => (b.totalNet / b.raids) - (a.totalNet / a.raids))[0];
  const avgNet = best.totalNet / best.raids;
  if (avgNet <= 0) return null;

  return {
    id: 'best-loadout',
    category: 'opportunity',
    observation: `${best.label} loadout tier is your most efficient`,
    evidence: `${formatCurrency(avgNet)} average net across ${best.raids} deployments`,
    action: `Prioritize the ${best.label} investment band on your strongest maps.`,
    tone: 'positive',
  };
}

function detectWorstLoadout(raids: Raid[]): TacticalRecommendation | null {
  const withGear = raids.filter(r => r.gearValue > 0);
  if (withGear.length < MIN_OPERATIONAL_HISTORY) return null;

  const tiers = new Map<string, { label: string; raids: number; totalNet: number }>();
  for (const raid of withGear) {
    let tierId = 'elite';
    let label = 'Elite (20M+)';
    if (raid.gearValue < 1_000_000) {
      tierId = 'light';
      label = 'Light (<1M)';
    } else if (raid.gearValue < 5_000_000) {
      tierId = 'standard';
      label = 'Standard (1M–5M)';
    } else if (raid.gearValue < 20_000_000) {
      tierId = 'heavy';
      label = 'Heavy (5M–20M)';
    }
    const entry = tiers.get(tierId) ?? { label, raids: 0, totalNet: 0 };
    entry.raids += 1;
    entry.totalNet += raid.netProfit;
    tiers.set(tierId, entry);
  }

  const qualified = [...tiers.values()].filter(t => t.raids >= MIN_MAP_SAMPLE);
  if (qualified.length < 2) return null;

  const worst = [...qualified].sort((a, b) => (a.totalNet / a.raids) - (b.totalNet / b.raids))[0];
  const avgNet = worst.totalNet / worst.raids;
  if (avgNet >= 0) return null;

  return {
    id: 'worst-loadout',
    category: 'risk',
    observation: `${worst.label} loadout tier is underperforming`,
    evidence: `${formatCurrency(avgNet)} average net across ${worst.raids} deployments`,
    action: `Reduce spend in the ${worst.label} band or switch to a proven loadout tier.`,
    tone: 'warning',
  };
}

const tonePriority: Record<RecommendationTone, number> = {
  negative: 0,
  warning: 1,
  positive: 2,
};

/**
 * Generates up to four deterministic recommendations from raid history.
 * Returns an empty array when there is not enough operational history.
 */
export function generateQuickRecommendations(raids: Raid[]): TacticalRecommendation[] {
  if (raids.length < MIN_OPERATIONAL_HISTORY) return [];

  const sorted = [...raids].sort((a, b) => a.timestamp - b.timestamp);
  const mapStats = buildMapStats(sorted);

  const recommendations = [
    detectDryStreak(sorted),
    detectExtractionTrend(sorted),
    detectLosingMap(mapStats),
    detectAmmoSpendShare(sorted),
    detectBestMap(mapStats),
  ].filter((rec): rec is TacticalRecommendation => rec !== null);

  return recommendations
    .sort((a, b) => tonePriority[a.tone] - tonePriority[b.tone])
    .slice(0, MAX_RECOMMENDATIONS);
}

/**
 * Economy-focused recommendations for the Financial Intelligence page.
 * Deterministic; returns an empty array when there is not enough history.
 */
export function generateEconomyRecommendations(raids: Raid[]): TacticalRecommendation[] {
  if (raids.length < MIN_OPERATIONAL_HISTORY) return [];

  const recommendations = [
    detectGearLossShare(raids),
    detectAmmoSpendShare(raids),
    detectLosingMode(raids),
    detectHealthyMargin(raids),
  ].filter((rec): rec is TacticalRecommendation => rec !== null);

  return recommendations
    .sort((a, b) => tonePriority[a.tone] - tonePriority[b.tone])
    .slice(0, MAX_RECOMMENDATIONS);
}

export function generatePerformanceRecommendations(raids: Raid[]): TacticalRecommendation[] {
  if (raids.length < MIN_OPERATIONAL_HISTORY) return [];

  const sorted = [...raids].sort((a, b) => a.timestamp - b.timestamp);
  const mapStats = buildMapStats(sorted);

  const recommendations = [
    detectDryStreak(sorted),
    detectExtractionTrend(sorted),
    detectHighDeathRate(raids),
    detectLowExtractMap(raids),
    detectLosingMap(mapStats),
    detectBestMap(mapStats),
    detectBestMode(raids),
  ].filter((rec): rec is TacticalRecommendation => rec !== null);

  return recommendations
    .sort((a, b) => tonePriority[a.tone] - tonePriority[b.tone])
    .slice(0, MAX_RECOMMENDATIONS);
}

export function generateGearRecommendations(raids: Raid[]): TacticalRecommendation[] {
  if (raids.length < MIN_OPERATIONAL_HISTORY) return [];

  const recommendations = [
    detectGearLossShare(raids),
    detectWorstLoadout(raids),
    detectBestLoadout(raids),
  ].filter((rec): rec is TacticalRecommendation => rec !== null);

  return recommendations
    .sort((a, b) => tonePriority[a.tone] - tonePriority[b.tone])
    .slice(0, MAX_RECOMMENDATIONS);
}

export interface IntelligenceSignal {
  id: string;
  category: RecommendationCategory;
  observation: string;
  evidence: string;
  impact: string;
  action: string;
  tone: RecommendationTone;
}

export interface IntelligenceBrief {
  currentState: 'nominal' | 'watch' | 'risk';
  recentOperations: number;
  recentNet: number;
  recentExtractionRate: number;
  activeSignals: IntelligenceSignal[];
  positiveSignals: IntelligenceSignal[];
  riskSignals: IntelligenceSignal[];
}

const INTELLIGENCE_WINDOW = 10;
const MIN_COMPARISON_HISTORY = 5;
const NET_CHANGE_THRESHOLD = 20;
const ROI_CHANGE_THRESHOLD = 20;

function createSignal(
  signal: Omit<IntelligenceSignal, 'id'> & { id: string }
): IntelligenceSignal {
  return signal;
}

function averageNet(raids: Raid[]): number {
  if (raids.length === 0) return 0;
  return raids.reduce((sum, raid) => sum + raid.netProfit, 0) / raids.length;
}

function averageRoi(raids: Raid[]): number {
  const invested = raids.filter((raid) => raid.investment > 0);
  if (invested.length === 0) return 0;
  return invested.reduce((sum, raid) => sum + raid.roi, 0) / invested.length;
}

function percentageChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

/**
 * Consolidates the latest operational changes into a single deterministic briefing.
 * Signals only appear where a measured threshold has been crossed.
 */
export function generateIntelligenceBrief(raids: Raid[]): IntelligenceBrief {
  if (raids.length < MIN_OPERATIONAL_HISTORY) {
    return {
      currentState: 'nominal',
      recentOperations: raids.length,
      recentNet: raids.reduce((sum, raid) => sum + raid.netProfit, 0),
      recentExtractionRate: extractionRate(raids),
      activeSignals: [],
      positiveSignals: [],
      riskSignals: [],
    };
  }

  const sorted = [...raids].sort((a, b) => a.timestamp - b.timestamp);
  const recent = sorted.slice(-INTELLIGENCE_WINDOW);
  const prior = sorted.slice(0, -recent.length);
  const signals: IntelligenceSignal[] = [];

  if (prior.length >= MIN_COMPARISON_HISTORY) {
    const recentNet = averageNet(recent);
    const priorNet = averageNet(prior);
    const netDelta = percentageChange(recentNet, priorNet);

    if (netDelta !== null && netDelta >= NET_CHANGE_THRESHOLD) {
      signals.push(createSignal({
        id: 'recent-net-up',
        category: 'economy',
        observation: 'Recent operation value is improving',
        evidence: `Last ${recent.length}: ${formatCurrency(recentNet)} average net vs ${formatCurrency(priorNet)} earlier`,
        impact: 'The current approach is generating more value per deployment.',
        action: 'Keep the current map and loadout pattern until another comparison window is available.',
        tone: 'positive',
      }));
    } else if (netDelta !== null && netDelta <= -NET_CHANGE_THRESHOLD) {
      signals.push(createSignal({
        id: 'recent-net-down',
        category: 'economy',
        observation: 'Recent operation value is declining',
        evidence: `Last ${recent.length}: ${formatCurrency(recentNet)} average net vs ${formatCurrency(priorNet)} earlier`,
        impact: 'Continued deployment at this pace will reduce available operating capital.',
        action: 'Lower investment for the next deployments and use the strongest proven map.',
        tone: 'negative',
      }));
    }

    const recentRoi = averageRoi(recent);
    const priorRoi = averageRoi(prior);
    const roiDelta = recentRoi - priorRoi;
    if (roiDelta >= ROI_CHANGE_THRESHOLD) {
      signals.push(createSignal({
        id: 'recent-roi-up',
        category: 'performance',
        observation: 'Return on investment is improving',
        evidence: `Last ${recent.length}: ${formatPercentage(recentRoi)} ROI vs ${formatPercentage(priorRoi)} earlier`,
        impact: 'Your current spend is converting into loot more efficiently.',
        action: 'Maintain the present investment range while extraction performance remains stable.',
        tone: 'positive',
      }));
    } else if (roiDelta <= -ROI_CHANGE_THRESHOLD) {
      signals.push(createSignal({
        id: 'recent-roi-down',
        category: 'economy',
        observation: 'Return on investment is weakening',
        evidence: `Last ${recent.length}: ${formatPercentage(recentRoi)} ROI vs ${formatPercentage(priorRoi)} earlier`,
        impact: 'The same investment is returning less value than the earlier operating baseline.',
        action: 'Audit ammo and gear spend before increasing deployment cost.',
        tone: 'warning',
      }));
    }
  }

  const tacticalRecommendations = [
    ...generatePerformanceRecommendations(sorted),
    ...generateEconomyRecommendations(sorted),
    ...generateGearRecommendations(sorted),
  ];

  const seenIds = new Set(signals.map((signal) => signal.id));
  for (const recommendation of tacticalRecommendations) {
    if (seenIds.has(recommendation.id)) continue;
    seenIds.add(recommendation.id);
    signals.push(createSignal({
      id: recommendation.id,
      category: recommendation.category,
      observation: recommendation.observation,
      evidence: recommendation.evidence,
      impact: recommendation.tone === 'positive'
        ? 'This pattern is supporting current operational performance.'
        : 'This pattern is adding measurable pressure to operational performance.',
      action: recommendation.action,
      tone: recommendation.tone,
    }));
  }

  const sortedSignals = signals
    .sort((a, b) => tonePriority[a.tone] - tonePriority[b.tone])
    .slice(0, 8);
  const riskSignals = sortedSignals.filter((signal) => signal.tone !== 'positive');
  const positiveSignals = sortedSignals.filter((signal) => signal.tone === 'positive');

  return {
    currentState: riskSignals.some((signal) => signal.tone === 'negative')
      ? 'risk'
      : riskSignals.length > 0
        ? 'watch'
        : 'nominal',
    recentOperations: recent.length,
    recentNet: recent.reduce((sum, raid) => sum + raid.netProfit, 0),
    recentExtractionRate: extractionRate(recent),
    activeSignals: sortedSignals,
    positiveSignals,
    riskSignals,
  };
}
