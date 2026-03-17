-- Migration: add session_id to manual_refresh_token for session invalidation on token consumption
-- When a refresh token is consumed, its associated session will be invalidated
-- This ensures that old session tokens are rejected after replay of a consumed refresh token

-- Add session_id column to manual_refresh_token table
ALTER TABLE "manual_refresh_token"
ADD COLUMN "session_id" text NOT NULL DEFAULT '';

-- Create foreign key constraint
ALTER TABLE "manual_refresh_token"
ADD CONSTRAINT "manual_refresh_token_session_id_fk"
FOREIGN KEY ("session_id") REFERENCES "session"("id") ON DELETE CASCADE;

-- Create index for session_id lookups
CREATE INDEX IF NOT EXISTS "manual_refresh_token_session_id_idx"
  ON "manual_refresh_token"("session_id");

-- Update the default values to empty string for existing rows (they will need manual review or cleanup)
-- In practice, this migration should be run shortly after schema change, before old tokens expire
