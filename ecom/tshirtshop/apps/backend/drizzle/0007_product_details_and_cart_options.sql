-- Migration: product attribute columns + cart/order option tracking
-- Run: psql $DATABASE_URL -f 0007_product_details_and_cart_options.sql
-- Rollback:
--   ALTER TABLE "product" DROP COLUMN IF EXISTS "size_options";
--   ALTER TABLE "product" DROP COLUMN IF EXISTS "material";
--   ALTER TABLE "product" DROP COLUMN IF EXISTS "fit";
--   ALTER TABLE "product" DROP COLUMN IF EXISTS "care_instructions";
--   ALTER TABLE "product" DROP COLUMN IF EXISTS "orientation";
--   ALTER TABLE "product" DROP COLUMN IF EXISTS "framing_info";
--   ALTER TABLE "cart_item" DROP COLUMN IF EXISTS "selected_option";
--   ALTER TABLE "order_item" DROP COLUMN IF EXISTS "selected_option_at_order";

-- Product attribute columns
-- size_options: comma-separated list, e.g. "XS,S,M,L,XL". NULL = no size selection for this product.
ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "size_options"       text;
-- material: e.g. "100% combed cotton, 320gsm" or "Heavy matte archival paper"
ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "material"           text;
-- fit: apparel only, e.g. "Oversized" or "True to size"
ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "fit"                text;
-- care_instructions: e.g. "Machine wash cold. Tumble dry low."
ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "care_instructions"  text;
-- orientation: prints/posters only, e.g. "Portrait" or "Landscape"
ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "orientation"        text;
-- framing_info: prints/posters only, e.g. "Ships unframed" or "White wood frame included"
ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "framing_info"       text;

-- Store selected option (e.g. size "M") on each cart line item
ALTER TABLE "cart_item" ADD COLUMN IF NOT EXISTS "selected_option"  text;

-- Snapshot the selected option at order time
ALTER TABLE "order_item" ADD COLUMN IF NOT EXISTS "selected_option_at_order" text;
