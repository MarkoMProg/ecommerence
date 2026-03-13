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

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '..', '.env') });

const EMAIL = 'k6-loadtest@loadtest.invalid';
const PASSWORD = 'LoadTest1!';
const NAME = 'k6 Load Test';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  // Remove existing test user if present
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

  await pool.query(
    `INSERT INTO "user" (id, name, email, email_verified, created_at, updated_at)
     VALUES ($1, $2, $3, true, $4, $4)`,
    [userId, NAME, EMAIL, now],
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
