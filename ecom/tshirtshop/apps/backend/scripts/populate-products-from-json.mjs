#!/usr/bin/env node
/**
 * Populate / sync the database from the repo catalog JSON (published inventory).
 *
 * Source file (default): apps/backend/public/uploads/products/products-bulk-import.json
 * Regenerate with: npm run generate:products-bulk --workspace=web
 *
 * Behaviour:
 * - Match existing rows by exact product name (trimmed).
 * - If found: update fields + replace images; set is_archived = false (published).
 * - If not found: insert with a new id and slug (same pattern as Nest createProduct).
 * - If name in JSON differs from DB, slug is regenerated like the backend.
 *
 * Prerequisites: categories referenced in JSON must already exist (e.g. db:seed categories).
 *
 *   npm run db:populate-from-json --workspace=backend
 *   node scripts/populate-products-from-json.mjs --dry-run
 *   node scripts/populate-products-from-json.mjs --file=./path/to/custom.json
 */
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import pg from 'pg';
import { randomUUID } from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const backendDir = resolve(__dirname, '..');
config({ path: resolve(backendDir, '.env') });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('Error: DATABASE_URL not set in apps/backend/.env');
  process.exit(1);
}

const defaultJsonPath = resolve(
  backendDir,
  'public',
  'uploads',
  'products',
  'products-bulk-import.json',
);

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const fileArg = args.find((a) => a.startsWith('--file='));
const jsonPath = fileArg ? fileArg.slice('--file='.length).trim() : defaultJsonPath;

if (!existsSync(jsonPath)) {
  console.error(`Error: JSON not found: ${jsonPath}`);
  process.exit(1);
}

/** Same rules as catalog.service.ts generateSlug */
function generateSlug(name) {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const suffix = randomUUID().replace(/-/g, '').slice(0, 6);
  return `${base}-${suffix}`;
}

function parseJson() {
  const raw = readFileSync(jsonPath, 'utf8');
  const data = JSON.parse(raw);
  if (!Array.isArray(data)) {
    throw new Error('JSON root must be an array of product objects');
  }
  return data;
}

async function main() {
  const entries = parseJson();
  const pool = new pg.Pool({ connectionString: DATABASE_URL });

  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  const errors = [];

  try {
    const { rows: catRows } = await pool.query(
      `SELECT id FROM category`,
    );
    const categoryIds = new Set(catRows.map((r) => r.id));

    for (let i = 0; i < entries.length; i++) {
      const row = entries[i];
      const name = typeof row.name === 'string' ? row.name.trim() : '';
      if (!name) {
        errors.push({ row: i + 1, msg: 'missing name' });
        skipped++;
        continue;
      }

      const categoryId = row.categoryId != null ? String(row.categoryId) : '';
      if (!categoryId || !categoryIds.has(categoryId)) {
        errors.push({
          row: i + 1,
          name,
          msg: `unknown categoryId "${categoryId}" — run db:seed or create category`,
        });
        skipped++;
        continue;
      }

      const description =
        typeof row.description === 'string' ? row.description : '';
      const priceCents = Number(row.priceCents);
      const stockQuantity =
        row.stockQuantity != null ? Number(row.stockQuantity) : 10;
      const brand = typeof row.brand === 'string' ? row.brand.trim() : 'Darkloom';

      if (!description || !Number.isFinite(priceCents) || priceCents < 0) {
        errors.push({ row: i + 1, name, msg: 'invalid description or priceCents' });
        skipped++;
        continue;
      }
      if (!Number.isFinite(stockQuantity) || stockQuantity < 0) {
        errors.push({ row: i + 1, name, msg: 'invalid stockQuantity' });
        skipped++;
        continue;
      }

      const images = Array.isArray(row.images)
        ? row.images
            .map((img) =>
              typeof img === 'string'
                ? img.trim()
                : typeof img?.url === 'string'
                  ? img.url.trim()
                  : '',
            )
            .filter(Boolean)
        : [];

      const {
        rows: [existing],
      } = await pool.query(
        `SELECT id, name, slug FROM product WHERE name = $1 ORDER BY created_at ASC LIMIT 1`,
        [name],
      );

      const optional = {
        weightMetric: row.weightMetric ?? null,
        weightImperial: row.weightImperial ?? null,
        dimensionMetric: row.dimensionMetric ?? null,
        dimensionImperial: row.dimensionImperial ?? null,
        sizeOptions: row.sizeOptions ?? null,
        material: row.material ?? null,
        fit: row.fit ?? null,
        careInstructions: row.careInstructions ?? null,
        orientation: row.orientation ?? null,
        framingInfo: row.framingInfo ?? null,
      };

      if (existing) {
        const newSlug =
          existing.name === name ? existing.slug : generateSlug(name);

        if (dryRun) {
          console.log(`[dry-run] UPDATE ${name} (${existing.id})`);
          updated++;
          continue;
        }

        await pool.query(
          `UPDATE product SET
            name = $1,
            slug = $2,
            description = $3,
            price_cents = $4,
            stock_quantity = $5,
            category_id = $6,
            brand = $7,
            weight_metric = $8,
            weight_imperial = $9,
            dimension_metric = $10,
            dimension_imperial = $11,
            size_options = $12,
            material = $13,
            fit = $14,
            care_instructions = $15,
            orientation = $16,
            framing_info = $17,
            is_archived = false,
            updated_at = NOW()
          WHERE id = $18`,
          [
            name,
            newSlug,
            description,
            priceCents,
            stockQuantity,
            categoryId,
            brand,
            optional.weightMetric,
            optional.weightImperial,
            optional.dimensionMetric,
            optional.dimensionImperial,
            optional.sizeOptions,
            optional.material,
            optional.fit,
            optional.careInstructions,
            optional.orientation,
            optional.framingInfo,
            existing.id,
          ],
        );

        await pool.query(`DELETE FROM product_image WHERE product_id = $1`, [
          existing.id,
        ]);
        for (let j = 0; j < images.length; j++) {
          await pool.query(
            `INSERT INTO product_image (id, product_id, image_url, alt_text, is_primary)
             VALUES ($1, $2, $3, NULL, $4)`,
            [randomUUID(), existing.id, images[j], j === 0],
          );
        }
        updated++;
      } else {
        const id = randomUUID();
        const slug = generateSlug(name);

        if (dryRun) {
          console.log(`[dry-run] INSERT ${name}`);
          inserted++;
          continue;
        }

        await pool.query(
          `INSERT INTO product (
            id, name, slug, description, price_cents, stock_quantity, category_id, brand,
            weight_metric, weight_imperial, dimension_metric, dimension_imperial,
            size_options, material, fit, care_instructions, orientation, framing_info,
            is_archived, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8,
            $9, $10, $11, $12,
            $13, $14, $15, $16, $17, $18,
            false, NOW(), NOW()
          )`,
          [
            id,
            name,
            slug,
            description,
            priceCents,
            stockQuantity,
            categoryId,
            brand,
            optional.weightMetric,
            optional.weightImperial,
            optional.dimensionMetric,
            optional.dimensionImperial,
            optional.sizeOptions,
            optional.material,
            optional.fit,
            optional.careInstructions,
            optional.orientation,
            optional.framingInfo,
          ],
        );

        for (let j = 0; j < images.length; j++) {
          await pool.query(
            `INSERT INTO product_image (id, product_id, image_url, alt_text, is_primary)
             VALUES ($1, $2, $3, NULL, $4)`,
            [randomUUID(), id, images[j], j === 0],
          );
        }
        inserted++;
      }
    }

    console.log(
      `[populate-from-json] ${dryRun ? 'dry-run ' : ''}source: ${jsonPath}`,
    );
    console.log(
      `[populate-from-json] inserted: ${inserted}, updated: ${updated}, skipped: ${skipped}`,
    );
    if (errors.length > 0) {
      console.log('[populate-from-json] issues:');
      for (const e of errors) console.log(' ', e);
    }
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
