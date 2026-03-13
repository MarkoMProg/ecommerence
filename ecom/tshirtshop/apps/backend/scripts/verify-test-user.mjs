/**
 * Marks a test user's email as verified in the database.
 * Usage: node scripts/verify-test-user.mjs testuser@gmail.com
 */
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '..', '.env') });

const email = process.argv[2];
if (!email) {
  console.error('Usage: node scripts/verify-test-user.mjs <email>');
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const result = await pool.query(
  `UPDATE "user" SET email_verified = true WHERE email = $1 RETURNING id, email, email_verified`,
  [email],
);

if (result.rowCount === 0) {
  console.error(`No user found with email: ${email}`);
  await pool.end();
  process.exit(1);
}

console.log(`✓ Email verified for:`, result.rows[0]);
await pool.end();
