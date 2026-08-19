import type { LootDBItem } from '../types';
import { buildMedicCatalogSeedItems, MEDIC_CATALOG_SEED_COUNT } from './medicCatalogSeed';
import { buildGrenadeCatalogSeedItems, GRENADE_CATALOG_SEED_COUNT } from './grenadeCatalogSeed';

export const INVENTORY_CATALOG_SEED_COUNT = MEDIC_CATALOG_SEED_COUNT + GRENADE_CATALOG_SEED_COUNT;

/** Bundled inventory catalog for Mission Debrief pickers (medic + grenade). */
export function buildInventoryCatalogSeedItems(
  idFactory?: () => string,
): LootDBItem[] {
  const nextId = idFactory ?? (() => `inventory-seed-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  return [
    ...buildMedicCatalogSeedItems(nextId),
    ...buildGrenadeCatalogSeedItems(nextId),
  ];
}

/** @deprecated Use buildInventoryCatalogSeedItems */
export const buildBasicLootDBSeedItems = buildInventoryCatalogSeedItems;

/** @deprecated Use INVENTORY_CATALOG_SEED_COUNT */
export const BASIC_LOOTDB_SEED_COUNT = INVENTORY_CATALOG_SEED_COUNT;
