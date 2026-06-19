// Core Types for ABI Companion

// Raid Status
export type RaidStatus = 'EXTRACTED' | 'DIED' | 'FLED';

// Ammo Entry for multi-ammo support
export interface AmmoEntry {
  id: string;
  caliber: string;
  tier: string;
  quantity: number;
  costPerRound: number;
  totalCost: number;
}

// Consumable Entry
export interface ConsumableEntry {
  id: string;
  name: string;
  quantity: number;
  costPerUnit: number;
  totalCost: number;
  type: 'treatment' | 'throwable';
}

// Gear Rescue Data
export interface GearRescueData {
  gearValue: number;
  rescuePercentage: number;
  rescuedValue: number;
  gearLoss: number;
}

// Loot Item
export interface LootItem {
  id: string;
  name: string;
  baseValue: number;
  quantity: number;
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'red';
  source?: string;
}

// Raid Record
export interface Raid {
  id: string;
  timestamp: number;
  map: string;
  mode: string;
  status: RaidStatus;
  duration: number;

  // Investment components
  ammo: AmmoEntry[];
  consumables: ConsumableEntry[];
  gearValue: number;
  gearRescue?: GearRescueData;

  // Loot
  loot: LootItem[];
  lootValue: number;

  // Combat
  kills: number;
  deaths: number;
  assists?: number;

  // Calculated fields
  investment: number;
  netProfit: number;
  roi: number;

  // Highlight
  isHighlight: boolean;
  highlightReason?: string;
  highlightCategory?: 'profit' | 'kills' | 'rare' | 'manual';

  // Session
  sessionId: string;

  // Legacy fields for backward compatibility
  legacyAmmo?: {
    caliber: string;
    quantity: number;
    costPerRound: number;
  };
  insurance?: boolean;
  notes?: string;
  tags?: string[];
}

// Session
export interface Session {
  id: string;
  startTime: number;
  endTime: number;
  raidCount: number;
  totalProfit: number;
  totalInvestment: number;
  totalLoot: number;
  extractionRate: number;
  bestRaid?: string;
  worstRaid?: string;
  notes?: string;
}

// Highlight
export interface Highlight {
  raidId: string;
  timestamp: number;
  category: 'profit' | 'kills' | 'rare' | 'manual';
  reason: string;
  isFavorite: boolean;
}

// LootDB Item
export interface LootDBItem {
  id: string;
  name: string;
  category: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'red';
  marketPrice: number;
  vendorPrices: {
    vendor: string;
    price: number;
  }[];
  lowestPrice: number;
  lowestPriceHistory: {
    price: number;
    timestamp: number;
  }[];
  bestSellTo: string;
  imageUrl?: string;
  notes?: string;
}

// Settings
export interface AppSettings {
  globalTaxRate: number;
  sessionDuration: number;
  highlightProfitThreshold: number;
  highlightKillThreshold: number;
}

// Analytics Cache
export interface AnalyticsCache {
  lastUpdated: number;
  totalRaids: number;
  extractionRate: number;
  averageROI: number;
  lifetimeProfit: number;
  averageLootValue: number;
  totalExtracted: number;
  dryStreak: number;
  bestRaidToday?: Raid;
  latestHighlight?: Highlight;
  bestSession?: Session;
}

// Vendor
export interface Vendor {
  id: string;
  name: string;
  icon?: string;
}

// Ammo Caliber
export interface AmmoCaliber {
  id: string;
  name: string;
  tiers: AmmoTier[];
}

export interface AmmoTier {
  id: string;
  name: string;
  costPerRound: number;
  penetration?: number;
  damage?: number;
}

// Consumable Template
export interface ConsumableTemplate {
  id: string;
  name: string;
  type: 'treatment' | 'throwable';
  baseCost: number;
}

// Map data
export interface MapData {
  id: string;
  name: string;
  shortName: string;
  icon?: string;
}

// Game Mode
export interface GameMode {
  id: string;
  name: string;
  shortName: string;
}
