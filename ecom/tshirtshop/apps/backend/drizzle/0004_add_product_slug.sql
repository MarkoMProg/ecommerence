-- Add slug column to product table.
-- Existing rows get a slug derived from their name + a substring of their id for uniqueness.
ALTER TABLE "product" ADD COLUMN "slug" text;

-- Back-fill existing rows
UPDATE "product"
SET "slug" = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(TRIM("name"), '[^a-zA-Z0-9]+', '-', 'g'),
    '^-+|-+$', '', 'g'
  )
) || '-' || SUBSTRING("id" FROM 1 FOR 6);

-- Now make it NOT NULL + UNIQUE
ALTER TABLE "product" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "product_slug_unique" ON "product" ("slug");
