-- Migration: Better Auth drizzle adapter requires `id` field on rate_limit model.
-- This migration adds id, backfills it from key, and keeps key unique for lookups.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'rate_limit'
      AND constraint_type = 'PRIMARY KEY'
  ) THEN
    ALTER TABLE "rate_limit" DROP CONSTRAINT IF EXISTS "rate_limit_pkey";
  END IF;
END $$;

ALTER TABLE "rate_limit" ADD COLUMN IF NOT EXISTS "id" text;
UPDATE "rate_limit" SET "id" = "key" WHERE "id" IS NULL;
ALTER TABLE "rate_limit" ALTER COLUMN "id" SET NOT NULL;
ALTER TABLE "rate_limit" ALTER COLUMN "key" SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'rate_limit'
      AND constraint_name = 'rate_limit_pkey'
  ) THEN
    ALTER TABLE "rate_limit" ADD CONSTRAINT "rate_limit_pkey" PRIMARY KEY ("id");
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'rate_limit'
      AND constraint_name = 'rate_limit_key_unique'
  ) THEN
    ALTER TABLE "rate_limit" ADD CONSTRAINT "rate_limit_key_unique" UNIQUE ("key");
  END IF;
END $$;
