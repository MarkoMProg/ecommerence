#!/usr/bin/env node
/**
 * Migration: add stripe_customer_id column to user table (BILL-001).
 * Safe to run multiple times — uses IF NOT EXISTS / DO $$.
 * Run: node scripts/db-add-stripe-customer-id.mjs  (from apps/backend/)
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
      ALTER TABLE "user"
        ADD COLUMN IF NOT EXISTS "stripe_customer_id" text
    `);
    console.log('[db-add-stripe-customer-id] stripe_customer_id column ready on user table.');
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((e) => {
  console.error('[db-add-stripe-customer-id] Failed:', e.message);
  process.exit(1);
});
