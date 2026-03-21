#!/usr/bin/env node
/**
 * Build products-bulk-import.json from public/uploads/products/{tshirts,misc,Posters}/<product name>/*,
 * then sync the database via populate-products-from-json (same inventory as on-disk assets).
 * Image URLs are /uploads/products/... (served by the Nest static /uploads mount).
 *
 * Run: npm run generate:products-bulk --workspace=backend
 * JSON only (no DB): node scripts/generate-products-bulk-import.mjs --json-only
 * Dry-run DB sync:    node scripts/generate-products-bulk-import.mjs --dry-run
 *
 * categoryId values match apps/backend/scripts/seed.mjs (run db:seed or ensure same IDs exist).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';
import { buildRichDescription } from './build-product-description.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendDir = path.resolve(__dirname, '..');
const productsRoot = path.join(backendDir, 'public', 'uploads', 'products');

const argv = process.argv.slice(2);
const jsonOnly = argv.includes('--json-only');
const dryRun = argv.includes('--dry-run');

/** Top-level folder under public/products → seed category id */
const CATEGORY_MAP = {
  tshirts: { categoryId: '1' },
  misc: { categoryId: '4' },
  Posters: { categoryId: '5' },
};

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif']);

function sortImageFiles(a, b) {
  const rank = (name) => {
    if (name.includes('il_1140xN')) return 0;
    if (name.includes('il_794xN')) return 1;
    if (name.includes('il_300xN')) return 10;
    return 5;
  };
  const d = rank(a) - rank(b);
  if (d !== 0) return d;
  return a.localeCompare(b);
}

if (fs.existsSync(productsRoot)) {
  for (const ent of fs.readdirSync(productsRoot, { withFileTypes: true })) {
    if (!ent.isDirectory()) continue;
    if (!Object.prototype.hasOwnProperty.call(CATEGORY_MAP, ent.name)) {
      console.warn(
        `No CATEGORY_MAP entry for folder "${ent.name}" — add mapping and re-run to include those products`,
      );
    }
  }
}

const products = [];

for (const [folder, meta] of Object.entries(CATEGORY_MAP)) {
  const catPath = path.join(productsRoot, folder);
  if (!fs.existsSync(catPath)) {
    console.warn(`Skip missing folder: ${catPath}`);
    continue;
  }
  const entries = fs.readdirSync(catPath, { withFileTypes: true });
  for (const ent of entries) {
    if (!ent.isDirectory()) continue;
    const productName = ent.name;
    const dir = path.join(catPath, productName);
    const files = fs.readdirSync(dir).filter((f) => {
      const ext = path.extname(f).toLowerCase();
      return IMAGE_EXT.has(ext);
    });
    files.sort(sortImageFiles);
    const images = files.map((f) => ({
      url: `/uploads/products/${folder}/${productName}/${f}`.replace(/\\/g, '/'),
    }));
    const row = {
      name: productName,
      description: buildRichDescription(productName, meta.categoryId),
      priceCents: folder === 'Posters' ? 2800 : folder === 'misc' ? 4200 : 4800,
      stockQuantity: 10,
      categoryId: meta.categoryId,
      brand: 'Darkloom',
      images,
    };
    if (folder === 'tshirts') {
      row.sizeOptions = 'XS,S,M,L,XL,2XL';
      row.material = 'See product listing for fabric details.';
      row.fit = 'True to size';
      row.careInstructions =
        'Machine wash cold. Tumble dry low unless label says otherwise.';
    }
    if (folder === 'Posters') {
      row.orientation = 'Portrait';
      row.framingInfo = 'Ships unframed, rolled in protective tube';
      row.material =
        'Heavy matte archival paper (details may vary by print)';
    }
    if (folder === 'misc') {
      row.material = 'Varies — see images and vendor details.';
    }
    products.push(row);
  }
}

products.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

const outPath = path.join(productsRoot, 'products-bulk-import.json');
fs.writeFileSync(outPath, `${JSON.stringify(products, null, 2)}\n`, 'utf8');
console.log(`Wrote ${products.length} products to ${outPath}`);

if (!jsonOnly) {
  const spawnArgs = [path.join(__dirname, 'populate-products-from-json.mjs')];
  if (dryRun) spawnArgs.push('--dry-run');
  const r = spawnSync(process.execPath, spawnArgs, {
    cwd: backendDir,
    stdio: 'inherit',
    env: process.env,
  });
  if (r.error) throw r.error;
  if (r.status !== 0) process.exit(r.status ?? 1);
}
