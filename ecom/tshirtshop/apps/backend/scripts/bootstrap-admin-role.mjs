#!/usr/bin/env node
/**
 * Bootstrap admin role for users in ADMIN_EMAILS (ADM-001).
 * Run: npm run db:bootstrap-admin (from apps/backend)
 *
 * Sets role='admin' for users whose email is in ADMIN_EMAILS.
 * Idempotent: safe to run multiple times.
 */
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
const backendDir = resolve(__dirname, '..');
config({ path: resolve(backendDir, '.env') });

const DATABASE_URL = process.env.DATABASE_URL;
const ADMIN_EMAILS = process.env.ADMIN_EMAILS ?? '';

if (!DATABASE_URL) {
  console.error('Error: DATABASE_URL not set. Add it to apps/backend/.env');
  process.exit(1);
}

const emails = ADMIN_EMAILS.split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

if (emails.length === 0) {
  console.log('ADMIN_EMAILS is empty. No users to promote. Add emails to .env and run again.');
  process.exit(0);
}

const pool = new pg.Pool({ connectionString: DATABASE_URL });

async function main() {
  try {
    const result = await pool.query(
      `UPDATE "user" SET role = 'admin' WHERE LOWER(email) = ANY($1::text[]) RETURNING id, email`,
      [emails],
    );
    if (result.rowCount > 0) {
      console.log(`Promoted ${result.rowCount} user(s) to admin:`, result.rows.map((r) => r.email).join(', '));
    } else {
      console.log('No matching users found. Ensure users exist and emails match ADMIN_EMAILS.');
    }
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
