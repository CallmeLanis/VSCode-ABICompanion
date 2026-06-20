import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const out = path.join(__dirname, '..', 'dist', '.nojekyll');
try {
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, '');
  console.log('Wrote', out);
} catch (err) {
  console.error('Failed to write .nojekyll:', err);
  process.exit(1);
}
