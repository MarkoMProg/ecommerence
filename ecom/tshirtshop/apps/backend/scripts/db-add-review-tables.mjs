#!/usr/bin/env node
/**
 * Migration: create review and review_helpful_vote tables (REV-001, REV-004).
 * Also adds the user_name column if the review table already exists without it.
 * Safe to run multiple times — all statements use IF NOT EXISTS / IF EXISTS.
 * Run: node scripts/db-add-review-tables.mjs  (from apps/backend/)
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
    // 1. Create the review table if it doesn't exist (includes user_name from the start)
    await client.query(`
      CREATE TABLE IF NOT EXISTS "review" (
        "id"            text      PRIMARY KEY NOT NULL,
        "product_id"    text      NOT NULL REFERENCES "product"("id") ON DELETE CASCADE,
        "user_id"       text      NOT NULL REFERENCES "user"("id")    ON DELETE CASCADE,
        "user_name"     text      NOT NULL,
        "rating"        integer   NOT NULL,
        "title"         text,
        "body"          text      NOT NULL,
        "helpful_count" integer   NOT NULL DEFAULT 0,
        "created_at"    timestamp NOT NULL DEFAULT now(),
        "updated_at"    timestamp NOT NULL DEFAULT now()
      )
    `);

    // 2. If the table already existed WITHOUT user_name, add it now
    await client.query(`
      ALTER TABLE "review"
        ADD COLUMN IF NOT EXISTS "user_name" text NOT NULL DEFAULT ''
    `);

    // 3. Unique index: one review per product per user
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "review_product_user_idx"
        ON "review" ("product_id", "user_id")
    `);

    console.log('[db-add-review-tables] review table ready.');

    // 4. Create the helpful-vote table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS "review_helpful_vote" (
        "id"         text      PRIMARY KEY NOT NULL,
        "review_id"  text      NOT NULL REFERENCES "review"("id") ON DELETE CASCADE,
        "user_id"    text      NOT NULL REFERENCES "user"("id")   ON DELETE CASCADE,
        "created_at" timestamp NOT NULL DEFAULT now()
      )
    `);

    // 5. Unique index: one vote per review per user
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "review_helpful_vote_review_user_idx"
        ON "review_helpful_vote" ("review_id", "user_id")
    `);

    console.log('[db-add-review-tables] review_helpful_vote table ready.');
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((e) => {
  console.error('[db-add-review-tables] Failed:', e.message);
  process.exit(1);
});
