CREATE TABLE "manual_refresh_token" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"session_id" text NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "manual_refresh_token_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "rate_limit" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"count" integer NOT NULL,
	"last_request" bigint NOT NULL,
	CONSTRAINT "rate_limit_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "review" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"user_id" text NOT NULL,
	"user_name" text NOT NULL,
	"rating" integer NOT NULL,
	"title" text,
	"body" text NOT NULL,
	"helpful_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review_helpful_vote" (
	"id" text PRIMARY KEY NOT NULL,
	"review_id" text NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_address" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"label" text DEFAULT 'Home' NOT NULL,
	"full_name" text NOT NULL,
	"phone" text,
	"line1" text NOT NULL,
	"line2" text,
	"city" text NOT NULL,
	"state_or_region" text NOT NULL,
	"postal_code" text NOT NULL,
	"country" text NOT NULL,
	"is_default_shipping" boolean DEFAULT false NOT NULL,
	"is_default_billing" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP INDEX "cart_item_cart_product_idx";--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "email_encrypted" text NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "email_index" text NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "stripe_customer_id" text;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "slug" text NOT NULL;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "size_options" text;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "material" text;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "fit" text;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "care_instructions" text;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "orientation" text;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "framing_info" text;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "is_archived" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "product_image" ADD COLUMN "alt_text" text;--> statement-breakpoint
ALTER TABLE "cart_item" ADD COLUMN "selected_option" text;--> statement-breakpoint
ALTER TABLE "order" ADD COLUMN "stripe_refund_id" text;--> statement-breakpoint
ALTER TABLE "order" ADD COLUMN "refunded_at" timestamp;--> statement-breakpoint
ALTER TABLE "order" ADD COLUMN "refund_amount_cents" integer;--> statement-breakpoint
ALTER TABLE "order_item" ADD COLUMN "selected_option_at_order" text;--> statement-breakpoint
ALTER TABLE "manual_refresh_token" ADD CONSTRAINT "manual_refresh_token_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manual_refresh_token" ADD CONSTRAINT "manual_refresh_token_session_id_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review" ADD CONSTRAINT "review_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review" ADD CONSTRAINT "review_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_helpful_vote" ADD CONSTRAINT "review_helpful_vote_review_id_review_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."review"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_helpful_vote" ADD CONSTRAINT "review_helpful_vote_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_address" ADD CONSTRAINT "user_address_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "manual_refresh_token_user_id_idx" ON "manual_refresh_token" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "manual_refresh_token_session_id_idx" ON "manual_refresh_token" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "manual_refresh_token_expires_at_idx" ON "manual_refresh_token" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "review_product_user_idx" ON "review" USING btree ("product_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "review_helpful_vote_review_user_idx" ON "review_helpful_vote" USING btree ("review_id","user_id");--> statement-breakpoint
CREATE INDEX "user_address_userId_idx" ON "user_address" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "cart_item_cart_product_option_idx" ON "cart_item" USING btree ("cart_id","product_id","selected_option");--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_email_index_unique" UNIQUE("email_index");--> statement-breakpoint
ALTER TABLE "product" ADD CONSTRAINT "product_slug_unique" UNIQUE("slug");