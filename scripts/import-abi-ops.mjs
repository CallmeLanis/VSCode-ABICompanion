import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sourcePath = process.argv[2] || 'C:/Users/Heerschel/Downloads/abi-ops-1786476531888.json';

const mem = new Map();
globalThis.localStorage = {
  getItem: (k) => mem.get(k) ?? null,
  setItem: (k, v) => mem.set(k, v),
  removeItem: (k) => mem.delete(k),
  clear: () => mem.clear(),
  key: () => null,
  length: 0,
};

const { mergeImportedData } = await import('../src/utils/dataMerge.ts');
const data = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));

console.log(`Source raids: ${data.raids?.length ?? 0}`);

const result = mergeImportedData(data);
await new Promise((resolve) => setTimeout(resolve, 200));

const raids = JSON.parse(mem.get('abi_raids') || '[]');

console.log('Merge result:', {
  success: result.success,
  summary: result.summary,
  errorCount: result.errors.length,
  firstErrors: result.errors.slice(0, 5),
  storedRaids: raids.length,
});

if (process.argv.includes('--write')) {
  const outPath = path.join(__dirname, '../public/import/abi-ops-merged.json');
  fs.writeFileSync(outPath, JSON.stringify({ raids }, null, 2));
  console.log(`Wrote ${raids.length} raids to ${outPath}`);
}
