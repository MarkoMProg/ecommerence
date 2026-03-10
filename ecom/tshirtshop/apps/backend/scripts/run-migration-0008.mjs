#!/usr/bin/env node
/**
 * Run migration 0008_add_order_refund_metadata.sql
 * Usage: node scripts/run-migration-0008.mjs
 */
import 'dotenv/config';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL not set. Set it in .env or pass as env var.');
    process.exit(1);
  }

  const sqlPath = join(__dirname, '../drizzle/0008_add_order_refund_metadata.sql');
  const sql = readFileSync(sqlPath, 'utf8');

  const client = new pg.Client({ connectionString: url });
  try {
    await client.connect();
    await client.query(sql);
    console.log('Migration 0008 applied successfully.');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
