-- Migration: add user_address table (ADDR-001)
-- Run: psql $DATABASE_URL -f 0006_add_user_addresses.sql
-- Rollback: DROP TABLE IF EXISTS "user_address";

CREATE TABLE IF NOT EXISTS "user_address" (
  "id"                  text        PRIMARY KEY NOT NULL,
  "user_id"             text        NOT NULL,
  "label"               text        NOT NULL DEFAULT 'Home',
  "full_name"           text        NOT NULL,
  "phone"               text,
  "line1"               text        NOT NULL,
  "line2"               text,
  "city"                text        NOT NULL,
  "state_or_region"     text        NOT NULL,
  "postal_code"         text        NOT NULL,
  "country"             text        NOT NULL,
  "is_default_shipping" boolean     NOT NULL DEFAULT false,
  "is_default_billing"  boolean     NOT NULL DEFAULT false,
  "created_at"          timestamp   NOT NULL DEFAULT now(),
  "updated_at"          timestamp   NOT NULL DEFAULT now()
);

ALTER TABLE "user_address"
  ADD CONSTRAINT "user_address_user_id_user_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "user"("id")
  ON DELETE CASCADE ON UPDATE NO ACTION;

CREATE INDEX IF NOT EXISTS "user_address_userId_idx"
  ON "user_address" ("user_id");
