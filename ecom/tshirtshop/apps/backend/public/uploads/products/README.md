# Catalog product images

Served by the API at **`/uploads/products/...`** (Nest `static` on `public/uploads`).

- Regenerate **`products-bulk-import.json`** from on-disk image folders and **sync the DB**: `npm run generate:products-bulk --workspace=backend`
- Populate DB from existing JSON only: `npm run db:populate-from-json --workspace=backend`
- If the DB still has old **`/products/...`** URLs: `npm run db:migrate-product-image-urls --workspace=backend`
