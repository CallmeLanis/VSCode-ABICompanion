/**
 * Data Merge Utilities
 * Handles validation, sanitization, and merging of imported JSON data
 * Strictly follows existing Web schema without modifying database structure
 */

import type { Raid, Session, Highlight, LootDBItem, LootItem, AmmoEntry, ConsumableEntry, RaidStatus, RaidMode } from '../types';
import { generateId, getSessionId, migrateRaidData, getRaids, getHighlights, getLootDBItems } from './storage';

export interface MergeResult {
  success: boolean;
  summary: MergeSummary;
  errors: ValidationError[];
}

export interface MergeSummary {
  raids: { added: number; skipped: number; updated: number };
  sessions: { added: number; skipped: number };
  highlights: { added: number; skipped: number };
  lootdb: { added: number; skipped: number; updated: number };
  totalProcessed: number;
}

export interface ValidationError {
  type: 'raid' | 'session' | 'highlight' | 'lootdb';
  index: number;
  message: string;
}

// ===== Validation Functions =====

/**
 * Validate imported JSON structure
 */
export function validateImportStructure(data: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    errors.push('Imported data must be a valid JSON object');
    return { valid: false, errors };
  }

  const obj = data as Record<string, unknown>;

  // Check for at least one data type
  const hasRaids = Array.isArray(obj.raids);
  const hasSessions = Array.isArray(obj.sessions);
  const hasHighlights = Array.isArray(obj.highlights);
  const hasLootdb = Array.isArray(obj.lootdb);

  if (!hasRaids && !hasSessions && !hasHighlights && !hasLootdb) {
    errors.push('JSON must contain at least one of: raids, sessions, highlights, or lootdb arrays');
  }

  if (hasRaids && !Array.isArray(obj.raids)) {
    errors.push('raids must be an array');
  }
  if (hasSessions && !Array.isArray(obj.sessions)) {
    errors.push('sessions must be an array');
  }
  if (hasHighlights && !Array.isArray(obj.highlights)) {
    errors.push('highlights must be an array');
  }
  if (hasLootdb && !Array.isArray(obj.lootdb)) {
    errors.push('lootdb must be an array');
  }

  return { valid: errors.length === 0, errors };
}

// ===== External Format Mapping =====

/**
 * Detects if raid data is in external format (from abi-ops export)
 * External format has: date (string), status (lowercase), gearCost/ammoCost/consumablesCost
 */
function isExternalRaidFormat(raid: unknown): boolean {
  if (!raid || typeof raid !== 'object') return false;
  const r = raid as Record<string, unknown>;
  return (
    typeof r.date === 'string' &&
    typeof r.status === 'string' &&
    r.status.toLowerCase() === r.status &&
    (typeof r.gearCost === 'number' || typeof r.ammoCost === 'number')
  );
}

/**
 * Maps external raid format to internal Raid format
 */
function mapExternalRaidToInternal(raid: unknown): Raid | null {
  if (!isExternalRaidFormat(raid)) return null;

  const r = raid as Record<string, unknown>;

  try {
    // Parse timestamp from ISO date string
    const timestamp = new Date(r.date as string).getTime();
    if (isNaN(timestamp)) return null;

    // Map status to uppercase
    const statusMap: Record<string, RaidStatus> = {
      'extracted': 'EXTRACTED',
      'died': 'DIED',
      'fled': 'FLED',
    };
    const status = statusMap[(r.status as string).toLowerCase()];
    if (!status) return null;

    // Calculate totals from external format
    const gearCost = typeof r.gearCost === 'number' ? r.gearCost : 0;
    const ammoCost = typeof r.ammoCost === 'number' ? r.ammoCost : 0;
    const consumablesCost = typeof r.consumablesCost === 'number' ? r.consumablesCost : 0;
    
    const investment = gearCost + ammoCost + consumablesCost; // Will be recalculated after gear rescue
    const lootValue = typeof r.lootValue === 'number' ? r.lootValue : 0;

    // Map ammos array to internal ammo format
    const ammo: AmmoEntry[] = [];
    if (Array.isArray(r.ammos)) {
      for (const a of r.ammos as any[]) {
        if (typeof a.ammoName === 'string' && typeof a.roundsUsed === 'number' && typeof a.unitPrice === 'number') {
          const totalCost = a.roundsUsed * a.unitPrice;
          ammo.push({
            id: typeof a.ammoItemId === 'string' ? a.ammoItemId : generateId(),
            caliber: a.family || a.ammoName,
            tier: typeof a.tier === 'string' ? `T${a.tier}` : 'T0',
            quantity: a.roundsUsed,
            costPerRound: a.unitPrice,
            totalCost,
          });
        }
      }
    }

    // Map consumables array to internal format
    const consumables: ConsumableEntry[] = [];
    if (Array.isArray(r.consumables)) {
      for (const c of r.consumables as any[]) {
        if (typeof c.itemId === 'string' && typeof c.qty === 'number') {
          // Estimate cost based on itemId patterns (custom items get default cost)
          const estimatedCost = c.itemId.startsWith('custom-') ? 5000 : 1000;
          consumables.push({
            id: c.itemId,
            name: c.itemId, // Will be resolved later if needed
            quantity: c.qty,
            costPerUnit: estimatedCost,
            totalCost: c.qty * estimatedCost,
            type: 'treatment',
          });
        }
      }
    }

    // Calculate gear rescue if died
    let gearRescue: any = undefined;
    let actualGearLoss = gearCost; // Default to full loss

    if (status === 'DIED' && typeof r.rescuePercentage === 'number') {
      const rescuePct = r.rescuePercentage;
      const rescuedValue = Math.floor(gearCost * (rescuePct / 100));
      actualGearLoss = gearCost - rescuedValue; // Only count unrecovered gear as loss
      gearRescue = {
        gearValue: gearCost,
        rescuePercentage: rescuePct,
        rescuedValue,
        gearLoss: actualGearLoss,
      };
    } else if (status === 'EXTRACTED') {
      // Extracted = no gear loss
      actualGearLoss = 0;
    }

    // Recalculate investment with actual gear loss
    const finalInvestment = actualGearLoss + ammoCost + consumablesCost;
    const netProfit = lootValue - finalInvestment;
    const roi = finalInvestment > 0 ? (netProfit / finalInvestment) * 100 : 0;

    // Build internal raid object
    const mappedRaid: Raid = {
      id: typeof r.id === 'string' ? r.id : generateId(),
      timestamp,
      map: typeof r.map === 'string' ? r.map : 'Unknown',
      mode: (typeof r.mode === 'string' ? r.mode : 'Standard') as RaidMode,
      status,
      duration: 0, // Not provided in external format
      ammo,
      consumables,
      gearValue: actualGearLoss, // Only count actual gear loss, not full gear cost
      gearRescue,
      loot: [],
      lootValue,
      kills: typeof r.kills === 'number' ? r.kills : 0,
      deaths: status === 'DIED' ? 1 : 0,
      investment: finalInvestment,
      netProfit,
      roi,
      isHighlight: false,
      sessionId: `session-${Math.floor(timestamp / (60 * 60 * 1000))}`,
    };

    return mappedRaid;
  } catch (error) {
    console.error('Failed to map external raid:', error);
    return null;
  }
}

// ===== Raid Validation & Sanitization =====

function validateAmmoEntry(ammo: unknown): AmmoEntry | null {
  if (!ammo || typeof ammo !== 'object') return null;

  const a = ammo as Record<string, unknown>;

  if (typeof a.caliber !== 'string' || !a.caliber.trim()) return null;
  if (typeof a.tier !== 'string' || !a.tier.trim()) return null;
  if (typeof a.quantity !== 'number' || a.quantity < 0) return null;
  if (typeof a.costPerRound !== 'number' || a.costPerRound < 0) return null;

  const totalCost = (a.quantity as number) * (a.costPerRound as number);

  return {
    id: typeof a.id === 'string' ? a.id : generateId(),
    caliber: (a.caliber as string).trim(),
    tier: (a.tier as string).trim(),
    quantity: a.quantity as number,
    costPerRound: a.costPerRound as number,
    totalCost,
  };
}

function validateConsumableEntry(consumable: unknown): ConsumableEntry | null {
  if (!consumable || typeof consumable !== 'object') return null;

  const c = consumable as Record<string, unknown>;

  if (typeof c.name !== 'string' || !c.name.trim()) return null;
  if (typeof c.quantity !== 'number' || c.quantity < 0) return null;
  if (typeof c.costPerUnit !== 'number' || c.costPerUnit < 0) return null;
  if (c.type !== 'treatment' && c.type !== 'throwable') return null;

  const totalCost = (c.quantity as number) * (c.costPerUnit as number);

  return {
    id: typeof c.id === 'string' ? c.id : generateId(),
    name: (c.name as string).trim(),
    quantity: c.quantity as number,
    costPerUnit: c.costPerUnit as number,
    totalCost,
    type: c.type as 'treatment' | 'throwable',
  };
}

function validateLootItem(loot: unknown): LootItem | null {
  if (!loot || typeof loot !== 'object') return null;

  const l = loot as Record<string, unknown>;

  if (typeof l.name !== 'string' || !l.name.trim()) return null;
  if (typeof l.baseValue !== 'number' || l.baseValue < 0) return null;
  if (typeof l.quantity !== 'number' || l.quantity < 1) return null;

  const rarity = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'red'].includes(l.rarity as string)
    ? (l.rarity as string)
    : undefined;

  return {
    id: typeof l.id === 'string' ? l.id : generateId(),
    name: (l.name as string).trim(),
    baseValue: l.baseValue as number,
    quantity: l.quantity as number,
    rarity: rarity as 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'red' | undefined,
    source: typeof l.source === 'string' ? l.source : undefined,
  };
}

function validateRaid(raid: unknown): { valid: Raid | null; error?: string } {
  if (!raid || typeof raid !== 'object') {
    return { valid: null, error: 'Raid must be an object' };
  }

  const r = raid as Record<string, unknown>;

  // Required fields
  if (typeof r.timestamp !== 'number' || r.timestamp < 0) {
    return { valid: null, error: 'timestamp must be a positive number' };
  }
  if (typeof r.map !== 'string' || !r.map.trim()) {
    return { valid: null, error: 'map must be a non-empty string' };
  }
  if (!['EXTRACTED', 'DIED', 'FLED'].includes(r.status as string)) {
    return { valid: null, error: 'status must be EXTRACTED, DIED, or FLED' };
  }
  if (typeof r.duration !== 'number' || r.duration < 0) {
    return { valid: null, error: 'duration must be a non-negative number' };
  }
  if (typeof r.kills !== 'number' || r.kills < 0) {
    return { valid: null, error: 'kills must be a non-negative number' };
  }
  if (typeof r.deaths !== 'number' || r.deaths < 0) {
    return { valid: null, error: 'deaths must be a non-negative number' };
  }
  if (typeof r.investment !== 'number' || r.investment < 0) {
    return { valid: null, error: 'investment must be a non-negative number' };
  }
  if (typeof r.lootValue !== 'number' || r.lootValue < 0) {
    return { valid: null, error: 'lootValue must be a non-negative number' };
  }

  // Sanitize ammo, consumables, loot
  const ammo = Array.isArray(r.ammo)
    ? r.ammo.map(validateAmmoEntry).filter((a): a is AmmoEntry => a !== null)
    : [];

  const consumables = Array.isArray(r.consumables)
    ? r.consumables.map(validateConsumableEntry).filter((c): c is ConsumableEntry => c !== null)
    : [];

  const loot = Array.isArray(r.loot)
    ? r.loot.map(validateLootItem).filter((l): l is LootItem => l !== null)
    : [];

  // Calculate netProfit and ROI
  const netProfit = (r.lootValue as number) - (r.investment as number);
  const roi = (r.investment as number) > 0 ? ((netProfit / (r.investment as number)) * 100) : 0;

  const sanitized: Raid = {
    id: typeof r.id === 'string' && r.id.trim() ? r.id.trim() : generateId(),
    timestamp: r.timestamp as number,
    map: (r.map as string).trim(),
    mode: (typeof r.mode === 'string' ? r.mode.trim() : 'Standard') as RaidMode,
    status: r.status as RaidStatus,
    duration: r.duration as number,
    ammo,
    consumables,
    gearValue: typeof r.gearValue === 'number' ? Math.max(0, r.gearValue) : 0,
    gearRescue: r.gearRescue && typeof r.gearRescue === 'object' ? (r.gearRescue as any) : undefined,
    loot,
    lootValue: r.lootValue as number,
    kills: r.kills as number,
    deaths: r.deaths as number,
    assists: typeof r.assists === 'number' ? r.assists : undefined,
    investment: r.investment as number,
    netProfit,
    roi,
    isHighlight: r.isHighlight === true,
    highlightReason: typeof r.highlightReason === 'string' ? r.highlightReason : undefined,
    highlightCategory: ['profit', 'kills', 'rare', 'manual'].includes(r.highlightCategory as string)
      ? (r.highlightCategory as 'profit' | 'kills' | 'rare' | 'manual')
      : undefined,
    sessionId: gp(r.timestamp as number, 60),
    notes: typeof r.notes === 'string' ? r.notes : undefined,
    tags: Array.isArray(r.tags) && r.tags.every(t => typeof t === 'string') ? r.tags : undefined,
  };

  return { valid: sanitized };
}

// ===== Highlight Validation =====

function validateHighlight(highlight: unknown): { valid: Highlight | null; error?: string } {
  if (!highlight || typeof highlight !== 'object') {
    return { valid: null, error: 'Highlight must be an object' };
  }

  const h = highlight as Record<string, unknown>;

  if (typeof h.raidId !== 'string' || !h.raidId.trim()) {
    return { valid: null, error: 'raidId must be a non-empty string' };
  }
  if (typeof h.timestamp !== 'number') {
    return { valid: null, error: 'timestamp must be a number' };
  }
  if (!['profit', 'kills', 'rare', 'manual'].includes(h.category as string)) {
    return { valid: null, error: 'category must be profit, kills, rare, or manual' };
  }
  if (typeof h.reason !== 'string' || !h.reason.trim()) {
    return { valid: null, error: 'reason must be a non-empty string' };
  }

  return {
    valid: {
      raidId: (h.raidId as string).trim(),
      timestamp: h.timestamp as number,
      category: h.category as 'profit' | 'kills' | 'rare' | 'manual',
      reason: (h.reason as string).trim(),
      isFavorite: h.isFavorite === true,
    },
  };
}

// ===== LootDB Validation =====

function validateLootDBItem(item: unknown): { valid: LootDBItem | null; error?: string } {
  if (!item || typeof item !== 'object') {
    return { valid: null, error: 'LootDB item must be an object' };
  }

  const ldb = item as Record<string, unknown>;

  if (typeof ldb.name !== 'string' || !ldb.name.trim()) {
    return { valid: null, error: 'name must be a non-empty string' };
  }
  if (typeof ldb.category !== 'string' || !ldb.category.trim()) {
    return { valid: null, error: 'category must be a non-empty string' };
  }
  if (!['common', 'uncommon', 'rare', 'epic', 'legendary', 'red'].includes(ldb.rarity as string)) {
    return { valid: null, error: 'rarity must be common, uncommon, rare, epic, legendary, or red' };
  }
  if (typeof ldb.marketPrice !== 'number' || ldb.marketPrice < 0) {
    return { valid: null, error: 'marketPrice must be a non-negative number' };
  }

  return {
    valid: {
      id: typeof ldb.id === 'string' && ldb.id.trim() ? ldb.id.trim() : generateId(),
      name: (ldb.name as string).trim(),
      category: (ldb.category as string).trim(),
      rarity: ldb.rarity as 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'red',
      type: (ldb.type as 'armor' | 'weapon' | 'ammo' | 'medic' | 'grenade' | 'misc') || 'misc',
      subtype: typeof ldb.subtype === 'string' ? ldb.subtype : undefined,
      tier: typeof ldb.tier === 'string' ? ldb.tier : undefined,
      caliber: typeof ldb.caliber === 'string' ? ldb.caliber : undefined,
      marketPrice: ldb.marketPrice as number,
      vendorPrices: Array.isArray(ldb.vendorPrices) && (ldb.vendorPrices as any[]).every(v => typeof v.vendor === 'string' && typeof v.price === 'number')
        ? (ldb.vendorPrices as any[])
        : [],
      lowestPrice: typeof ldb.lowestPrice === 'number' ? ldb.lowestPrice : (ldb.marketPrice as number),
      lowestPriceHistory: [],
      bestSellTo: typeof ldb.bestSellTo === 'string' ? ldb.bestSellTo : 'Vendor',
      notes: typeof ldb.notes === 'string' ? ldb.notes : undefined,
    },
  };
}

// ===== Merge Logic =====

/**
 * Main merge function - orchestrates the entire import process
 */
export function mergeImportedData(
  data: unknown
): MergeResult {
  const validation = validateImportStructure(data);
  if (!validation.valid) {
    return {
      success: false,
      summary: { raids: { added: 0, skipped: 0, updated: 0 }, sessions: { added: 0, skipped: 0 }, highlights: { added: 0, skipped: 0 }, lootdb: { added: 0, skipped: 0, updated: 0 }, totalProcessed: 0 },
      errors: validation.errors.map((msg, i) => ({ type: 'raid', index: i, message: msg })),
    };
  }

  const obj = data as Record<string, unknown>;
  const summary: MergeSummary = {
    raids: { added: 0, skipped: 0, updated: 0 },
    sessions: { added: 0, skipped: 0 },
    highlights: { added: 0, skipped: 0 },
    lootdb: { added: 0, skipped: 0, updated: 0 },
    totalProcessed: 0,
  };
  const errors: ValidationError[] = [];

  // Merge raids
  if (Array.isArray(obj.raids)) {
    const raidsToMerge: Raid[] = [];
    const existingRaids = getRaids();

    for (let i = 0; i < (obj.raids as any[]).length; i++) {
      let raidToValidate = obj.raids[i];

      // Check if external format and map to internal
      if (isExternalRaidFormat(obj.raids[i])) {
        const mapped = mapExternalRaidToInternal(obj.raids[i]);
        if (!mapped) {
          errors.push({ type: 'raid', index: i, message: 'Failed to map external raid format' });
          summary.raids.skipped++;
          continue;
        }
        raidToValidate = mapped;
      }

      const validation = validateRaid(raidToValidate);
      if (!validation.valid) {
        errors.push({ type: 'raid', index: i, message: validation.error || 'Invalid raid' });
        summary.raids.skipped++;
        continue;
      }

      const raid = validation.valid;
      const existingRaid = existingRaids.find(r => r.id === raid.id);

      if (existingRaid) {
        // Decide whether to update or skip based on timestamp
        if (raid.timestamp > existingRaid.timestamp) {
          raidsToMerge.push(raid);
          summary.raids.updated++;
        } else {
          summary.raids.skipped++;
        }
      } else {
        raidsToMerge.push(raid);
        summary.raids.added++;
      }
    }

    if (raidsToMerge.length > 0) {
      const allRaids = [...existingRaids.filter(r => !raidsToMerge.find(nr => nr.id === r.id)), ...raidsToMerge];
      // Save raids via storage
      import('./storage').then(({ saveRaids }) => saveRaids(allRaids));
    }
  }

  // Merge lootdb
  if (Array.isArray(obj.lootdb)) {
    const lootdbToMerge: LootDBItem[] = [];
    const existingLootdb = getLootDBItems();

    for (let i = 0; i < (obj.lootdb as any[]).length; i++) {
      const validation = validateLootDBItem(obj.lootdb[i]);
      if (!validation.valid) {
        errors.push({ type: 'lootdb', index: i, message: validation.error || 'Invalid lootdb item' });
        summary.lootdb.skipped++;
        continue;
      }

      const item = validation.valid;
      const existingItem = existingLootdb.find(l => l.id === item.id || l.name.toLowerCase() === item.name.toLowerCase());

      if (existingItem) {
        // Update existing item with new price data if available
        const updated = { ...existingItem, ...item };
        lootdbToMerge.push(updated);
        summary.lootdb.updated++;
      } else {
        lootdbToMerge.push(item);
        summary.lootdb.added++;
      }
    }

    if (lootdbToMerge.length > 0) {
      const allLootdb = [...existingLootdb.filter(l => !lootdbToMerge.find(nl => nl.id === l.id)), ...lootdbToMerge];
      import('./storage').then(({ saveLootDBItems }) => saveLootDBItems(allLootdb));
    }
  }

  // Merge highlights
  if (Array.isArray(obj.highlights)) {
    const highlightsToMerge: Highlight[] = [];
    const existingHighlights = getHighlights();

    for (let i = 0; i < (obj.highlights as any[]).length; i++) {
      const validation = validateHighlight(obj.highlights[i]);
      if (!validation.valid) {
        errors.push({ type: 'highlight', index: i, message: validation.error || 'Invalid highlight' });
        summary.highlights.skipped++;
        continue;
      }

      const highlight = validation.valid;
      const exists = existingHighlights.some(h => h.raidId === highlight.raidId);

      if (!exists) {
        highlightsToMerge.push(highlight);
        summary.highlights.added++;
      } else {
        summary.highlights.skipped++;
      }
    }

    if (highlightsToMerge.length > 0) {
      const allHighlights = [...existingHighlights, ...highlightsToMerge];
      import('./storage').then(({ saveHighlights }) => saveHighlights(allHighlights));
    }
  }

  summary.totalProcessed = summary.raids.added + summary.raids.updated + summary.lootdb.added + summary.lootdb.updated + summary.highlights.added;

  return {
    success: true,
    summary,
    errors,
  };
}

// Helper - gp appears to be getSessionId
function gp(timestamp: number, sessionDuration: number): string {
  const durationMs = sessionDuration * 60 * 1000;
  const sessionStart = Math.floor(timestamp / durationMs) * durationMs;
  return `session-${sessionStart}`;
}
