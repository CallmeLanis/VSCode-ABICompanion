import type { MapData, GameMode, AmmoCaliber, ConsumableTemplate, Vendor } from '../types';

// Maps
export const MAPS: MapData[] = [
  { id: 'farm', name: 'Farm', shortName: 'Farm' },
  { id: 'valley', name: 'Valley', shortName: 'Val' },
  { id: 'armory', name: 'Armory', shortName: 'Arm' },
  { id: 'tv_station', name: 'TV Station', shortName: 'TV' },
  { id: 'northridge', name: 'Northridge', shortName: 'NR' },
  { id: 'airports', name: 'Airports', shortName: 'Air' },
];

// Game Modes
export const GAME_MODES: GameMode[] = [
  { id: 'standard', name: 'Standard', shortName: 'STD' },
  { id: 'hardcore', name: 'Hardcore', shortName: 'HC' },
  { id: 'coop', name: 'Co-op', shortName: 'Coop' },
];

// Ammo Calibers
export const AMMO_CALIBERS: AmmoCaliber[] = [
  {
    id: '9mm',
    name: '9x19mm',
    tiers: [
      { id: '9mm_pst', name: 'PST gzh', costPerRound: 50 },
      { id: '9mm_ap', name: 'AP 6.3', costPerRound: 120 },
      { id: '9mm_rIP', name: 'RIP', costPerRound: 180 },
    ],
  },
  {
    id: '762x25',
    name: '7.62x25mm',
    tiers: [
      { id: '762x25_pst', name: 'Pst gzh', costPerRound: 60 },
      { id: '762x25_lrnpc', name: 'LRNPC', costPerRound: 100 },
    ],
  },
  {
    id: '545x39',
    name: '5.45x39mm',
    tiers: [
      { id: '545_ps', name: 'PS gs', costPerRound: 150 },
      { id: '545_bp', name: 'BP gs', costPerRound: 350 },
      { id: '545_bt', name: 'BT gs', costPerRound: 280 },
      { id: '545_bs', name: 'BS gs', costPerRound: 450 },
    ],
  },
  {
    id: '556x45',
    name: '5.56x45mm',
    tiers: [
      { id: '556_m855', name: 'M855', costPerRound: 140 },
      { id: '556_m856a1', name: 'M856A1', costPerRound: 320 },
      { id: '556_m995', name: 'M995', costPerRound: 500 },
    ],
  },
  {
    id: '762x39',
    name: '7.62x39mm',
    tiers: [
      { id: '762_ps', name: 'PS gzh', costPerRound: 130 },
      { id: '762_bp', name: 'BP gzh', costPerRound: 350 },
      { id: '762_ap', name: 'AP gzh', costPerRound: 550 },
    ],
  },
  {
    id: '762x51',
    name: '7.62x51mm',
    tiers: [
      { id: '762x51_m80', name: 'M80', costPerRound: 200 },
      { id: '762x51_m61', name: 'M61', costPerRound: 480 },
      { id: '762x51_m993', name: 'M993', costPerRound: 600 },
    ],
  },
  {
    id: '762x54r',
    name: '7.62x54R',
    tiers: [
      { id: '762x54r_lps', name: 'LPS gzh', costPerRound: 180 },
      { id: '762x54r_bt', name: 'BT gzh', costPerRound: 380 },
      { id: '762x54r_7bt1', name: '7BT1', costPerRound: 500 },
    ],
  },
  {
    id: '939',
    name: '9x39mm',
    tiers: [
      { id: '939_sp5', name: 'SP-5', costPerRound: 250 },
      { id: '939_sp6', name: 'SP-6', costPerRound: 450 },
      { id: '939_bp', name: 'BP', costPerRound: 550 },
    ],
  },
  {
    id: '12g',
    name: '12/70',
    tiers: [
      { id: '12g_buck', name: 'Buckshot', costPerRound: 80 },
      { id: '12g_slug', name: 'Slug', costPerRound: 120 },
      { id: '12g_flechette', name: 'Flechette', costPerRound: 180 },
      { id: '12g_ap20', name: 'AP-20', costPerRound: 350 },
    ],
  },
  {
    id: '45acp',
    name: '.45 ACP',
    tiers: [
      { id: '45acp_fmj', name: 'FMJ', costPerRound: 70 },
      { id: '45acp_ap', name: 'AP', costPerRound: 200 },
      { id: '45acp RIP', name: 'RIP', costPerRound: 250 },
    ],
  },
];

// Consumables
export const CONSUMABLES: ConsumableTemplate[] = [
  // Treatments
  { id: 'bandage', name: 'Bandage', type: 'treatment', baseCost: 1000 },
  { id: 'ifix', name: 'IFAK', type: 'treatment', baseCost: 3500 },
  { id: 'medkit', name: 'Medkit', type: 'treatment', baseCost: 8000 },
  { id: 'painkillers', name: 'Painkillers', type: 'treatment', baseCost: 500 },
  { id: 'adrenaline', name: 'Adrenaline', type: 'treatment', baseCost: 2500 },
  { id: 'splint', name: 'Splint', type: 'treatment', baseCost: 2000 },
  { id: 'surgkit', name: 'Surgical Kit', type: 'treatment', baseCost: 15000 },
  // Throwables
  { id: 'frag_grenade', name: 'Frag Grenade', type: 'throwable', baseCost: 12000 },
  { id: 'stun_grenade', name: 'Stun Grenade', type: 'throwable', baseCost: 8000 },
  { id: 'smoke_grenade', name: 'Smoke Grenade', type: 'throwable', baseCost: 3000 },
  { id: 'molotov', name: 'Molotov', type: 'throwable', baseCost: 5000 },
  { id: 'c4', name: 'C4', type: 'throwable', baseCost: 25000 },
];

// Vendors
export const VENDORS: Vendor[] = [
  { id: 'black_market', name: 'Black Market' },
  { id: 'doc', name: 'Doc' },
  { id: 'arms_dealer', name: 'Arms Dealer' },
  { id: 'quartermaster', name: 'Quartermaster' },
  { id: 'barber', name: 'Barber' },
  { id: 'taskmaster', name: 'Taskmaster' },
];

// Rarity colors
export const RARITY_COLORS: Record<string, string> = {
  common: 'text-gray-400',
  uncommon: 'text-green-400',
  rare: 'text-blue-400',
  epic: 'text-purple-400',
  legendary: 'text-yellow-400',
  red: 'text-red-500',
};

export const RARITY_BG_COLORS: Record<string, string> = {
  common: 'bg-gray-900/50 border-gray-700',
  uncommon: 'bg-green-900/30 border-green-700/50',
  rare: 'bg-blue-900/30 border-blue-700/50',
  epic: 'bg-purple-900/30 border-purple-700/50',
  legendary: 'bg-yellow-900/30 border-yellow-700/50',
  red: 'bg-red-950/50 border-red-600/50',
};

// Status colors
export const STATUS_COLORS: Record<string, string> = {
  EXTRACTED: 'text-green-400',
  DIED: 'text-red-400',
  FLED: 'text-yellow-400',
};

// Status icons
export const STATUS_ICONS: Record<string, string> = {
  EXTRACTED: '✓',
  DIED: '✗',
  FLED: '↩',
};
