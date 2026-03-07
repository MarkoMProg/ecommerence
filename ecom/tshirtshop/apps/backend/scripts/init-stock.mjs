#!/usr/bin/env node
/**
 * One-time script: set initial stock_quantity = 50 for any products
 * that currently have stock_quantity = 0 (i.e. were created before stock
 * management was added or were patched without touching stock).
 *
 * Safe to run multiple times — only updates rows where stock_quantity = 0.
 *
 * Usage (from apps/backend): node scripts/init-stock.mjs
 */
import { config } from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '..', '.env') });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('Error: DATABASE_URL not set. Add it to apps/backend/.env');
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: DATABASE_URL });

try {
  const client = await pool.connect();

  const { rows: before } = await client.query(
    'SELECT id, name, stock_quantity FROM product ORDER BY id',
  );

  console.log('[init-stock] Current stock levels:');
  for (const r of before) {
    console.log(`  [${r.id}] ${r.name} — stock_quantity: ${r.stock_quantity}`);
  }

  const zeroStock = before.filter((r) => r.stock_quantity === 0);
  if (zeroStock.length === 0) {
    console.log('\n[init-stock] All products already have stock > 0. Nothing to do.');
  } else {
    console.log(`\n[init-stock] Setting stock_quantity = 50 for ${zeroStock.length} product(s) with 0 stock...`);
    const result = await client.query(
      `UPDATE product SET stock_quantity = 50, updated_at = NOW() WHERE stock_quantity = 0`,
    );
    console.log(`[init-stock] Updated ${result.rowCount} product(s).`);
  }

  client.release();
  await pool.end();
  console.log('\n[init-stock] Done.');
} catch (err) {
  console.error('[init-stock] Error:', err.message);
  process.exit(1);
}
