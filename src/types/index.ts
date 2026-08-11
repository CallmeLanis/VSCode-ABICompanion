// Core Types for ABI Companion

// Raid Status
export type RaidStatus = 'EXTRACTED' | 'DIED' | 'FLED';

// Raid Mode
export type RaidMode = 'Normal' | 'Lockdown' | 'Forbidden';

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
  mode: RaidMode;
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

  /** Mission debrief RED checkbox — red item brought out of the raid. */
  redItemFound?: boolean;

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
  type: 'armor' | 'weapon' | 'ammo' | 'medic' | 'grenade' | 'misc';
  subtype?: string;
  tier?: string;
  caliber?: string;
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
  notes?: string;
}

// Settings
export type RoiMode = 'operational' | 'economic';

export interface AppSettings {
  globalTaxRate: number;
  sessionDuration: number;
  highlightProfitThreshold: number;
  highlightKillThreshold: number;
  roiMode: RoiMode;
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

export interface ProfitCurvePoint {
  index: number;
  label: string;
  raidId: string;
  map: string;
  mode: string;
  status: RaidStatus;
  timestamp: number;
  netProfit: number;
  cumulative: number;
}

export interface ProfitCurveData {
  values: number[];
  labels: string[];
  points: ProfitCurvePoint[];
  minY: number;
  maxY: number;
  yAxisTicks: number[];
}

export interface SpendSegment {
  label: string;
  value: number;
  color: string;
}

export interface SpendBreakdownData {
  segments: SpendSegment[];
  total: number;
}

export interface AmmoUsageRow {
  ammo: string;
  family: string;
  tier: string;
  rounds: number;
  unit: number;
  total: number;
}

export interface AmmoUsageData {
  rows: AmmoUsageRow[];
  totalSpend: number;
}

export interface ConsumableUsageRow {
  item: string;
  subtype: string;
  qty: number;
  unit: number;
  total: number;
}

export interface ConsumableUsageData {
  rows: ConsumableUsageRow[];
  totalSpend: number;
}

export interface FinancialIntelligenceData {
  totalLoot: number;
  totalInvestment: number;
  netProfit: number;
  /** Net profit as percentage of loot income. 0 when there is no loot. */
  profitMargin: number;
  averageNetPerRaid: number;
  averageROI: number;
  medianROI: number;
  /** Percentage of raids with positive net profit. */
  profitableShare: number;
  bestRaid: Raid | null;
  worstRaid: Raid | null;
}

export interface CombatIntelligenceData {
  totalOperations: number;
  totalKills: number;
  averageKills: number;
  totalDeaths: number;
  extractionRate: number;
  deathRate: number;
  killsPerExtract: number;
  averageNetPerRaid: number;
}

export interface MapPerformanceRow {
  map: string;
  raids: number;
  extractionRate: number;
  averageProfit: number;
  averageROI: number;
  totalNet: number;
  bestMode: string | null;
}

export interface ModePerformanceRow {
  mode: string;
  raids: number;
  extractionRate: number;
  averageProfit: number;
  averageROI: number;
  averageAmmo: number;
  averageConsumables: number;
  totalNet: number;
}

export interface PerformanceInsight {
  id: string;
  type: 'strength' | 'weakness';
  label: string;
  evidence: string;
}

export interface RiskAnalysisData {
  currentDryStreak: number;
  deathRate: number;
  recentExtractionRate: number;
  priorExtractionRate: number;
  extractionTrendDelta: number;
  highestRiskMap: string | null;
  highestRiskMapExtractRate: number;
}

export interface PerformanceIntelligenceData {
  combat: CombatIntelligenceData;
  maps: MapPerformanceRow[];
  modes: ModePerformanceRow[];
  strengths: PerformanceInsight[];
  weaknesses: PerformanceInsight[];
  risk: RiskAnalysisData;
  profitTrend: number[];
  roiTrend: number[];
}

export interface GearSummaryData {
  totalGearValueBrought: number;
  totalGearValueLost: number;
  totalGearValueRescued: number;
  recoveryRate: number;
  bestRescuePercentage: number;
  worstRescuePercentage: number;
  extractedCount: number;
  kiaCount: number;
}

export interface LoadoutCard {
  id: string;
  label: string;
  usage: number;
  averageInvestment: number;
  averageProfit: number;
  averageROI: number;
  extractionRate: number;
  totalNet: number;
  topMap: string | null;
  trendDelta: number;
}

export interface LoadoutUsageRow {
  raidId: string;
  timestamp: number;
  map: string;
  mode: string;
  gearValue: number;
  investment: number;
  netProfit: number;
  roi: number;
  status: RaidStatus;
}

export interface LoadoutRoiComparison {
  id: string;
  label: string;
  averageROI: number;
  usage: number;
}

export interface GearIntelligenceData {
  summary: GearSummaryData;
  loadouts: LoadoutCard[];
  roiComparison: LoadoutRoiComparison[];
  usageHistory: LoadoutUsageRow[];
  performanceHistory: number[];
}

export type LootSellAction = 'market' | 'vendor' | 'hold';

export interface LootDBRecord extends LootDBItem {
  foundCount: number;
  totalEarnings: number;
  marketNet: number;
  bestVendorPrice: number;
  bestVendorName: string;
  action: LootSellAction;
}

export interface LootIntelligenceData {
  summary: {
    totalItems: number;
    catalogMarketValue: number;
    totalFoundCount: number;
    trackedInRaids: number;
    sellToMarket: number;
    sellToVendor: number;
    needsData: number;
    byRarity: Record<string, number>;
  };
  records: LootDBRecord[];
}

export type CommanderPlaystyle =
  | 'Economic Farmer'
  | 'Aggressive Raider'
  | 'Balanced Operator'
  | 'Loot Hunter'
  | 'High Risk Commander'
  | 'Survival Specialist';

export interface CommanderCareerRecord {
  label: string;
  value: string;
  subValue: string;
  raidId?: string;
  timestamp?: number;
}

export interface CommanderAchievement {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
}

export interface CommanderMapRow {
  map: string;
  raids: number;
  extractionRate: number;
  totalProfit: number;
  averageROI: number;
}

export interface CommanderLoadoutRow {
  id: string;
  label: string;
  raids: number;
  extractionRate: number;
  averageProfit: number;
}

export interface CareerTimelineEntry {
  timestamp: number;
  type: 'first_raid' | 'milestone_raids' | 'milestone_profit' | 'best_raid' | 'highlight';
  label: string;
  detail: string;
}

export interface CommanderStreaks {
  currentExtraction: number;
  longestExtraction: number;
  currentProfit: number;
  longestProfit: number;
  currentDry: number;
}

export interface CommanderServiceRecord {
  firstDeployment: number | null;
  lastDeployment: number | null;
  totalDeployments: number;
  totalSessions: number;
  totalHighlights: number;
  totalKills: number;
  totalDeaths: number;
  lifetimeInvestment: number;
  lifetimeLoot: number;
  averageDuration: number;
  extractionRate: number;
  lifetimeProfit: number;
  averageROI: number;
}

export interface CommanderIntelligenceData {
  prestige: { level: number; title: string };
  tacticalScore: number;
  playstyle: CommanderPlaystyle | null;
  playstyleConfidence: 'low' | 'medium' | 'high';
  serviceRecord: CommanderServiceRecord;
  streaks: CommanderStreaks;
  records: CommanderCareerRecord[];
  mapBreakdown: CommanderMapRow[];
  loadoutBreakdown: CommanderLoadoutRow[];
  careerTimeline: CareerTimelineEntry[];
  achievements: CommanderAchievement[];
  unlockedAchievementCount: number;
}

export interface SessionSummary {
  sessions: Session[];
  totalSessions: number;
  totalRaids: number;
  totalProfit: number;
  totalInvestment: number;
  averageExtractionRate: number;
  bestSession: Session | null;
}

// Vendor
export interface Vendor {
  id: string;
  name: string;
  icon?: string;
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
