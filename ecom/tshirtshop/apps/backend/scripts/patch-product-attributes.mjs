#!/usr/bin/env node
/**
 * One-time patch: updates product attribute columns for all existing products.
 * Safe to re-run — uses UPDATE by id, no deletes, no inserts.
 */
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env') });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const client = await pool.connect();

const updates = [
  {
    id: '1',
    name: 'Infernal D20 Tee',
    sizeOptions: 'XS,S,M,L,XL,2XL',
    material: '100% combed cotton, 320gsm',
    fit: 'True to size',
    careInstructions: 'Machine wash cold. Tumble dry low. Do not bleach.',
    orientation: null,
    framingInfo: null,
    dimensionMetric: null,
  },
  {
    id: '2',
    name: 'Shadow Realm Hoodie',
    sizeOptions: 'XS,S,M,L,XL,2XL',
    material: '80% cotton, 20% polyester fleece, 480gsm',
    fit: 'Oversized',
    careInstructions: 'Machine wash cold. Hang to dry. Do not tumble dry.',
    orientation: null,
    framingInfo: null,
    dimensionMetric: null,
  },
  {
    id: '3',
    name: 'Arcane Script Cap',
    sizeOptions: null,
    material: '100% chino cotton twill',
    fit: 'One size fits most. Adjustable strap.',
    careInstructions: 'Spot clean only.',
    orientation: null,
    framingInfo: null,
    dimensionMetric: null,
  },
  {
    id: '4',
    name: 'Dragon Scale Tee',
    sizeOptions: 'XS,S,M,L,XL,2XL',
    material: '100% combed cotton, 320gsm',
    fit: 'True to size',
    careInstructions: 'Machine wash cold inside out. Hang to dry.',
    orientation: null,
    framingInfo: null,
    dimensionMetric: null,
  },
  {
    id: '5',
    name: 'Void Walker Hoodie',
    sizeOptions: 'XS,S,M,L,XL,2XL',
    material: '80% cotton, 20% polyester fleece, 480gsm',
    fit: 'Relaxed oversized',
    careInstructions: 'Machine wash cold. Hang to dry. Do not tumble dry.',
    orientation: null,
    framingInfo: null,
    dimensionMetric: null,
  },
  {
    id: '6',
    name: 'Critical Hit Poster',
    sizeOptions: null,
    material: 'Heavy matte archival paper, 300gsm',
    fit: null,
    careInstructions: null,
    orientation: 'Portrait',
    framingInfo: 'Ships unframed, rolled in protective tube',
    dimensionMetric: '45 × 60 cm (18 × 24 in)',
  },
  {
    id: 'free-checkout-test',
    name: 'Free Checkout Test Item',
    sizeOptions: 'S,M,L',
    material: '100% cotton',
    fit: 'True to size',
    careInstructions: null,
    orientation: null,
    framingInfo: null,
    dimensionMetric: null,
  },
];

console.log('[patch] Updating product attributes...\n');

for (const p of updates) {
  await client.query(
    `UPDATE product SET
       size_options       = $1,
       material           = $2,
       fit                = $3,
       care_instructions  = $4,
       orientation        = $5,
       framing_info       = $6,
       dimension_metric   = $7,
       updated_at         = NOW()
     WHERE id = $8`,
    [
      p.sizeOptions,
      p.material,
      p.fit,
      p.careInstructions,
      p.orientation,
      p.framingInfo,
      p.dimensionMetric,
      p.id,
    ],
  );
  console.log(`  ✓  [${p.id}] ${p.name}`);
}

console.log('\n[patch] Done.\n');
client.release();
await pool.end();
