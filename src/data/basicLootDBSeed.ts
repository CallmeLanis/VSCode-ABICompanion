import type { LootDBItem } from '../types';
import { buildMedicCatalogSeedItems, MEDIC_CATALOG_SEED_COUNT } from './medicCatalogSeed';
import { buildGrenadeCatalogSeedItems, GRENADE_CATALOG_SEED_COUNT } from './grenadeCatalogSeed';

export const BASIC_LOOTDB_SEED_COUNT = MEDIC_CATALOG_SEED_COUNT + GRENADE_CATALOG_SEED_COUNT;

/** Default consumables catalog: medic + grenade items for Mission Debrief pickers. */
export function buildBasicLootDBSeedItems(
  idFactory?: () => string,
): LootDBItem[] {
  return [
    ...buildMedicCatalogSeedItems(idFactory),
    ...buildGrenadeCatalogSeedItems(idFactory),
  ];
}
