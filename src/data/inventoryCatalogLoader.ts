import type { LootDBItem } from '../types';
import { buildInventoryCatalogSeedItems } from './inventoryCatalogSeed';

function normalizeInventoryPayload(data: unknown): LootDBItem[] {
  if (Array.isArray(data)) return data as LootDBItem[];
  if (!data || typeof data !== 'object') return [];

  const record = data as Record<string, unknown>;
  const items = record.inventory ?? record.lootdb;
  return Array.isArray(items) ? (items as LootDBItem[]) : [];
}

/** Load bundled inventory catalog from public/inventory/catalog.json, with seed fallback. */
export async function fetchInventoryCatalogItems(
  idFactory: () => string,
): Promise<LootDBItem[]> {
  try {
    const url = new URL('inventory/catalog.json', import.meta.env.BASE_URL).toString();
    const response = await fetch(url);
    if (response.ok) {
      const payload = await response.json();
      const items = normalizeInventoryPayload(payload);
      if (items.length > 0) return items;
    }
  } catch {
    // Fall back to built-in seed below.
  }

  return buildInventoryCatalogSeedItems(idFactory);
}
