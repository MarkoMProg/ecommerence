#!/usr/bin/env node
/**
 * Creates (or resets) an admin user directly in the database.
 * Reads credentials from env vars: ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME.
 *
 * Run: node scripts/create-admin-user.mjs
 */
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import { hashPassword } from 'better-auth/crypto';
import { generateId } from 'better-auth';
import { createCipheriv, createHmac, randomBytes } from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '..', '.env') });

const EMAIL = process.env.ADMIN_EMAIL;
const PASSWORD = process.env.ADMIN_PASSWORD;
const NAME = process.env.ADMIN_NAME ?? 'Admin';

if (!EMAIL || !PASSWORD) {
  console.error('Error: ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env / environment.');
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error('Error: DATABASE_URL not set.');
  process.exit(1);
}

if (!process.env.ENCRYPTION_KEY || !process.env.BLIND_INDEX_SECRET) {
  console.error('Error: ENCRYPTION_KEY and BLIND_INDEX_SECRET must be set.');
  process.exit(1);
}

function encrypt(value) {
  const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([
    cipher.update(value, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

function blindIndex(value) {
  return createHmac('sha256', process.env.BLIND_INDEX_SECRET)
    .update(value.toLowerCase().trim())
    .digest('hex');
}

function blindEmail(value) {
  return `${blindIndex(value)}@blind.index`;
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const emailForDb = blindEmail(EMAIL);

  // Remove existing admin user if present (idempotent)
  const existing = await pool.query(
    `SELECT id FROM "user" WHERE email = $1`,
    [emailForDb],
  );
  if (existing.rows.length > 0) {
    const existingId = existing.rows[0].id;
    await pool.query(`DELETE FROM account WHERE user_id = $1`, [existingId]);
    await pool.query(`DELETE FROM "user" WHERE id = $1`, [existingId]);
    console.log('Removed existing admin user.');
  }

  const userId = generateId();
  const accountId = generateId();
  const hashedPassword = await hashPassword(PASSWORD);
  const now = new Date();

  const emailEncrypted = encrypt(EMAIL);
  const emailIndex = blindIndex(EMAIL);
  const nameEncrypted = encrypt(NAME);

  await pool.query(
    `INSERT INTO "user" (id, name, email, email_encrypted, email_index, email_verified, role, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, true, 'admin', $6, $6)`,
    [userId, nameEncrypted, emailForDb, emailEncrypted, emailIndex, now],
  );

  await pool.query(
    `INSERT INTO account (id, account_id, provider_id, user_id, password, created_at, updated_at)
     VALUES ($1, $2, 'credential', $3, $4, $5, $5)`,
    [accountId, userId, userId, hashedPassword, now],
  );

  console.log('Admin user created:');
  console.log(`  email   : ${EMAIL}`);
  console.log(`  role    : admin`);
  console.log(`  user id : ${userId}`);
}

await main().finally(() => pool.end());
