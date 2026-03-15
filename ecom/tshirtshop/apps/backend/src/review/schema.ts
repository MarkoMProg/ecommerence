import { relations } from 'drizzle-orm';
import {
  pgTable,
  text,
  integer,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { user } from '../auth/schema';
import { product } from '../catalog/schema';

/**
 * Product review (REV-001).
 * One review per product per user (enforced by unique index).
 * User must have a completed/paid/shipped order containing the product to leave a review.
 */
export const review = pgTable(
  'review',
  {
    id: text('id').primaryKey(),
    productId: text('product_id')
      .notNull()
      .references(() => product.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    /** Reviewer display name (snapshot at review time) */
    userName: text('user_name').notNull(),
    /** Star rating 1–5 */
    rating: integer('rating').notNull(),
    /** Optional review title */
    title: text('title'),
    /** Review body text */
    body: text('body').notNull(),
    /** Denormalised helpful-vote count for fast sorting (REV-004) */
    helpfulCount: integer('helpful_count').notNull().default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex('review_product_user_idx').on(table.productId, table.userId),
  ],
);

/**
 * Helpful-vote on a review (REV-004).
 * One vote per review per user (enforced by unique index).
 */
export const reviewHelpfulVote = pgTable(
  'review_helpful_vote',
  {
    id: text('id').primaryKey(),
    reviewId: text('review_id')
      .notNull()
      .references(() => review.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('review_helpful_vote_review_user_idx').on(
      table.reviewId,
      table.userId,
    ),
  ],
);

/* ── Relations ────────────────────────────────────────────── */

export const reviewRelations = relations(review, ({ one, many }) => ({
  product: one(product, {
    fields: [review.productId],
    references: [product.id],
  }),
  user: one(user, {
    fields: [review.userId],
    references: [user.id],
  }),
  helpfulVotes: many(reviewHelpfulVote),
}));

export const reviewHelpfulVoteRelations = relations(
  reviewHelpfulVote,
  ({ one }) => ({
    review: one(review, {
      fields: [reviewHelpfulVote.reviewId],
      references: [review.id],
    }),
    user: one(user, {
      fields: [reviewHelpfulVote.userId],
      references: [user.id],
    }),
  }),
);
