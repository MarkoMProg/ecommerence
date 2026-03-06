#!/usr/bin/env node
/**
 * One-off: Add missing columns (slug on product, alt_text on product_image).
 * Run if schema was updated but migrations weren't applied.
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

async function run() {
  const client = await pool.connect();
  try {
    await client.query('ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "slug" text');
    await client.query(`
      UPDATE "product"
      SET "slug" = LOWER(
        REGEXP_REPLACE(
          REGEXP_REPLACE(TRIM("name"), '[^a-zA-Z0-9]+', '-', 'g'),
          '^-+|-+$', '', 'g'
        )
      ) || '-' || SUBSTRING("id" FROM 1 FOR 6)
      WHERE "slug" IS NULL
    `);
    await client.query('ALTER TABLE "product" ALTER COLUMN "slug" SET NOT NULL');
    await client.query('CREATE UNIQUE INDEX IF NOT EXISTS "product_slug_unique" ON "product" ("slug")');
    await client.query('ALTER TABLE "product_image" ADD COLUMN IF NOT EXISTS "alt_text" text');
    console.log('[db-add-slug] Missing columns (product.slug, product_image.alt_text) added.');
  } catch (e) {
    if (e.code === '42701') {
      console.log('[db-add-slug] Slug column/index already exists, skipping.');
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
