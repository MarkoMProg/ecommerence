#!/usr/bin/env node
/**
 * Migration: add is_archived column to product table.
 * Existing products default to false (not archived).
 * Safe to run multiple times — uses ADD COLUMN IF NOT EXISTS.
 * Run: node scripts/db-add-product-archived.mjs  (from apps/backend/)
 */
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '..', '.env') });

if (!process.env.DATABASE_URL) {
  console.error('Error: DATABASE_URL not set. Check apps/backend/.env');
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const client = await pool.connect();
  try {
    await client.query(`
      ALTER TABLE "product"
        ADD COLUMN IF NOT EXISTS "is_archived" boolean NOT NULL DEFAULT false
    `);
    console.log('[db-add-product-archived] is_archived column ready.');
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((e) => {
  console.error('[db-add-product-archived] Failed:', e.message);
  process.exit(1);
});
