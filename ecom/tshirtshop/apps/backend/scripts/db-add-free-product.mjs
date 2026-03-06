#!/usr/bin/env node
/**
 * Add a $0.00 product for testing checkout.
 * Run: npm run db:add-free-product (from apps/backend)
 */
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '..', '.env') });

if (!process.env.DATABASE_URL) {
  console.error('Error: DATABASE_URL not set');
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const PRODUCT = {
  id: 'free-checkout-test',
  name: 'Free Checkout Test Item',
  slug: 'free-checkout-test-item',
  description: 'Zero-cost item for testing the checkout flow. No payment required.',
  priceCents: 0,
  categoryId: '1',
  brand: 'Darkloom',
  imageUrl: 'https://placehold.co/600x600/1a1a1a/ffffff?text=Free+Test',
};

async function run() {
  const client = await pool.connect();
  try {
    await client.query(
      `INSERT INTO product (id, name, slug, description, price_cents, stock_quantity, category_id, brand,
        weight_metric, weight_imperial, dimension_metric, dimension_imperial, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, 50, $6, $7, NULL, NULL, NULL, NULL, NOW(), NOW())
       ON CONFLICT (id) DO NOTHING`,
      [
        PRODUCT.id,
        PRODUCT.name,
        PRODUCT.slug,
        PRODUCT.description,
        PRODUCT.priceCents,
        PRODUCT.categoryId,
        PRODUCT.brand,
      ],
    );
    await client.query(
      `INSERT INTO product_image (id, product_id, image_url, alt_text, is_primary)
       VALUES ($1, $2, $3, NULL, true)
       ON CONFLICT (id) DO NOTHING`,
      [`${PRODUCT.id}-img-1`, PRODUCT.id, PRODUCT.imageUrl],
    );
    console.log('[db-add-free-product] Added $0 product:', PRODUCT.slug);
  } catch (e) {
    if (e.code === '23505') {
      console.log('[db-add-free-product] Product already exists.');
    } else {
      throw e;
    }
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
