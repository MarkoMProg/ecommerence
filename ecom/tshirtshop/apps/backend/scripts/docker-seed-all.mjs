#!/usr/bin/env node
/**
 * Docker seed orchestrator — runs all seed scripts in order,
 * then copies product images into the uploads volume.
 * Used by the `seeder` service in docker-compose.yml.
 *
 * Order:
 *   1. seed.mjs           → categories + base products
 *   2. populate-products-from-json.mjs → full catalog from JSON
 *   3. create-load-test-user.mjs      → load-test user
 *   4. create-admin-user.mjs          → create admin user from env vars
 *   5. Copy product images → /app/public/uploads/products/
 */
import { execFileSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, cpSync, mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const backendDir = resolve(__dirname, '..');

// Each entry: [scriptFile, ...extraArgs]
const seedProductsDir = resolve(backendDir, 'seed-products');
const bulkJsonPath = resolve(seedProductsDir, 'products-bulk-import.json');

const scripts = [
  ['seed.mjs'],
  ['populate-products-from-json.mjs', `--file=${bulkJsonPath}`],
  ['create-load-test-user.mjs'],
  ['create-admin-user.mjs'],
];

for (const [script, ...args] of scripts) {
  const scriptPath = resolve(__dirname, script);
  console.log(`\n── Running ${script} ──`);
  try {
    execFileSync('node', [scriptPath, ...args], { stdio: 'inherit' });
  } catch (err) {
    console.error(`[docker-seed-all] ${script} failed (exit ${err.status})`);
    process.exit(err.status ?? 1);
  }
}

// Copy product images from the baked-in staging dir to the uploads volume.
// The seeder image has them at /repo/apps/backend/seed-products/
// The uploads volume is mounted at /app/public/uploads/
const uploadsProductsDir = '/app/public/uploads/products';

if (existsSync(seedProductsDir)) {
  console.log('\n── Copying product images to uploads volume ──');
  mkdirSync(uploadsProductsDir, { recursive: true });
  cpSync(seedProductsDir, uploadsProductsDir, { recursive: true });
  console.log(`Copied ${seedProductsDir} → ${uploadsProductsDir}`);
} else {
  console.log('\n── No seed-products directory found, skipping image copy ──');
}

console.log('\n── All seed scripts completed ──');
