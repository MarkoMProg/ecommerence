#!/usr/bin/env node
/**
 * One-off: Delete manual_refresh_token rows whose user_id no longer exists.
 * Run: node scripts/clean-orphaned-refresh-tokens.mjs
 */
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '..', '.env') });

if (!process.env.DATABASE_URL) {
  console.error('Error: DATABASE_URL not set.');
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const sql = `DELETE FROM manual_refresh_token WHERE user_id NOT IN (SELECT id FROM "user")`;

pool
  .query(sql)
  .then((r) => {
    console.log('Deleted', r.rowCount, 'orphaned row(s)');
    pool.end();
  })
  .catch((e) => {
    console.error(e.message);
    pool.end();
    process.exit(1);
  });
