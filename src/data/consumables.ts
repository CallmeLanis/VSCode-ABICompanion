/** Shared medic / grenade subtype catalogs for LootDB + Mission Debrief pickers. */

export const MEDIC_SUBTYPE_OPTIONS = [
  { value: 'medicine', label: 'Medicine' },
  { value: 'medkits', label: 'Medkits' },
  { value: 'treatments', label: 'Treatments' },
  { value: 'stimulants', label: 'Stimulants' },
] as const;

export const GRENADE_SUBTYPE_OPTIONS = [
  { value: 'defend', label: 'Defend' },
  { value: 'blast', label: 'Blast' },
] as const;

export const MEDIC_SUBTYPE_ORDER = MEDIC_SUBTYPE_OPTIONS.map((o) => o.value);
export const GRENADE_SUBTYPE_ORDER = GRENADE_SUBTYPE_OPTIONS.map((o) => o.value);

export type MedicSubtype = (typeof MEDIC_SUBTYPE_OPTIONS)[number]['value'];
export type GrenadeSubtype = (typeof GRENADE_SUBTYPE_OPTIONS)[number]['value'];
export type ConsumableFamily = 'medic' | 'grenade';

const MEDIC_LABELS: Record<string, string> = Object.fromEntries(
  MEDIC_SUBTYPE_OPTIONS.map((o) => [o.value, o.label]),
);

const GRENADE_LABELS: Record<string, string> = Object.fromEntries(
  GRENADE_SUBTYPE_OPTIONS.map((o) => [o.value, o.label]),
);

export function getConsumableGroupLabel(key: string): string {
  return MEDIC_LABELS[key] || GRENADE_LABELS[key] || key;
}

export function getConsumableGroupKey(
  item: { type?: string; subtype?: string },
): string {
  const subtype = (item.subtype || '').trim();
  if (subtype) return subtype;
  return item.type === 'grenade' ? 'defend' : 'medicine';
}

/** Quick-add unit presets per family (left-click add / right-click subtract). */
export const CONSUMABLE_UNIT_PRESETS: Record<ConsumableFamily, readonly number[]> = {
  medic: [1, 2, 3, 5],
  grenade: [1, 2, 3],
};
