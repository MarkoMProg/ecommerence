#!/usr/bin/env node
/**
 * Refresh product.description for storefront (published = not archived).
 *
 * Default: only rows whose description matches the old bulk-import placeholder
 * ("See product images for details") so seed / hand-written copy is preserved.
 *
 *   npm run db:improve-descriptions --workspace=backend
 *
 * Rewrite every published product (including seed copy):
 *
 *   node scripts/improve-product-descriptions.mjs --all-published
 *
 * Dry run (log only):
 *
 *   node scripts/improve-product-descriptions.mjs --dry-run
 */
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import { buildRichDescription } from './build-product-description.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const backendDir = resolve(__dirname, '..');
config({ path: resolve(backendDir, '.env') });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('Error: DATABASE_URL not set in apps/backend/.env');
  process.exit(1);
}

const PLACEHOLDER_SNIPPET = 'See product images for details';

const args = new Set(process.argv.slice(2));
const allPublished = args.has('--all-published');
const dryRun = args.has('--dry-run');

async function main() {
  const pool = new pg.Pool({ connectionString: DATABASE_URL });
  try {
    const { rows } = await pool.query(
      `SELECT id, name, description, category_id AS "categoryId"
       FROM product
       WHERE is_archived = false
       ORDER BY name`,
    );

    let updated = 0;
    let skipped = 0;

    for (const row of rows) {
      const next = buildRichDescription(row.name, row.categoryId);
      if (!allPublished && !String(row.description).includes(PLACEHOLDER_SNIPPET)) {
        skipped += 1;
        continue;
      }
      if (row.description === next) {
        skipped += 1;
        continue;
      }
      if (dryRun) {
        console.log(`[dry-run] ${row.id} ${row.name}`);
        updated += 1;
        continue;
      }
      await pool.query(
        `UPDATE product SET description = $1, updated_at = NOW() WHERE id = $2`,
        [next, row.id],
      );
      updated += 1;
    }

    console.log(
      dryRun
        ? `[improve-descriptions] dry-run: would update ${updated}, skip ${skipped} (${rows.length} published total).`
        : `[improve-descriptions] updated ${updated}, skipped ${skipped} (${rows.length} published total).`,
    );
    if (!allPublished) {
      console.log(
        `[improve-descriptions] Only matched descriptions containing "${PLACEHOLDER_SNIPPET}". Use --all-published to refresh every published product.`,
      );
    }
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
