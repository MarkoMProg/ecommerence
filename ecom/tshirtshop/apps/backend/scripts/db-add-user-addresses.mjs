#!/usr/bin/env node
/**
 * Migration: create user_address table (ADDR-001).
 * Safe to run multiple times — all statements use IF NOT EXISTS / IF EXISTS.
 * Run: node scripts/db-add-user-addresses.mjs  (from apps/backend/)
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
      CREATE TABLE IF NOT EXISTS "user_address" (
        "id"                  text        PRIMARY KEY NOT NULL,
        "user_id"             text        NOT NULL,
        "label"               text        NOT NULL DEFAULT 'Home',
        "full_name"           text        NOT NULL,
        "phone"               text,
        "line1"               text        NOT NULL,
        "line2"               text,
        "city"                text        NOT NULL,
        "state_or_region"     text        NOT NULL,
        "postal_code"         text        NOT NULL,
        "country"             text        NOT NULL,
        "is_default_shipping" boolean     NOT NULL DEFAULT false,
        "is_default_billing"  boolean     NOT NULL DEFAULT false,
        "created_at"          timestamp   NOT NULL DEFAULT now(),
        "updated_at"          timestamp   NOT NULL DEFAULT now()
      )
    `);

    // Add FK if it doesn't already exist
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_name = 'user_address_user_id_user_id_fk'
            AND table_name = 'user_address'
        ) THEN
          ALTER TABLE "user_address"
            ADD CONSTRAINT "user_address_user_id_user_id_fk"
            FOREIGN KEY ("user_id") REFERENCES "user"("id")
            ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;
      END$$
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS "user_address_userId_idx"
        ON "user_address" ("user_id")
    `);

    console.log('[db-add-user-addresses] user_address table ready.');
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((e) => {
  console.error('[db-add-user-addresses] Failed:', e.message);
  process.exit(1);
});
