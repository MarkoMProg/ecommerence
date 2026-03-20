/**
 * Creates (or resets) a dedicated load-test user using BetterAuth's own
 * hashPassword function so the credentials always work.
 *
 * Run: node scripts/create-load-test-user.mjs
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

const EMAIL = 'k6-loadtest@loadtest.invalid';
const PASSWORD = 'LoadTest1!';
const NAME = 'k6 Load Test';

// Encrypt a value with AES-256-GCM using ENCRYPTION_KEY from .env
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

// Deterministic HMAC-SHA256 blind index using BLIND_INDEX_SECRET from .env
function blindIndex(value) {
  return createHmac('sha256', process.env.BLIND_INDEX_SECRET)
    .update(value.toLowerCase().trim())
    .digest('hex');
}

// BetterAuth stores the blind index as a valid email-format string in the email column
function blindEmail(value) {
  return `${blindIndex(value)}@blind.index`;
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  // Remove existing test user if present (match on email column)
  const existing = await pool.query(`SELECT id FROM "user" WHERE email = $1`, [
    EMAIL,
  ]);
  if (existing.rows.length > 0) {
    await pool.query(`DELETE FROM "user" WHERE email = $1`, [EMAIL]);
    console.log('Removed existing test user.');
  }

  const userId = generateId();
  const accountId = generateId();
  const hashedPassword = await hashPassword(PASSWORD);
  const now = new Date();

  const emailEncrypted = encrypt(EMAIL);
  const emailIndex = blindIndex(EMAIL);
  // BetterAuth looks users up by blind-index email, not plain email
  const emailForDb = blindEmail(EMAIL);
  const nameEncrypted = encrypt(NAME);

  await pool.query(
    `INSERT INTO "user" (id, name, email, email_encrypted, email_index, email_verified, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, true, $6, $6)`,
    [userId, nameEncrypted, emailForDb, emailEncrypted, emailIndex, now],
  );

  await pool.query(
    `INSERT INTO account (id, account_id, provider_id, user_id, password, created_at, updated_at)
     VALUES ($1, $2, 'credential', $3, $4, $5, $5)`,
    [accountId, userId, userId, hashedPassword, now],
  );

  console.log('✓ Load test user created:');
  console.log(`  email   : ${EMAIL}`);
  console.log(`  password: ${PASSWORD}`);
  console.log(`  user id : ${userId}`);
}

await main().finally(() => pool.end());
