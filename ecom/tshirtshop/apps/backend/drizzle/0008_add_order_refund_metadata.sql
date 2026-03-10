-- Migration: order refund metadata for customer-initiated cancel-with-refund
-- Run: psql $DATABASE_URL -f 0008_add_order_refund_metadata.sql
-- Rollback:
--   ALTER TABLE "order" DROP COLUMN IF EXISTS "stripe_refund_id";
--   ALTER TABLE "order" DROP COLUMN IF EXISTS "refunded_at";
--   ALTER TABLE "order" DROP COLUMN IF EXISTS "refund_amount_cents";

-- Stripe Refund ID: prevents double refund, enables audit
ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "stripe_refund_id" text;
-- When refund was issued (customer cancel or admin refund)
ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "refunded_at" timestamp;
-- Amount refunded in cents (for audit; order.totalCents is source of truth)
ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "refund_amount_cents" integer;
