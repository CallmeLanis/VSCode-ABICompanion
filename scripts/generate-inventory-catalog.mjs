import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const CONTACT = 'CONTACT';

const medicRows = [
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

const grenadeRows = [
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

const medicCategory = {
  medicine: 'Medicine',
  medkits: 'Medkits',
  treatments: 'Treatments',
  stimulants: 'Stimulants',
};

const grenadeCategory = {
  defend: 'Defend',
  blast: 'Blast',
};

const inventory = [
  ...medicRows.map((row, index) => ({
    id: `inventory-catalog-${String(index).padStart(3, '0')}`,
    name: row.name,
    category: medicCategory[row.subtype],
    rarity: 'common',
    type: 'medic',
    subtype: row.subtype,
    marketPrice: 0,
    vendorPrices: [{ vendor: CONTACT, price: row.vendorPrice }],
    lowestPrice: 0,
    lowestPriceHistory: [],
    bestSellTo: CONTACT,
  })),
  ...grenadeRows.map((row, index) => ({
    id: `inventory-catalog-${String(medicRows.length + index).padStart(3, '0')}`,
    name: row.name,
    category: grenadeCategory[row.subtype],
    rarity: 'common',
    type: 'grenade',
    subtype: row.subtype,
    marketPrice: row.marketPrice,
    vendorPrices: [{ vendor: CONTACT, price: row.vendorPrice }],
    lowestPrice: 0,
    lowestPriceHistory: [],
    bestSellTo: row.marketPrice > 0 ? 'Market' : CONTACT,
  })),
];

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'public', 'inventory');
mkdirSync(outDir, { recursive: true });

writeFileSync(
  join(outDir, 'catalog.json'),
  JSON.stringify(
    {
      inventory,
      source: 'abi-companion-inventory',
      exportedAt: new Date().toISOString(),
    },
    null,
    2,
  ),
);

console.log(`Wrote ${inventory.length} inventory catalog items.`);
