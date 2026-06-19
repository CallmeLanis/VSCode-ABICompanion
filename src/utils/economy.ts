import type { Raid, AmmoEntry, ConsumableEntry, GearRescueData, LootItem } from '../types';

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
 * Calculate gear loss based on rescue data
 * Returns gear loss value (only actual loss, not full gear value)
 */
export function calculateGearLoss(gearValue: number, gearRescue?: GearRescueData): number {
  if (!gearRescue) {
    // No rescue data means no rescue occurred
    // Gear loss depends on status - if died with no rescue, full loss
    return gearValue;
  }
  return gearRescue.gearLoss || 0;
}

/**
 * Calculate total investment for a raid
 * Investment = Ammo + Consumables + Gear Loss
 */
export function calculateInvestment(raid: Partial<Raid>): number {
  const ammoCost = raid.ammo ? calculateAmmoCost(raid.ammo) : 0;
  const consumablesCost = raid.consumables ? calculateConsumablesCost(raid.consumables) : 0;
  const gearLoss = raid.gearValue ? calculateGearLoss(raid.gearValue, raid.gearRescue) : 0;

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
