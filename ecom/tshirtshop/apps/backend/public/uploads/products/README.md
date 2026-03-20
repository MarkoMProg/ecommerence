# Catalog product images

Served by the API at **`/uploads/products/...`** (Nest `static` on `public/uploads`).

- Regenerate **`products-bulk-import.json`**: `npm run generate:products-bulk --workspace=web`
- Populate DB: `npm run db:populate-from-json --workspace=backend`
- If the DB still has old **`/products/...`** URLs: `npm run db:migrate-product-image-urls --workspace=backend`
