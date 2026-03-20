#!/usr/bin/env node
/**
 * Build products-bulk-import.json from public/products/{tshirts,misc,Posters}/<product name>/*.
 * Each immediate subfolder name becomes the product name; all image files in that folder are attached.
 *
 * Run from repo: npm run generate:products-bulk --workspace=web
 *
 * categoryId values match apps/backend/scripts/seed.mjs (run db:seed or ensure same IDs exist).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildRichDescription } from '../../../apps/backend/scripts/build-product-description.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(__dirname, '..');
const productsRoot = path.join(webRoot, 'public', 'products');

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
      url: `/products/${folder}/${productName}/${f}`.replace(/\\/g, '/'),
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
