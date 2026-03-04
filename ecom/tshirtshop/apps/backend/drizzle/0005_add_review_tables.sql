-- Review system tables (REV-001, REV-004)

CREATE TABLE IF NOT EXISTS "review" (
  "id" text PRIMARY KEY NOT NULL,
  "product_id" text NOT NULL REFERENCES "product"("id") ON DELETE CASCADE,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "user_name" text NOT NULL,
  "rating" integer NOT NULL,
  "title" text,
  "body" text NOT NULL,
  "helpful_count" integer NOT NULL DEFAULT 0,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "review_product_user_idx" ON "review" ("product_id", "user_id");

CREATE TABLE IF NOT EXISTS "review_helpful_vote" (
  "id" text PRIMARY KEY NOT NULL,
  "review_id" text NOT NULL REFERENCES "review"("id") ON DELETE CASCADE,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "review_helpful_vote_review_user_idx" ON "review_helpful_vote" ("review_id", "user_id");
