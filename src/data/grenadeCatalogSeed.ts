import type { LootDBItem } from '../types';
import { LOOT_CONTACT_LABEL } from './constants';

/** Catalog seed for Mission Debrief consumables picker (grenade family). */
type GrenadeSeedRow = {
  name: string;
  subtype: 'defend' | 'blast';
  marketPrice: number;
  vendorPrice: number;
};

const GRENADE_SUBTYPE_CATEGORY: Record<GrenadeSeedRow['subtype'], string> = {
  defend: 'Defend',
  blast: 'Blast',
};

const GRENADE_SEED_ROWS: GrenadeSeedRow[] = [
  { name: 'Shock Grenade', subtype: 'defend', marketPrice: 45977, vendorPrice: 40000 },
  { name: 'MK2 Nade', subtype: 'blast', marketPrice: 0, vendorPrice: 27615 },
  { name: 'M67 Nade', subtype: 'blast', marketPrice: 0, vendorPrice: 27115 },
  { name: 'GHO Nade', subtype: 'blast', marketPrice: 0, vendorPrice: 26105 },
  { name: 'F4 Tear Gas', subtype: 'defend', marketPrice: 0, vendorPrice: 9360 },
  { name: 'M18 Smoke', subtype: 'defend', marketPrice: 0, vendorPrice: 9280 },
  { name: 'Z3 Stun', subtype: 'defend', marketPrice: 0, vendorPrice: 8460 },
  { name: 'M84 Flashbang', subtype: 'defend', marketPrice: 0, vendorPrice: 7520 },
  { name: 'Molotov', subtype: 'defend', marketPrice: 0, vendorPrice: 7440 },
];

export function buildGrenadeCatalogSeedItems(
  idFactory: () => string = () => `grenade-seed-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
): LootDBItem[] {
  return GRENADE_SEED_ROWS.map((row) => ({
    id: idFactory(),
    name: row.name,
    category: GRENADE_SUBTYPE_CATEGORY[row.subtype],
    rarity: 'common',
    type: 'grenade',
    subtype: row.subtype,
    marketPrice: row.marketPrice,
    vendorPrices: [{ vendor: LOOT_CONTACT_LABEL, price: row.vendorPrice }],
    lowestPrice: 0,
    lowestPriceHistory: [],
    bestSellTo: row.marketPrice > 0 ? 'Market' : LOOT_CONTACT_LABEL,
  }));
}

export const GRENADE_CATALOG_SEED_COUNT = GRENADE_SEED_ROWS.length;
