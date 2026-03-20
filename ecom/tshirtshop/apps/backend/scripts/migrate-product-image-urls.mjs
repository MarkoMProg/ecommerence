#!/usr/bin/env node
/**
 * Rewrite product_image.image_url from /products/... to /uploads/products/...
 * after moving static files to apps/backend/public/uploads/products/.
 *
 *   npm run db:migrate-product-image-urls --workspace=backend
 *   node scripts/migrate-product-image-urls.mjs --dry-run
 */
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
const backendDir = resolve(__dirname, '..');
config({ path: resolve(backendDir, '.env') });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('Error: DATABASE_URL not set in apps/backend/.env');
  process.exit(1);
}

const dryRun = process.argv.includes('--dry-run');

async function main() {
  const pool = new pg.Pool({ connectionString: DATABASE_URL });
  try {
    const { rowCount } = await pool.query(
      `SELECT id FROM product_image WHERE image_url LIKE '/products/%'`,
    );
    const n = rowCount ?? 0;
    if (dryRun) {
      console.log(`[migrate-product-image-urls] dry-run: ${n} row(s) would be updated.`);
      return;
    }
    const result = await pool.query(
      `UPDATE product_image
       SET image_url = '/uploads' || image_url
       WHERE image_url LIKE '/products/%'`,
    );
    console.log(
      `[migrate-product-image-urls] updated ${result.rowCount ?? 0} image row(s) (/products/… → /uploads/products/…).`,
    );
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
