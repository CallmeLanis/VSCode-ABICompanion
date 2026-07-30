import type { MapData, GameMode, ConsumableTemplate, Vendor } from '../types';

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
  { id: 'normal', name: 'Normal', shortName: 'Nor' },
  { id: 'lockdown', name: 'Lockdown', shortName: 'Lock' },
  { id: 'forbidden', name: 'Forbidden', shortName: 'Forb' },
];

// Ammo catalog lives in LootDB (localStorage). Mission Debrief reads type=ammo
// entries and uses marketPrice as costPerRound.

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
  FLED: 'text-red-400',
};

// Status icons
export const STATUS_ICONS: Record<string, string> = {
  EXTRACTED: '✓',
  DIED: '✗',
  FLED: '✗',
};
