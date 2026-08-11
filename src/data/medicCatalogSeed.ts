import type { LootDBItem } from '../types';
import { LOOT_CONTACT_LABEL } from './constants';

/** Catalog seed for Mission Debrief consumables picker (medic family). */
type MedicSeedRow = {
  name: string;
  subtype: 'medicine' | 'medkits' | 'treatments' | 'stimulants';
  vendorPrice: number;
};

const MEDIC_SUBTYPE_CATEGORY: Record<MedicSeedRow['subtype'], string> = {
  medicine: 'Medicine',
  medkits: 'Medkits',
  treatments: 'Treatments',
  stimulants: 'Stimulants',
};

const MEDIC_SEED_ROWS: MedicSeedRow[] = [
  { name: 'STO Meds', subtype: 'medkits', vendorPrice: 81400 },
  { name: '12x Sur Kit', subtype: 'treatments', vendorPrice: 73440 },
  { name: 'EX Painkiller', subtype: 'medicine', vendorPrice: 57138 },
  { name: 'TMK Meds', subtype: 'medkits', vendorPrice: 51282 },
  { name: '100D Meds', subtype: 'medkits', vendorPrice: 40320 },
  { name: '8x Sur Kit', subtype: 'treatments', vendorPrice: 36288 },
  { name: 'AP Painkiller', subtype: 'medicine', vendorPrice: 28840 },
  { name: 'Nebulizer', subtype: 'treatments', vendorPrice: 26433 },
  { name: '4x Sur Kit', subtype: 'treatments', vendorPrice: 23040 },
  { name: 'Regeneration Stim', subtype: 'stimulants', vendorPrice: 21000 },
  { name: 'Endurance Stim', subtype: 'stimulants', vendorPrice: 15330 },
  { name: 'Blue Painkiller', subtype: 'medicine', vendorPrice: 13700 },
  { name: 'E3 Meds', subtype: 'medkits', vendorPrice: 12240 },
  { name: '926 Meds', subtype: 'medkits', vendorPrice: 7600 },
  { name: 'Strength Stim', subtype: 'stimulants', vendorPrice: 6900 },
  { name: 'Simple Sur Kit', subtype: 'treatments', vendorPrice: 2500 },
  { name: 'Liquid Painkiller', subtype: 'medicine', vendorPrice: 2200 },
  { name: 'OPM Bandage', subtype: 'treatments', vendorPrice: 2000 },
  { name: 'Standard Meds', subtype: 'medkits', vendorPrice: 1920 },
  { name: 'Energy Drink', subtype: 'medicine', vendorPrice: 1818 },
  { name: 'Simple Meds', subtype: 'medkits', vendorPrice: 1302 },
  { name: 'Red Painkiller', subtype: 'medicine', vendorPrice: 1000 },
  { name: 'Field Bandage', subtype: 'treatments', vendorPrice: 736 },
  { name: 'Quick Bandage', subtype: 'treatments', vendorPrice: 246 },
];

export function buildMedicCatalogSeedItems(
  idFactory: () => string = () => `medic-seed-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
): LootDBItem[] {
  return MEDIC_SEED_ROWS.map((row) => ({
    id: idFactory(),
    name: row.name,
    category: MEDIC_SUBTYPE_CATEGORY[row.subtype],
    rarity: 'common',
    type: 'medic',
    subtype: row.subtype,
    marketPrice: 0,
    vendorPrices: [{ vendor: LOOT_CONTACT_LABEL, price: row.vendorPrice }],
    lowestPrice: 0,
    lowestPriceHistory: [],
    bestSellTo: LOOT_CONTACT_LABEL,
  }));
}

export const MEDIC_CATALOG_SEED_COUNT = MEDIC_SEED_ROWS.length;
