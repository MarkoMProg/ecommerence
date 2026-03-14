-- Migration: Better Auth rate limit persistence
-- Run: psql $DATABASE_URL -f 0009_add_better_auth_rate_limit.sql
-- Rollback:
--   DROP TABLE IF EXISTS "rate_limit";

CREATE TABLE IF NOT EXISTS "rate_limit" (
  "key" text PRIMARY KEY,
  "count" integer NOT NULL,
  "last_request" bigint NOT NULL
);