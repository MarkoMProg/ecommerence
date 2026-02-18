#!/usr/bin/env node
/**
 * Seed script for catalog data.
 * Run: npm run db:seed (from apps/backend)
 *
 * Idempotent: clears existing catalog data and re-inserts.
 */
import { config } from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
const backendDir = resolve(__dirname, '..');
config({ path: resolve(backendDir, '.env') });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('Error: DATABASE_URL not set. Add it to apps/backend/.env');
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: DATABASE_URL });

const CATEGORIES = [
  { id: '1', name: 'T-Shirts', slug: 't-shirts' },
  { id: '2', name: 'Hoodies', slug: 'hoodies' },
  { id: '3', name: 'Hats', slug: 'hats' },
  { id: '4', name: 'Accessories', slug: 'accessories' },
  { id: '5', name: 'Posters', slug: 'posters' },
];

const PRODUCTS = [
  {
    id: '1',
    name: 'Infernal D20 Tee',
    description:
      'Premium cotton tee featuring the iconic D20. Minimal design for tabletop adventurers.',
    priceCents: 4800,
    categoryId: '1',
    brand: 'Darkloom',
    imageUrl: 'https://placehold.co/600x600/1a1a1a/ffffff?text=Infernal+D20',
  },
  {
    id: '2',
    name: 'Shadow Realm Hoodie',
    description: 'Heavyweight hoodie for those who walk between realms. Oversized fit.',
    priceCents: 9800,
    categoryId: '2',
    brand: 'Darkloom',
    imageUrl: 'https://placehold.co/600x600/1a1a1a/ffffff?text=Shadow+Realm',
  },
  {
    id: '3',
    name: 'Arcane Script Cap',
    description: 'Structured cap with embroidered arcane runes. One size fits most.',
    priceCents: 3800,
    categoryId: '3',
    brand: 'Darkloom',
    imageUrl: 'https://placehold.co/600x600/1a1a1a/ffffff?text=Arcane+Cap',
  },
  {
    id: '4',
    name: 'Dragon Scale Tee',
    description: 'Limited edition tee with dragon scale pattern. Built for the table and the street.',
    priceCents: 5200,
    categoryId: '1',
    brand: 'Darkloom',
    imageUrl: 'https://placehold.co/600x600/1a1a1a/ffffff?text=Dragon+Scale',
  },
  {
    id: '5',
    name: 'Void Walker Hoodie',
    description: 'Dark academia meets streetwear. Premium fleece, minimal branding.',
    priceCents: 10800,
    categoryId: '2',
    brand: 'Darkloom',
    imageUrl: 'https://placehold.co/600x600/1a1a1a/ffffff?text=Void+Walker',
  },
  {
    id: '6',
    name: 'Critical Hit Poster',
    description: 'Screen-printed poster. 18x24 inches. Limited run.',
    priceCents: 2800,
    categoryId: '5',
    brand: 'Darkloom',
    imageUrl: 'https://placehold.co/600x600/1a1a1a/ffffff?text=Critical+Hit',
  },
];

async function seed() {
  console.log('[seed] Starting...');
  const client = await pool.connect();

  try {
    // Clear in FK order
    await client.query('DELETE FROM product_image');
    await client.query('DELETE FROM product');
    await client.query('DELETE FROM category');

    console.log('[seed] Inserting categories...');
    for (const c of CATEGORIES) {
      await client.query(
        `INSERT INTO category (id, name, slug, parent_category_id, created_at)
         VALUES ($1, $2, $3, NULL, NOW())`,
        [c.id, c.name, c.slug],
      );
    }

    console.log('[seed] Inserting products...');
    for (const p of PRODUCTS) {
      await client.query(
        `INSERT INTO product (id, name, description, price_cents, stock_quantity, category_id, brand,
          weight_metric, weight_imperial, dimension_metric, dimension_imperial, created_at, updated_at)
         VALUES ($1, $2, $3, $4, 50, $5, $6, NULL, NULL, NULL, NULL, NOW(), NOW())`,
        [p.id, p.name, p.description, p.priceCents, p.categoryId, p.brand],
      );
      await client.query(
        `INSERT INTO product_image (id, product_id, image_url, is_primary)
         VALUES ($1, $2, $3, true)`,
        [`${p.id}-img-1`, p.id, p.imageUrl],
      );
    }

    console.log(
      '[seed] Done. Inserted',
      CATEGORIES.length,
      'categories and',
      PRODUCTS.length,
      'products.',
    );
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error('[seed] Error:', err);
  process.exit(1);
});
