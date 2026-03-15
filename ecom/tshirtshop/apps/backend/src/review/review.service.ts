import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { eq, and, desc, sql, inArray } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { randomUUID } from 'crypto';
import { DATABASE_CONNECTION } from '../database/database-connection';
import { review, reviewHelpfulVote } from './schema';
import { order, orderItem } from '../order/schema';
import { user } from '../auth/schema';

export interface ReviewDto {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  title: string | null;
  body: string;
  helpfulCount: number;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class ReviewService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase,
  ) {}

  /**
   * Check whether a user has purchased a given product.
   * A purchase counts when the order status is paid, shipped, or completed.
   */
  private async hasPurchasedProduct(
    userId: string,
    productId: string,
  ): Promise<boolean> {
    const validStatuses = ['paid', 'shipped', 'completed'];

    const rows = await this.db
      .select({ id: orderItem.id })
      .from(orderItem)
      .innerJoin(order, eq(orderItem.orderId, order.id))
      .where(
        and(
          eq(order.userId, userId),
          eq(orderItem.productId, productId),
          inArray(order.status, validStatuses),
        ),
      )
      .limit(1);

    return rows.length > 0;
  }

  /**
   * List reviews for a product, sorted by helpful count descending (REV-004).
   * Public endpoint — no auth required.
   */
  async listByProduct(
    productId: string,
    page = 1,
    limit = 20,
  ): Promise<{
    data: ReviewDto[];
    pagination: { page: number; limit: number; total: number };
  }> {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(50, Math.max(1, limit));
    const offset = (safePage - 1) * safeLimit;

    const [data, countResult] = await Promise.all([
      this.db
        .select()
        .from(review)
        .where(eq(review.productId, productId))
        .orderBy(desc(review.helpfulCount), desc(review.createdAt))
        .limit(safeLimit)
        .offset(offset),
      this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(review)
        .where(eq(review.productId, productId)),
    ]);

    const total = countResult[0]?.count ?? 0;

    return {
      data: data.map((r) => ({
        id: r.id,
        productId: r.productId,
        userId: r.userId,
        userName: r.userName,
        rating: r.rating,
        title: r.title,
        body: r.body,
        helpfulCount: r.helpfulCount,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })),
      pagination: { page: safePage, limit: safeLimit, total },
    };
  }

  /**
   * Create a review for a product.
   * Enforces: user must have purchased the product, one review per product per user.
   */
  async create(
    productId: string,
    userId: string,
    data: { rating: number; title?: string; body: string },
  ): Promise<ReviewDto> {
    // Verify purchase
    const purchased = await this.hasPurchasedProduct(userId, productId);
    if (!purchased) {
      throw new ForbiddenException({
        success: false,
        error: {
          code: 'PURCHASE_REQUIRED',
          message: 'You can only review products you have purchased',
        },
      });
    }

    // Check for existing review (unique constraint also enforces this)
    const [existing] = await this.db
      .select({ id: review.id })
      .from(review)
      .where(and(eq(review.productId, productId), eq(review.userId, userId)))
      .limit(1);

    if (existing) {
      throw new ConflictException({
        success: false,
        error: {
          code: 'REVIEW_EXISTS',
          message:
            'You have already reviewed this product. You can update your existing review.',
        },
      });
    }

    // Fetch user name for snapshot
    const [userData] = await this.db
      .select({ name: user.name })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);
    const userName = userData?.name ?? 'Anonymous';

    const id = randomUUID();
    await this.db.insert(review).values({
      id,
      productId,
      userId,
      userName,
      rating: data.rating,
      title: data.title?.trim() || null,
      body: data.body.trim(),
    });

    const [created] = await this.db
      .select()
      .from(review)
      .where(eq(review.id, id));
    return {
      id: created.id,
      productId: created.productId,
      userId: created.userId,
      userName: created.userName,
      rating: created.rating,
      title: created.title,
      body: created.body,
      helpfulCount: created.helpfulCount,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    };
  }

  /**
   * Update own review. Only the review author can update.
   */
  async update(
    reviewId: string,
    userId: string,
    data: { rating?: number; title?: string; body?: string },
  ): Promise<ReviewDto> {
    const [existing] = await this.db
      .select()
      .from(review)
      .where(eq(review.id, reviewId));

    if (!existing) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Review not found' },
      });
    }

    if (existing.userId !== userId) {
      throw new ForbiddenException({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You can only edit your own reviews',
        },
      });
    }

    const updateData: Partial<typeof review.$inferInsert> = {};
    if (data.rating != null) updateData.rating = data.rating;
    if (data.title !== undefined) updateData.title = data.title?.trim() || null;
    if (data.body != null) updateData.body = data.body.trim();

    if (Object.keys(updateData).length > 0) {
      await this.db
        .update(review)
        .set(updateData)
        .where(eq(review.id, reviewId));
    }

    const [updated] = await this.db
      .select()
      .from(review)
      .where(eq(review.id, reviewId));
    return {
      id: updated.id,
      productId: updated.productId,
      userId: updated.userId,
      userName: updated.userName,
      rating: updated.rating,
      title: updated.title,
      body: updated.body,
      helpfulCount: updated.helpfulCount,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  /**
   * Delete own review. Only the review author can delete.
   */
  async delete(reviewId: string, userId: string): Promise<void> {
    const [existing] = await this.db
      .select()
      .from(review)
      .where(eq(review.id, reviewId));

    if (!existing) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Review not found' },
      });
    }

    if (existing.userId !== userId) {
      throw new ForbiddenException({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You can only delete your own reviews',
        },
      });
    }

    await this.db.delete(review).where(eq(review.id, reviewId));
  }

  /**
   * Toggle helpful vote on a review (REV-004).
   * If `helpful` is true, add a vote; if false, remove existing vote.
   * Updates the denormalised helpfulCount on the review.
   */
  async voteHelpful(
    reviewId: string,
    userId: string,
    helpful: boolean,
  ): Promise<{ helpfulCount: number }> {
    const [existing] = await this.db
      .select()
      .from(review)
      .where(eq(review.id, reviewId));

    if (!existing) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Review not found' },
      });
    }

    // Cannot vote on own review
    if (existing.userId === userId) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'SELF_VOTE',
          message: 'You cannot vote on your own review',
        },
      });
    }

    const [existingVote] = await this.db
      .select()
      .from(reviewHelpfulVote)
      .where(
        and(
          eq(reviewHelpfulVote.reviewId, reviewId),
          eq(reviewHelpfulVote.userId, userId),
        ),
      )
      .limit(1);

    if (helpful && !existingVote) {
      await this.db.insert(reviewHelpfulVote).values({
        id: randomUUID(),
        reviewId,
        userId,
      });
    } else if (!helpful && existingVote) {
      await this.db
        .delete(reviewHelpfulVote)
        .where(eq(reviewHelpfulVote.id, existingVote.id));
    }

    // Recount and update denormalised field
    const [countResult] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(reviewHelpfulVote)
      .where(eq(reviewHelpfulVote.reviewId, reviewId));
    const newCount = countResult?.count ?? 0;

    await this.db
      .update(review)
      .set({ helpfulCount: newCount })
      .where(eq(review.id, reviewId));

    return { helpfulCount: newCount };
  }

  /**
   * List all reviews across all products for admin moderation.
   * Sorted by creation date descending.
   */
  async listAllForAdmin(opts: {
    page?: number;
    limit?: number;
    productId?: string;
  }): Promise<{
    data: ReviewDto[];
    pagination: { page: number; limit: number; total: number };
  }> {
    const safePage = Math.max(1, opts.page ?? 1);
    const safeLimit = Math.min(100, Math.max(1, opts.limit ?? 50));
    const offset = (safePage - 1) * safeLimit;

    const where = opts.productId
      ? eq(review.productId, opts.productId)
      : undefined;

    const [data, countResult] = await Promise.all([
      this.db
        .select()
        .from(review)
        .where(where)
        .orderBy(desc(review.createdAt))
        .limit(safeLimit)
        .offset(offset),
      this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(review)
        .where(where),
    ]);

    const total = countResult[0]?.count ?? 0;
    return {
      data: data.map((r) => ({
        id: r.id,
        productId: r.productId,
        userId: r.userId,
        userName: r.userName,
        rating: r.rating,
        title: r.title,
        body: r.body,
        helpfulCount: r.helpfulCount,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })),
      pagination: { page: safePage, limit: safeLimit, total },
    };
  }

  /**
   * Admin override delete — bypasses ownership check.
   */
  async adminDelete(reviewId: string): Promise<void> {
    const [existing] = await this.db
      .select({ id: review.id })
      .from(review)
      .where(eq(review.id, reviewId))
      .limit(1);

    if (!existing) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Review not found' },
      });
    }

    await this.db.delete(review).where(eq(review.id, reviewId));
  }

  /**
   * Get aggregate rating stats for a single product.
   * Returns averageRating (rounded to 1 decimal) and reviewCount.
   */
  async getProductRatingStats(productId: string): Promise<{
    averageRating: number;
    reviewCount: number;
  }> {
    const [result] = await this.db
      .select({
        avg: sql<number>`coalesce(round(avg(${review.rating})::numeric, 1), 0)::float`,
        count: sql<number>`count(*)::int`,
      })
      .from(review)
      .where(eq(review.productId, productId));

    return {
      averageRating: result?.avg ?? 0,
      reviewCount: result?.count ?? 0,
    };
  }

  /**
   * Get aggregate rating stats for multiple products in one query.
   * Returns a map of productId → { averageRating, reviewCount }.
   */
  async getProductsRatingStats(
    productIds: string[],
  ): Promise<Map<string, { averageRating: number; reviewCount: number }>> {
    if (productIds.length === 0) return new Map();

    const rows = await this.db
      .select({
        productId: review.productId,
        avg: sql<number>`coalesce(round(avg(${review.rating})::numeric, 1), 0)::float`,
        count: sql<number>`count(*)::int`,
      })
      .from(review)
      .where(inArray(review.productId, productIds))
      .groupBy(review.productId);

    const map = new Map<
      string,
      { averageRating: number; reviewCount: number }
    >();
    for (const row of rows) {
      map.set(row.productId, {
        averageRating: row.avg,
        reviewCount: row.count,
      });
    }
    return map;
  }
}
