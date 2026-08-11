import type { Raid, RaidStatus, AmmoEntry, ConsumableEntry, GearRescueData, LootItem, Highlight, AppSettings, LootDBItem, LootSellAction, RoiMode } from '../types';
import { LOOT_CONTACT_LABEL } from '../data/constants';

/**
 * Economy Engine
 *
 * Investment = Ammo Cost + Consumables Cost + Gear Loss
 *
 * Ammo: Always fully consumed
 * Consumables: Always fully consumed
 * Gear: Only Gear Loss contributes to Investment
 *
 * Loot Valuation:
 *   Market Net Yield = marketPrice × (1 - GlobalTaxRate)
 *   effectiveValue = max(Market Net Yield, vendorPrice)
 */

const DEFAULT_TAX_RATE = 0.10; // 10% market tax

/**
 * Calculate total ammo cost from multiple ammo entries
 */
export function calculateAmmoCost(ammo: AmmoEntry[]): number {
  return ammo.reduce((sum, entry) => sum + entry.totalCost, 0);
}

/**
 * Calculate total consumables cost
 */
export function calculateConsumablesCost(consumables: ConsumableEntry[]): number {
  return consumables.reduce((sum, entry) => sum + entry.totalCost, 0);
}

/**
 * Calculate gear loss based on extraction outcome and rescue data.
 * Surviving the operation returns the loadout, so nothing is lost.
 */
export function calculateGearLoss(
  gearValue: number,
  gearRescue?: GearRescueData,
  status?: RaidStatus
): number {
  if (status === 'EXTRACTED' || status === 'FLED') {
    return 0;
  }
  if (!gearRescue) {
    // No rescue data means the full loadout was lost
    return gearValue;
  }
  return gearRescue.gearLoss || 0;
}

/**
 * Calculate realized investment for a raid
 * Investment = Ammo + Consumables + Gear Loss
 */
export function calculateInvestment(raid: Partial<Raid>): number {
  const ammoCost = raid.ammo ? calculateAmmoCost(raid.ammo) : 0;
  const consumablesCost = raid.consumables ? calculateConsumablesCost(raid.consumables) : 0;
  const gearLoss = raid.gearValue
    ? calculateGearLoss(raid.gearValue, raid.gearRescue, raid.status)
    : 0;

  return ammoCost + consumablesCost + gearLoss;
}

/**
 * Calculate effective value for a loot item
 * Uses the higher of market net yield or vendor price
 */
export function calculateEffectiveValue(
  marketPrice: number,
  vendorPrice: number,
  taxRate: number = DEFAULT_TAX_RATE
): number {
  const marketNetYield = marketPrice * (1 - taxRate);
  return Math.max(marketNetYield, vendorPrice);
}

/**
 * Calculate total loot value using effective values
 */
export function calculateLootValue(
  loot: LootItem[],
  taxRate: number = DEFAULT_TAX_RATE
): number {
  return loot.reduce((sum, item) => {
    const effectiveValue = calculateEffectiveValue(item.baseValue, 0, taxRate);
    return sum + (effectiveValue * item.quantity);
  }, 0);
}

export interface LootSellRecommendation {
  action: LootSellAction;
  marketNet: number;
  bestVendorPrice: number;
  bestVendorName: string;
}

/**
 * Deterministic sell recommendation: vendor when best vendor beats market net yield.
 */
export function getLootSellRecommendation(
  item: Pick<LootDBItem, 'marketPrice' | 'vendorPrices'>,
  taxRate: number = DEFAULT_TAX_RATE
): LootSellRecommendation {
  const marketNet = item.marketPrice * (1 - taxRate);
  const bestVendor = item.vendorPrices.length > 0
    ? item.vendorPrices.reduce((best, vendor) => (vendor.price > best.price ? vendor : best))
    : null;
  const bestVendorPrice = bestVendor?.price ?? 0;
  const bestVendorName = bestVendorPrice > 0 ? LOOT_CONTACT_LABEL : '';

  if (marketNet <= 0 && bestVendorPrice <= 0) {
    return { action: 'hold', marketNet, bestVendorPrice, bestVendorName };
  }

  return {
    action: bestVendorPrice > marketNet ? 'vendor' : 'market',
    marketNet,
    bestVendorPrice,
    bestVendorName,
  };
}

/**
 * Calculate net profit for a raid
 * Net = Loot Value - Investment
 */
export function calculateNetProfit(lootValue: number, investment: number): number {
  return lootValue - investment;
}

/**
 * Calculate ROI percentage
 * ROI = (Net Profit / Investment) × 100
 */
export function calculateROI(netProfit: number, investment: number): number {
  if (investment === 0) return 0;
  return (netProfit / investment) * 100;
}

/**
 * Full loadout capital carried into the operation, regardless of outcome.
 */
export function calculateGearBrought(raid: Pick<Raid, 'gearValue' | 'gearRescue'>): number {
  return raid.gearRescue?.gearValue ?? raid.gearValue ?? 0;
}

/**
 * Investment denominator for the selected ROI decision view.
 * Operational: expendable run cost only.
 * Economic: run cost plus the loadout capital put at risk.
 */
export function calculateRoiInvestment(raid: Raid, mode: RoiMode): number {
  const runCost = calculateAmmoCost(raid.ammo) + calculateConsumablesCost(raid.consumables);
  return mode === 'economic' ? runCost + calculateGearBrought(raid) : runCost;
}

/**
 * ROI for the selected view. Self-consistent ratio: both numerator and
 * denominator use the same investment definition.
 *
 * Realized profit is deliberately NOT derived from this. Cash-flow metrics stay
 * on the stored realized values so headline profit never overstates the outcome.
 */
export function calculateRoiForMode(raid: Raid, mode: RoiMode): number {
  const investment = calculateRoiInvestment(raid, mode);
  return calculateROI(calculateNetProfit(raid.lootValue, investment), investment);
}

/**
 * Returns a raid whose `roi` reflects the selected view while `investment` and
 * `netProfit` keep realized cash-flow semantics.
 */
export function applyRoiMode(raid: Raid, mode: RoiMode): Raid {
  const normalizedRaid = raid.status === 'FLED'
    ? {
        ...raid,
        status: 'DIED' as const,
        deaths: Math.max(raid.deaths, 1),
      }
    : raid;

  if (raid.status === 'FLED') {
    const investment = calculateInvestment(normalizedRaid);
    normalizedRaid.investment = investment;
    normalizedRaid.netProfit = calculateNetProfit(normalizedRaid.lootValue, investment);
  }

  return {
    ...normalizedRaid,
    roi: calculateRoiForMode(normalizedRaid, mode),
  };
}

/**
 * Complete economy calculation for a raid
 */
export function calculateRaidEconomy(
  raid: Partial<Raid>,
  taxRate: number = DEFAULT_TAX_RATE
): { investment: number; lootValue: number; netProfit: number; roi: number } {
  const investment = calculateInvestment(raid);
  const lootValue = raid.lootValue || (raid.loot ? calculateLootValue(raid.loot, taxRate) : 0);
  const netProfit = calculateNetProfit(lootValue, investment);
  const roi = calculateROI(netProfit, investment);

  return { investment, lootValue, netProfit, roi };
}

/**
 * Calculate rescue data from gear value and percentage
 */
export function calculateGearRescue(
  gearValue: number,
  rescuePercentage: number
): GearRescueData {
  const rescuedValue = Math.round(gearValue * (rescuePercentage / 100));
  const gearLoss = gearValue - rescuedValue;

  return {
    gearValue,
    rescuePercentage,
    rescuedValue,
    gearLoss,
  };
}

/**
 * Format currency with thousand separators
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return value.toFixed(decimals) + '%';
}

/**
 * Format duration in minutes to readable string
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

/**
 * Format timestamp to readable date
 */
export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Compact ledger date: MM/DD/YY
 */
export function formatCompactDate(timestamp: number): string {
  const d = new Date(timestamp);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yy = String(d.getFullYear() % 100).padStart(2, '0');
  return `${mm}/${dd}/${yy}`;
}

/**
 * 24-hour clock time for compact tables (HH:mm)
 */
export function formatTime24(timestamp: number): string {
  const d = new Date(timestamp);
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${min}`;
}

/**
 * Format timestamp to readable time
 */
export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format timestamp to datetime
 */
export function formatDateTime(timestamp: number): string {
  return `${formatDate(timestamp)} ${formatTime(timestamp)}`;
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
}

/**
 * Determine if a raid should be highlighted
 */
export function shouldHighlightRaid(
  raid: Raid,
  thresholds: { profit: number; kills: number }
): { should: boolean; category: 'profit' | 'kills' | 'rare' | 'manual' | null } {
  // Already manually highlighted
  if (raid.isHighlight && raid.highlightCategory === 'manual') {
    return { should: true, category: 'manual' };
  }

  // Check profit threshold
  if (raid.netProfit >= thresholds.profit) {
    return { should: true, category: 'profit' };
  }

  // Check kills threshold
  if (raid.kills >= thresholds.kills) {
    return { should: true, category: 'kills' };
  }

  // Check for red rarity loot
  const hasRedRarity = raid.loot.some(item => item.rarity === 'red');
  if (hasRedRarity) {
    return { should: true, category: 'rare' };
  }

  return { should: false, category: null };
}

/**
 * Deterministic highlight detection for a raid.
 * Single source of truth for auto-generated highlights:
 * red item found → 'rare', net profit threshold → 'profit', kill threshold → 'kills'.
 * A raid can produce multiple highlights (same behavior as the original inline logic).
 */
export function detectRaidHighlights(
  raid: Raid,
  settings: Pick<AppSettings, 'highlightProfitThreshold' | 'highlightKillThreshold'>,
  options: { redItemFound?: boolean } = {}
): Highlight[] {
  const profitThreshold = settings.highlightProfitThreshold ?? 50000;
  const killThreshold = settings.highlightKillThreshold ?? 5;
  const highlights: Highlight[] = [];

  const hasRedItem = options.redItemFound || raid.loot.some(item => item.rarity === 'red');
  if (hasRedItem) {
    highlights.push({
      raidId: raid.id,
      timestamp: raid.timestamp,
      category: 'rare',
      reason: 'Red item found',
      isFavorite: false,
    });
  }

  if (raid.netProfit >= profitThreshold) {
    highlights.push({
      raidId: raid.id,
      timestamp: raid.timestamp,
      category: 'profit',
      reason: `Net profit $${raid.netProfit.toLocaleString()}`,
      isFavorite: false,
    });
  }

  if (raid.kills >= killThreshold) {
    highlights.push({
      raidId: raid.id,
      timestamp: raid.timestamp,
      category: 'kills',
      reason: `${raid.kills} kills`,
      isFavorite: false,
    });
  }

  return highlights;
}
