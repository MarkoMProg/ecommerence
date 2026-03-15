import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { ReviewsController } from '../reviews.controller';
import { ReviewService } from '../review.service';
import { BetterAuthGuard } from '../../auth/guards/jwt-auth.guard';

jest.mock('@thallesp/nestjs-better-auth', () => ({
  AllowAnonymous: () => () => {},
}));

const mockBetterAuthGuard = { canActivate: jest.fn().mockReturnValue(true) };

describe('Review API (Controller Integration)', () => {
  let controller: ReviewsController;
  let reviewService: ReviewService;

  const NOW = new Date();

  const mockReview = {
    id: 'rev-1',
    productId: 'prod-1',
    userId: 'user-1',
    userName: 'Alice',
    rating: 4,
    title: 'Nice tee',
    body: 'Fits well and high quality',
    helpfulCount: 5,
    createdAt: NOW,
    updatedAt: NOW,
  };

  beforeEach(async () => {
    const mockReviewService = {
      listByProduct: jest.fn().mockResolvedValue({
        data: [mockReview],
        pagination: { page: 1, limit: 20, total: 1 },
      }),
      create: jest.fn().mockResolvedValue(mockReview),
      update: jest.fn().mockResolvedValue(mockReview),
      delete: jest.fn().mockResolvedValue(undefined),
      voteHelpful: jest.fn().mockResolvedValue({ helpfulCount: 6 }),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ReviewsController],
      providers: [
        {
          provide: ReviewService,
          useValue: mockReviewService,
        },
      ],
    })
      .overrideGuard(BetterAuthGuard)
      .useValue(mockBetterAuthGuard)
      .compile();

    controller = moduleFixture.get<ReviewsController>(ReviewsController);
    reviewService = moduleFixture.get<ReviewService>(ReviewService);
  });

  // ─── listByProduct ────────────────────────────────────────────────────

  describe('listByProduct', () => {
    it('should return reviews with success:true and pagination', async () => {
      const result = await controller.listByProduct('prod-1');

      expect(result.success).toBe(true);
      expect(result.data).toBeInstanceOf(Array);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('rev-1');
      expect(result.pagination).toEqual({ page: 1, limit: 20, total: 1 });
    });

    it('should pass page and limit query params to service', async () => {
      await controller.listByProduct('prod-1', '2', '10');

      expect(reviewService.listByProduct).toHaveBeenCalledWith('prod-1', 2, 10);
    });

    it('should default to page 1 and limit 20 when not provided', async () => {
      await controller.listByProduct('prod-1');

      expect(reviewService.listByProduct).toHaveBeenCalledWith('prod-1', 1, 20);
    });

    it('should trim productId', async () => {
      await controller.listByProduct('  prod-1  ');

      expect(reviewService.listByProduct).toHaveBeenCalledWith('prod-1', 1, 20);
    });
  });

  // ─── create ───────────────────────────────────────────────────────────

  describe('create', () => {
    const validBody = { rating: 5, body: 'Love this shirt!' };
    const mockReq = { user: { id: 'user-1' } } as any;

    it('should create review and return success:true', async () => {
      const result = await controller.create('prod-1', mockReq, validBody);

      expect(result.success).toBe(true);
      expect(result.data.id).toBe('rev-1');
      expect(result.message).toBe('Review created');
    });

    it('should pass data to reviewService.create', async () => {
      await controller.create('prod-1', mockReq, {
        rating: 3,
        title: 'Decent',
        body: 'OK quality',
      });

      expect(reviewService.create).toHaveBeenCalledWith('prod-1', 'user-1', {
        rating: 3,
        title: 'Decent',
        body: 'OK quality',
      });
    });

    it('should throw BadRequestException on missing body', async () => {
      await expect(
        controller.create('prod-1', mockReq, { rating: 4 } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException on missing rating', async () => {
      await expect(
        controller.create('prod-1', mockReq, { body: 'Nice' } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException on invalid rating', async () => {
      await expect(
        controller.create('prod-1', mockReq, { rating: 0, body: 'Bad' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException with VALIDATION_ERROR code', async () => {
      await expect(
        controller.create('prod-1', mockReq, {} as any),
      ).rejects.toMatchObject({
        response: expect.objectContaining({
          error: expect.objectContaining({ code: 'VALIDATION_ERROR' }),
        }),
      });
    });

    it('should propagate ForbiddenException from service (purchase required)', async () => {
      (reviewService.create as jest.Mock).mockRejectedValueOnce(
        new ForbiddenException({
          success: false,
          error: { code: 'PURCHASE_REQUIRED', message: 'Not purchased' },
        }),
      );

      await expect(
        controller.create('prod-1', mockReq, validBody),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should propagate ConflictException from service (duplicate review)', async () => {
      (reviewService.create as jest.Mock).mockRejectedValueOnce(
        new ConflictException({
          success: false,
          error: { code: 'REVIEW_EXISTS', message: 'Already reviewed' },
        }),
      );

      await expect(
        controller.create('prod-1', mockReq, validBody),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ─── update ───────────────────────────────────────────────────────────

  describe('update', () => {
    const mockReq = { user: { id: 'user-1' } } as any;

    it('should update review and return success:true', async () => {
      const result = await controller.update('rev-1', mockReq, { rating: 3 });

      expect(result.success).toBe(true);
      expect(result.data.id).toBe('rev-1');
      expect(result.message).toBe('Review updated');
    });

    it('should pass fields to reviewService.update', async () => {
      await controller.update('rev-1', mockReq, { body: 'Updated body text' });

      expect(reviewService.update).toHaveBeenCalledWith('rev-1', 'user-1', {
        rating: undefined,
        title: undefined,
        body: 'Updated body text',
      });
    });

    it('should throw BadRequestException when no fields are provided', async () => {
      await expect(
        controller.update('rev-1', mockReq, {} as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException on invalid rating in update', async () => {
      await expect(
        controller.update('rev-1', mockReq, { rating: 6 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should propagate NotFoundException from service', async () => {
      (reviewService.update as jest.Mock).mockRejectedValueOnce(
        new NotFoundException({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Review not found' },
        }),
      );

      await expect(
        controller.update('rev-nonexistent', mockReq, { rating: 2 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should propagate ForbiddenException from service (not author)', async () => {
      (reviewService.update as jest.Mock).mockRejectedValueOnce(
        new ForbiddenException({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Not your review' },
        }),
      );

      await expect(
        controller.update('rev-1', mockReq, { rating: 1 }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── delete ───────────────────────────────────────────────────────────

  describe('delete', () => {
    const mockReq = { user: { id: 'user-1' } } as any;

    it('should delete review and return success:true with null data', async () => {
      const result = await controller.delete('rev-1', mockReq);

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
      expect(result.message).toBe('Review deleted');
    });

    it('should call reviewService.delete with correct ids', async () => {
      await controller.delete('rev-1', mockReq);

      expect(reviewService.delete).toHaveBeenCalledWith('rev-1', 'user-1');
    });

    it('should propagate NotFoundException from service', async () => {
      (reviewService.delete as jest.Mock).mockRejectedValueOnce(
        new NotFoundException({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Review not found' },
        }),
      );

      await expect(
        controller.delete('rev-nonexistent', mockReq),
      ).rejects.toThrow(NotFoundException);
    });

    it('should propagate ForbiddenException from service', async () => {
      (reviewService.delete as jest.Mock).mockRejectedValueOnce(
        new ForbiddenException({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Not your review' },
        }),
      );

      await expect(controller.delete('rev-1', mockReq)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  // ─── voteHelpful ──────────────────────────────────────────────────────

  describe('voteHelpful', () => {
    const mockReq = { user: { id: 'user-1' } } as any;

    it('should record helpful vote and return updated count', async () => {
      const result = await controller.voteHelpful('rev-1', mockReq, {
        helpful: true,
      });

      expect(result.success).toBe(true);
      expect(result.data.helpfulCount).toBe(6);
      expect(result.message).toBe('Vote recorded');
    });

    it('should call service with helpful=true', async () => {
      await controller.voteHelpful('rev-1', mockReq, { helpful: true });

      expect(reviewService.voteHelpful).toHaveBeenCalledWith(
        'rev-1',
        'user-1',
        true,
      );
    });

    it('should default to helpful=false when body.helpful is missing', async () => {
      await controller.voteHelpful('rev-1', mockReq, {});

      expect(reviewService.voteHelpful).toHaveBeenCalledWith(
        'rev-1',
        'user-1',
        false,
      );
    });

    it('should default to helpful=false when body.helpful is not true', async () => {
      await controller.voteHelpful('rev-1', mockReq, { helpful: false });

      expect(reviewService.voteHelpful).toHaveBeenCalledWith(
        'rev-1',
        'user-1',
        false,
      );
    });

    it('should propagate NotFoundException from service', async () => {
      (reviewService.voteHelpful as jest.Mock).mockRejectedValueOnce(
        new NotFoundException({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Review not found' },
        }),
      );

      await expect(
        controller.voteHelpful('rev-nonexistent', mockReq, { helpful: true }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should propagate BadRequestException for self-vote', async () => {
      (reviewService.voteHelpful as jest.Mock).mockRejectedValueOnce(
        new BadRequestException({
          success: false,
          error: { code: 'SELF_VOTE', message: 'Cannot vote on own review' },
        }),
      );

      await expect(
        controller.voteHelpful('rev-1', mockReq, { helpful: true }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
