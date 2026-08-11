import { LOOT_CONTACT_LABEL } from '../data/constants';
import type { LootDBItem } from '../types';

const LEGACY_CONTACT_VENDOR_NAMES = new Set([
  'vendor',
  'doc',
  'arms dealer',
  'quartermaster',
  'black market',
]);

function normalizeBestSellTo(value: string | undefined): string {
  if (!value?.trim()) return value ?? '';
  const lower = value.trim().toLowerCase();
  if (lower === 'vendor' || LEGACY_CONTACT_VENDOR_NAMES.has(lower)) {
    return LOOT_CONTACT_LABEL;
  }
  return value;
}

/** Normalize legacy LootDB rows (vendor caption, contact label, vendor prices). */
export function normalizeLootDBItem(item: LootDBItem): LootDBItem {
  const vendorPrices = item.vendorPrices.map((entry) => ({
    ...entry,
    vendor: LOOT_CONTACT_LABEL,
  }));
  const bestSellTo = normalizeBestSellTo(item.bestSellTo);

  const vendorsUnchanged = item.vendorPrices.every(
    (entry, index) =>
      entry.vendor === vendorPrices[index]?.vendor
      && entry.price === vendorPrices[index]?.price,
  );

  if (vendorsUnchanged && bestSellTo === item.bestSellTo) {
    return item;
  }

  return {
    ...item,
    vendorPrices,
    bestSellTo,
  };
}

export function normalizeLootDBItems(items: LootDBItem[]): {
  items: LootDBItem[];
  changed: boolean;
} {
  let changed = false;
  const next = items.map((item) => {
    const normalized = normalizeLootDBItem(item);
    if (JSON.stringify(normalized) !== JSON.stringify(item)) {
      changed = true;
    }
    return normalized;
  });
  return { items: next, changed };
}
