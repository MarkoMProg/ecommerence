import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import type { Request } from 'express';
import { BetterAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReviewService } from './review.service';
import {
  validateCreateReview,
  validateUpdateReview,
  type CreateReviewBody,
  type UpdateReviewBody,
} from './dto/review.dto';

@Controller('api/v1')
export class ReviewsController {
  constructor(private readonly reviewService: ReviewService) {}

  /**
   * List reviews for a product (REV-002). Public.
   */
  @Get('products/:productId/reviews')
  @AllowAnonymous()
  async listByProduct(
    @Param('productId') productId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.reviewService.listByProduct(
      productId.trim(),
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
    return {
      success: true,
      data: result.data,
      pagination: result.pagination,
      message: 'Reviews retrieved',
    };
  }

  /**
   * Create review (REV-002). Auth required.
   */
  @Post('products/:productId/reviews')
  @UseGuards(BetterAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Param('productId') productId: string,
    @Req() req: Request,
    @Body() body: CreateReviewBody,
  ) {
    const errors = validateCreateReview(body);
    if (errors.length > 0) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: errors,
        },
      });
    }
    const user = (req as any).user;
    const review = await this.reviewService.create(productId.trim(), user.id, {
      rating: body.rating,
      title: body.title,
      body: body.body,
    });
    return {
      success: true,
      data: review,
      message: 'Review created',
    };
  }

  /**
   * Update own review (REV-002). Auth required.
   */
  @Patch('reviews/:id')
  @UseGuards(BetterAuthGuard)
  async update(
    @Param('id') id: string,
    @Req() req: Request,
    @Body() body: UpdateReviewBody,
  ) {
    const errors = validateUpdateReview(body);
    if (errors.length > 0) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: errors,
        },
      });
    }
    const user = (req as any).user;
    const review = await this.reviewService.update(id.trim(), user.id, {
      rating: body.rating,
      title: body.title,
      body: body.body,
    });
    return {
      success: true,
      data: review,
      message: 'Review updated',
    };
  }

  /**
   * Delete own review (REV-002). Auth required.
   */
  @Delete('reviews/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(BetterAuthGuard)
  async delete(@Param('id') id: string, @Req() req: Request) {
    const user = (req as any).user;
    await this.reviewService.delete(id.trim(), user.id);
    return {
      success: true,
      data: null,
      message: 'Review deleted',
    };
  }

  /**
   * Vote helpful on a review (REV-004). Auth required. Body: { helpful: boolean }.
   */
  @Post('reviews/:id/helpful')
  @UseGuards(BetterAuthGuard)
  @HttpCode(HttpStatus.OK)
  async voteHelpful(
    @Param('id') id: string,
    @Req() req: Request,
    @Body() body: { helpful?: boolean },
  ) {
    const helpful = body?.helpful === true;
    const user = (req as any).user;
    const result = await this.reviewService.voteHelpful(id.trim(), user.id, helpful);
    return {
      success: true,
      data: result,
      message: 'Vote recorded',
    };
  }
}
