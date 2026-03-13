/**
 * Boosts stock on all non-archived products to 10 000 units for load testing.
 * Safe to run multiple times. Does NOT affect archived or zero-stock products
 * that were intentionally set to 0 (those are boosted too since we need them
 * reachable in tests — adjust the WHERE clause if needed).
 *
 * Run: node scripts/boost-stock-for-load-test.mjs
 */
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '..', '.env') });

const LOAD_TEST_STOCK = 10000;

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const result = await pool.query(
  `UPDATE product SET stock_quantity = $1 WHERE is_archived = false RETURNING id, name, stock_quantity`,
  [LOAD_TEST_STOCK],
);

console.log(
  `✓ Boosted stock to ${LOAD_TEST_STOCK} for ${result.rowCount} product(s):`,
);
result.rows.forEach((r) =>
  console.log(`  [${r.id}] ${r.name} → ${r.stock_quantity}`),
);

await pool.end();
