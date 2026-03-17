-- Migration: add manual single-use refresh token rotation table
-- Run: psql $DATABASE_URL -f 0011_add_manual_refresh_token_rotation.sql
-- Rollback:
--   DROP TABLE IF EXISTS "manual_refresh_token";

CREATE TABLE IF NOT EXISTS "manual_refresh_token" (
  "id" text PRIMARY KEY,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "token_hash" text NOT NULL UNIQUE,
  "expires_at" timestamp NOT NULL,
  "used_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "manual_refresh_token_user_id_idx"
  ON "manual_refresh_token"("user_id");

CREATE INDEX IF NOT EXISTS "manual_refresh_token_expires_at_idx"
  ON "manual_refresh_token"("expires_at");
