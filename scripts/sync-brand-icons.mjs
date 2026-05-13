/**
 * Regenerates data/brand-icons-manifest.json from assets/media/brand icons/.
 *
 * Static sites cannot read folders in the browser — after adding or removing
 * logos, run from the repo root:
 *   node scripts/sync-brand-icons.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const BRAND_DIR = path.join(ROOT, 'assets', 'media', 'brand icons');
const OUT = path.join(ROOT, 'data', 'brand-icons-manifest.json');
const IMAGE_EXT = /\.(png|jpe?g|webp|gif|svg)$/i;

/** Web path from repo root; forward slashes only (no encoding — matches static img src usage). */
function pathToUrlFromRoot(absPath) {
  let rel = path.relative(ROOT, absPath);
  if (path.sep !== '/') {
    rel = rel.split(path.sep).join('/');
  }
  return rel;
}

function main() {
  if (!fs.existsSync(BRAND_DIR)) {
    console.error('Brand folder missing:', BRAND_DIR);
    process.exit(1);
  }
  const names = fs.readdirSync(BRAND_DIR);
  const icons = names
    .filter((n) => !n.startsWith('.') && IMAGE_EXT.test(n))
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base', numeric: true }))
    .map((n) => pathToUrlFromRoot(path.join(BRAND_DIR, n)));

  const payload = {
    generatedAt: new Date().toISOString(),
    icons,
  };
  fs.writeFileSync(OUT, JSON.stringify(payload, null, 2) + '\n', 'utf8');
  console.log(`Wrote ${icons.length} icon(s) -> ${path.relative(ROOT, OUT)}`);
}

main();
