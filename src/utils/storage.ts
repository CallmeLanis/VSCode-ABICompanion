import type { Raid, Session, Highlight, LootDBItem, LootItem, AppSettings, AnalyticsCache } from '../types';
import { invalidateQueries } from './dataStore';

const STORAGE_KEYS = {
  RAIDS: 'abi_raids',
  SESSIONS: 'abi_sessions',
  HIGHLIGHTS: 'abi_highlights',
  LOOTDB: 'abi_lootdb',
  SETTINGS: 'abi_settings',
  ANALYTICS_CACHE: 'abi_analytics_cache',
} as const;

const DEFAULT_SETTINGS: AppSettings = {
  globalTaxRate: 0.10,
  sessionDuration: 60, // minutes
  highlightProfitThreshold: 50000,
  highlightKillThreshold: 5,
};

/**
 * Storage Engine
 * Handles localStorage persistence with backward compatibility
 */

// Generic storage helpers
function getItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Storage error:', e);
  }
}

// Raids
export function getRaids(): Raid[] {
  return getItem<Raid[]>(STORAGE_KEYS.RAIDS, []);
}

export function saveRaids(raids: Raid[]): void {
  setItem(STORAGE_KEYS.RAIDS, raids);
  invalidateQueries(['raids', 'analytics', 'sessions']);
}

export function addRaid(raid: Raid): void {
  const raids = getRaids();
  raids.push(raid);
  saveRaids(raids);
}

export function updateRaid(raid: Raid): void {
  const raids = getRaids();
  const index = raids.findIndex(r => r.id === raid.id);
  if (index !== -1) {
    raids[index] = raid;
    saveRaids(raids);
  }
}

export function deleteRaid(raidId: string): void {
  const raids = getRaids().filter(r => r.id !== raidId);
  saveRaids(raids);
}

export function getRaidById(raidId: string): Raid | undefined {
  return getRaids().find(r => r.id === raidId);
}

// Sessions
export function getSessions(): Session[] {
  return getItem<Session[]>(STORAGE_KEYS.SESSIONS, []);
}

export function saveSessions(sessions: Session[]): void {
  setItem(STORAGE_KEYS.SESSIONS, sessions);
  invalidateQueries(['sessions', 'analytics']);
}

export function getSessionById(sessionId: string): Session | undefined {
  return getSessions().find(s => s.id === sessionId);
}

// Highlights
export function getHighlights(): Highlight[] {
  return getItem<Highlight[]>(STORAGE_KEYS.HIGHLIGHTS, []);
}

export function saveHighlights(highlights: Highlight[]): void {
  setItem(STORAGE_KEYS.HIGHLIGHTS, highlights);
  invalidateQueries(['highlights', 'analytics']);
}

export function addHighlight(highlight: Highlight): void {
  const highlights = getHighlights();
  highlights.push(highlight);
  saveHighlights(highlights);
}

export function updateHighlight(highlight: Highlight): void {
  const highlights = getHighlights();
  const index = highlights.findIndex(h => h.raidId === highlight.raidId);
  if (index !== -1) {
    highlights[index] = highlight;
    saveHighlights(highlights);
  }
}

export function deleteHighlight(raidId: string): void {
  const highlights = getHighlights().filter(h => h.raidId !== raidId);
  saveHighlights(highlights);
}

// LootDB
export function getLootDBItems(): LootDBItem[] {
  return getItem<LootDBItem[]>(STORAGE_KEYS.LOOTDB, []);
}

export function saveLootDBItems(items: LootDBItem[]): void {
  setItem(STORAGE_KEYS.LOOTDB, items);
  invalidateQueries('lootdb');
}

export function addLootDBItem(item: LootDBItem): void {
  const items = getLootDBItems();
  items.push(item);
  saveLootDBItems(items);
}

export function updateLootDBItem(item: LootDBItem): void {
  const items = getLootDBItems();
  const index = items.findIndex(i => i.id === item.id);
  if (index !== -1) {
    items[index] = item;
    saveLootDBItems(items);
  }
}

export function deleteLootDBItem(itemId: string): void {
  const items = getLootDBItems().filter(i => i.id !== itemId);
  saveLootDBItems(items);
}

export function getLootDBItemByName(name: string): LootDBItem | undefined {
  return getLootDBItems().find(i => i.name.toLowerCase() === name.toLowerCase());
}

// Settings
export function getSettings(): AppSettings {
  return getItem<AppSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
}

// Returns only stored settings without applying defaults — used to avoid
// pre-populating UI with default values. UI should fallback to DEFAULT_SETTINGS
// for runtime calculations if needed.
export function getStoredSettings(): Partial<AppSettings> {
  return getItem<Partial<AppSettings>>(STORAGE_KEYS.SETTINGS, {} as Partial<AppSettings>);
}

// Persist only explicit user-provided settings (do not inject defaults).
export function saveSettings(settings: Partial<AppSettings>): void {
  setItem(STORAGE_KEYS.SETTINGS, settings);
  invalidateQueries('settings');
}

// Analytics Cache
export function getAnalyticsCache(): AnalyticsCache | null {
  return getItem<AnalyticsCache | null>(STORAGE_KEYS.ANALYTICS_CACHE, null);
}

export function saveAnalyticsCache(cache: AnalyticsCache): void {
  setItem(STORAGE_KEYS.ANALYTICS_CACHE, cache);
}

export function clearAnalyticsCache(): void {
  localStorage.removeItem(STORAGE_KEYS.ANALYTICS_CACHE);
}

// ID Generation
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Session ID generation based on timestamp and session duration
export function getSessionId(timestamp: number, sessionDuration: number): string {
  const durationMs = sessionDuration * 60 * 1000;
  const sessionStart = Math.floor(timestamp / durationMs) * durationMs;
  return `session-${sessionStart}`;
}

/**
 * Migrate legacy raid data for backward compatibility
 */
export function migrateRaidData(raid: Partial<Raid> & Record<string, unknown>): Raid {
  const now = Date.now();

  // Handle legacy single ammo format
  if (!raid.ammo || raid.ammo.length === 0) {
    if (raid.legacyAmmo) {
      const legacy = raid.legacyAmmo as { caliber: string; quantity: number; costPerRound: number };
      raid.ammo = [{
        id: `legacy-${generateId()}`,
        caliber: legacy.caliber,
        tier: 'Standard',
        quantity: legacy.quantity,
        costPerRound: legacy.costPerRound,
        totalCost: legacy.quantity * legacy.costPerRound,
      }];
    } else {
      raid.ammo = [];
    }
  }

  // Initialize consumables if missing
  if (!raid.consumables) {
    raid.consumables = [];
  }

  // Normalize loot values and quantities for backward compatibility
  const normalizedLoot = Array.isArray(raid.loot)
    ? raid.loot.map(item => ({
        ...item,
        baseValue: Number((item as Partial<LootItem>).baseValue) || 0,
        quantity: Number((item as Partial<LootItem>).quantity) || 0,
      }))
    : [];

  // Calculate investment if missing
  if (typeof raid.investment !== 'number') {
    raid.investment = 0;
  }

  // Calculate net profit if missing
  if (typeof raid.netProfit !== 'number') {
    raid.netProfit = raid.lootValue || 0;
  }

  // Calculate ROI if missing
  if (typeof raid.roi !== 'number') {
    raid.roi = raid.investment > 0 ? (raid.netProfit / raid.investment) * 100 : 0;
  }

  // Initialize highlight fields if missing
  if (typeof raid.isHighlight !== 'boolean') {
    raid.isHighlight = false;
  }

  return {
    id: raid.id || generateId(),
    timestamp: raid.timestamp || now,
    map: raid.map || 'Unknown',
    mode: raid.mode || 'Standard',
    status: raid.status || 'EXTRACTED',
    duration: raid.duration || 0,
    ammo: raid.ammo || [],
    consumables: raid.consumables || [],
    gearValue: raid.gearValue || 0,
    gearRescue: raid.gearRescue,
    loot: normalizedLoot,
    lootValue: typeof raid.lootValue === 'number' ? raid.lootValue : Number(raid.lootValue) || 0,
    kills: raid.kills || 0,
    deaths: raid.deaths || 0,
    assists: raid.assists,
    investment: raid.investment,
    netProfit: raid.netProfit,
    roi: raid.roi,
    isHighlight: raid.isHighlight,
    highlightReason: raid.highlightReason,
    highlightCategory: raid.highlightCategory,
    sessionId: raid.sessionId || getSessionId(raid.timestamp || now, 60),
  };
}

// Clear all storage
export function clearAllStorage(): void {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
  invalidateQueries(['raids', 'highlights', 'sessions', 'analytics', 'lootdb', 'settings']);
}
