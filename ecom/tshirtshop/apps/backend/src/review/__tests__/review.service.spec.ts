import { Test, TestingModule } from '@nestjs/testing';
import {
  ForbiddenException,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { DATABASE_CONNECTION } from '../../database/database-connection';
import { ReviewService } from '../review.service';

/**
 * Creates a thenable chain that mimics Drizzle's query-builder pattern.
 * The final `.then()` resolves to the given value.
 */
function thenable<T>(value: T): any {
  const chain: any = {
    from: () => chain,
    where: () => chain,
    orderBy: () => chain,
    limit: () => chain,
    offset: () => chain,
    innerJoin: () => chain,
    groupBy: () => chain,
    values: () => ({ then: (fn: any) => fn(), catch: () => {} }),
    set: () => ({ where: () => ({ then: (fn: any) => fn(), catch: () => {} }) }),
    then: (resolve: (v: T) => void) => resolve(value),
    catch: () => {},
  };
  return chain;
}

describe('ReviewService', () => {
  let service: ReviewService;
  let mockDb: any;

  const NOW = new Date();

  const mockReview = {
    id: 'rev-1',
    productId: 'prod-1',
    userId: 'user-1',
    userName: 'John',
    rating: 4,
    title: 'Great shirt',
    body: 'Loved the quality',
    helpfulCount: 3,
    createdAt: NOW,
    updatedAt: NOW,
  };

  beforeEach(async () => {
    mockDb = {
      select: jest.fn(() => thenable([])),
      selectDistinct: jest.fn(() => thenable([])),
      insert: jest.fn(() => ({
        values: jest.fn(() => ({ then: (fn: any) => fn(), catch: () => {} })),
      })),
      update: jest.fn(() => ({
        set: jest.fn(() => ({
          where: jest.fn(() => ({ then: (fn: any) => fn(), catch: () => {} })),
        })),
      })),
      delete: jest.fn(() => ({
        where: jest.fn(() => ({ then: (fn: any) => fn(), catch: () => {} })),
      })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewService,
        {
          provide: DATABASE_CONNECTION,
          useValue: mockDb,
        },
      ],
    }).compile();

    service = module.get<ReviewService>(ReviewService);
  });

  // ─── listByProduct ──────────────────────────────────────────────────────

  describe('listByProduct', () => {
    it('should return reviews with pagination shape', async () => {
      (mockDb.select as jest.Mock)
        .mockReturnValueOnce(thenable([mockReview]))   // data query
        .mockReturnValueOnce(thenable([{ count: 1 }])); // count query

      const result = await service.listByProduct('prod-1', 1, 20);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('rev-1');
      expect(result.pagination).toEqual({ page: 1, limit: 20, total: 1 });
    });

    it('should clamp page to minimum of 1', async () => {
      (mockDb.select as jest.Mock)
        .mockReturnValueOnce(thenable([]))
        .mockReturnValueOnce(thenable([{ count: 0 }]));

      const result = await service.listByProduct('prod-1', -5, 20);

      expect(result.pagination.page).toBe(1);
    });

    it('should clamp limit to maximum of 50', async () => {
      (mockDb.select as jest.Mock)
        .mockReturnValueOnce(thenable([]))
        .mockReturnValueOnce(thenable([{ count: 0 }]));

      const result = await service.listByProduct('prod-1', 1, 100);

      expect(result.pagination.limit).toBe(50);
    });

    it('should clamp limit to minimum of 1', async () => {
      (mockDb.select as jest.Mock)
        .mockReturnValueOnce(thenable([]))
        .mockReturnValueOnce(thenable([{ count: 0 }]));

      const result = await service.listByProduct('prod-1', 1, 0);

      expect(result.pagination.limit).toBe(1);
    });

    it('should return empty data when no reviews exist', async () => {
      (mockDb.select as jest.Mock)
        .mockReturnValueOnce(thenable([]))
        .mockReturnValueOnce(thenable([{ count: 0 }]));

      const result = await service.listByProduct('prod-1');

      expect(result.data).toEqual([]);
      expect(result.pagination.total).toBe(0);
    });
  });

  // ─── create ─────────────────────────────────────────────────────────────

  describe('create', () => {
    const createData = { rating: 5, body: 'Amazing shirt!' };

    it('should create a review when user has purchased the product', async () => {
      (mockDb.select as jest.Mock)
        // hasPurchasedProduct → order item found
        .mockReturnValueOnce(thenable([{ id: 'oi-1' }]))
        // check existing review → none
        .mockReturnValueOnce(thenable([]))
        // fetch user name
        .mockReturnValueOnce(thenable([{ name: 'Alice' }]))
        // re-read created review
        .mockReturnValueOnce(thenable([{ ...mockReview, id: 'rev-new', rating: 5 }]));

      const result = await service.create('prod-1', 'user-1', createData);

      expect(result.id).toBe('rev-new');
      expect(result.rating).toBe(5);
      expect(mockDb.insert).toHaveBeenCalled();
    });

    it('should throw ForbiddenException when user has NOT purchased the product', async () => {
      (mockDb.select as jest.Mock)
        // hasPurchasedProduct → no rows
        .mockReturnValueOnce(thenable([]));

      await expect(
        service.create('prod-1', 'user-1', createData),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should surface PURCHASE_REQUIRED code', async () => {
      (mockDb.select as jest.Mock).mockReturnValueOnce(thenable([]));

      await expect(
        service.create('prod-1', 'user-1', createData),
      ).rejects.toMatchObject({
        response: expect.objectContaining({
          error: expect.objectContaining({ code: 'PURCHASE_REQUIRED' }),
        }),
      });
    });

    it('should throw ConflictException when review already exists', async () => {
      (mockDb.select as jest.Mock)
        // hasPurchasedProduct → purchased
        .mockReturnValueOnce(thenable([{ id: 'oi-1' }]))
        // check existing → found
        .mockReturnValueOnce(thenable([{ id: 'rev-existing' }]));

      await expect(
        service.create('prod-1', 'user-1', createData),
      ).rejects.toThrow(ConflictException);
    });

    it('should surface REVIEW_EXISTS code on duplicate', async () => {
      (mockDb.select as jest.Mock)
        .mockReturnValueOnce(thenable([{ id: 'oi-1' }]))
        .mockReturnValueOnce(thenable([{ id: 'rev-existing' }]));

      await expect(
        service.create('prod-1', 'user-1', createData),
      ).rejects.toMatchObject({
        response: expect.objectContaining({
          error: expect.objectContaining({ code: 'REVIEW_EXISTS' }),
        }),
      });
    });

    it('should fall back to "Anonymous" when user name not found', async () => {
      (mockDb.select as jest.Mock)
        .mockReturnValueOnce(thenable([{ id: 'oi-1' }]))
        .mockReturnValueOnce(thenable([]))
        // user fetch returns empty
        .mockReturnValueOnce(thenable([]))
        .mockReturnValueOnce(thenable([{ ...mockReview, userName: 'Anonymous' }]));

      const result = await service.create('prod-1', 'user-1', createData);
      expect(result.userName).toBe('Anonymous');
    });
  });

  // ─── update ─────────────────────────────────────────────────────────────

  describe('update', () => {
    it('should update own review and return updated data', async () => {
      (mockDb.select as jest.Mock)
        // find existing review (owner check)
        .mockReturnValueOnce(thenable([mockReview]))
        // re-read after update
        .mockReturnValueOnce(thenable([{ ...mockReview, rating: 2 }]));

      const result = await service.update('rev-1', 'user-1', { rating: 2 });

      expect(result.rating).toBe(2);
      expect(mockDb.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException when review does not exist', async () => {
      (mockDb.select as jest.Mock).mockReturnValueOnce(thenable([]));

      await expect(
        service.update('rev-nonexistent', 'user-1', { rating: 3 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user is not the author', async () => {
      (mockDb.select as jest.Mock).mockReturnValueOnce(
        thenable([{ ...mockReview, userId: 'different-user' }]),
      );

      await expect(
        service.update('rev-1', 'user-1', { rating: 1 }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should surface FORBIDDEN code for non-author update', async () => {
      (mockDb.select as jest.Mock).mockReturnValueOnce(
        thenable([{ ...mockReview, userId: 'different-user' }]),
      );

      await expect(
        service.update('rev-1', 'user-1', { rating: 1 }),
      ).rejects.toMatchObject({
        response: expect.objectContaining({
          error: expect.objectContaining({ code: 'FORBIDDEN' }),
        }),
      });
    });
  });

  // ─── delete ─────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('should delete own review without throwing', async () => {
      (mockDb.select as jest.Mock).mockReturnValueOnce(thenable([mockReview]));

      await expect(service.delete('rev-1', 'user-1')).resolves.toBeUndefined();
      expect(mockDb.delete).toHaveBeenCalled();
    });

    it('should throw NotFoundException when review does not exist', async () => {
      (mockDb.select as jest.Mock).mockReturnValueOnce(thenable([]));

      await expect(
        service.delete('rev-nonexistent', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user is not the author', async () => {
      (mockDb.select as jest.Mock).mockReturnValueOnce(
        thenable([{ ...mockReview, userId: 'different-user' }]),
      );

      await expect(
        service.delete('rev-1', 'user-1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── voteHelpful ────────────────────────────────────────────────────────

  describe('voteHelpful', () => {
    it('should add a helpful vote and return updated count', async () => {
      (mockDb.select as jest.Mock)
        // find review (owner check)
        .mockReturnValueOnce(thenable([{ ...mockReview, userId: 'author-1' }]))
        // check existing vote → none
        .mockReturnValueOnce(thenable([]))
        // recount
        .mockReturnValueOnce(thenable([{ count: 4 }]));

      const result = await service.voteHelpful('rev-1', 'user-1', true);

      expect(result.helpfulCount).toBe(4);
      expect(mockDb.insert).toHaveBeenCalled();
    });

    it('should remove an existing helpful vote', async () => {
      (mockDb.select as jest.Mock)
        .mockReturnValueOnce(thenable([{ ...mockReview, userId: 'author-1' }]))
        // existing vote found
        .mockReturnValueOnce(thenable([{ id: 'vote-1', reviewId: 'rev-1', userId: 'user-1' }]))
        // recount
        .mockReturnValueOnce(thenable([{ count: 2 }]));

      const result = await service.voteHelpful('rev-1', 'user-1', false);

      expect(result.helpfulCount).toBe(2);
      expect(mockDb.delete).toHaveBeenCalled();
    });

    it('should throw NotFoundException when review does not exist', async () => {
      (mockDb.select as jest.Mock).mockReturnValueOnce(thenable([]));

      await expect(
        service.voteHelpful('rev-nonexistent', 'user-1', true),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when voting on own review', async () => {
      (mockDb.select as jest.Mock).mockReturnValueOnce(
        thenable([{ ...mockReview, userId: 'user-1' }]),
      );

      await expect(
        service.voteHelpful('rev-1', 'user-1', true),
      ).rejects.toThrow(BadRequestException);
    });

    it('should surface SELF_VOTE code for own review vote', async () => {
      (mockDb.select as jest.Mock).mockReturnValueOnce(
        thenable([{ ...mockReview, userId: 'user-1' }]),
      );

      await expect(
        service.voteHelpful('rev-1', 'user-1', true),
      ).rejects.toMatchObject({
        response: expect.objectContaining({
          error: expect.objectContaining({ code: 'SELF_VOTE' }),
        }),
      });
    });

    it('should not insert when vote already exists and helpful=true', async () => {
      (mockDb.select as jest.Mock)
        .mockReturnValueOnce(thenable([{ ...mockReview, userId: 'author-1' }]))
        // existing vote already present
        .mockReturnValueOnce(thenable([{ id: 'vote-1' }]))
        // recount
        .mockReturnValueOnce(thenable([{ count: 3 }]));

      const result = await service.voteHelpful('rev-1', 'user-1', true);

      expect(result.helpfulCount).toBe(3);
      expect(mockDb.insert).not.toHaveBeenCalled();
    });

    it('should not delete when no vote exists and helpful=false', async () => {
      (mockDb.select as jest.Mock)
        .mockReturnValueOnce(thenable([{ ...mockReview, userId: 'author-1' }]))
        // no existing vote
        .mockReturnValueOnce(thenable([]))
        // recount
        .mockReturnValueOnce(thenable([{ count: 3 }]));

      const result = await service.voteHelpful('rev-1', 'user-1', false);

      expect(result.helpfulCount).toBe(3);
      expect(mockDb.delete).not.toHaveBeenCalled();
    });
  });

  // ─── getProductRatingStats ──────────────────────────────────────────────

  describe('getProductRatingStats', () => {
    it('should return average rating and review count', async () => {
      (mockDb.select as jest.Mock).mockReturnValueOnce(
        thenable([{ avg: 4.2, count: 15 }]),
      );

      const result = await service.getProductRatingStats('prod-1');

      expect(result.averageRating).toBe(4.2);
      expect(result.reviewCount).toBe(15);
    });

    it('should return 0s when no reviews exist', async () => {
      (mockDb.select as jest.Mock).mockReturnValueOnce(
        thenable([{ avg: 0, count: 0 }]),
      );

      const result = await service.getProductRatingStats('prod-1');

      expect(result.averageRating).toBe(0);
      expect(result.reviewCount).toBe(0);
    });
  });

  // ─── getProductsRatingStats ─────────────────────────────────────────────

  describe('getProductsRatingStats', () => {
    it('should return a Map of productId → stats', async () => {
      (mockDb.select as jest.Mock).mockReturnValueOnce(
        thenable([
          { productId: 'prod-1', avg: 4.5, count: 10 },
          { productId: 'prod-2', avg: 3.2, count: 5 },
        ]),
      );

      const result = await service.getProductsRatingStats(['prod-1', 'prod-2']);

      expect(result).toBeInstanceOf(Map);
      expect(result.get('prod-1')).toEqual({ averageRating: 4.5, reviewCount: 10 });
      expect(result.get('prod-2')).toEqual({ averageRating: 3.2, reviewCount: 5 });
    });

    it('should return empty Map when productIds is empty', async () => {
      const result = await service.getProductsRatingStats([]);

      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(0);
      expect(mockDb.select).not.toHaveBeenCalled();
    });
  });
});
