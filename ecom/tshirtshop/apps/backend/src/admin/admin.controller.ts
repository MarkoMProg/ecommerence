import {
  Controller,
  Get,
  Delete,
  Patch,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { MulterFile } from '../common/multer-file.types';
import { memoryStorage } from 'multer';
import { AdminGuard } from './guards/admin.guard';
import { OrderService } from '../order/order.service';
import { CatalogService } from '../catalog/catalog.service';
import {
  BulkUploadService,
  type BulkProductEntry,
  type BulkUploadResult,
  type BulkRowResult,
} from '../catalog/bulk-upload.service';
import { ReviewService } from '../review/review.service';

@Controller('api/v1/admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(
    private readonly orderService: OrderService,
    private readonly catalogService: CatalogService,
    private readonly bulkUploadService: BulkUploadService,
    private readonly reviewService: ReviewService,
  ) {}

  @Get('dashboard')
  getDashboard() {
    return { success: true, data: { ok: true }, message: 'Admin access' };
  }

  @Get('orders')
  async getOrders() {
    const orders = await this.orderService.getAllOrders();
    return {
      success: true,
      data: orders,
      message: 'Orders retrieved',
    };
  }

  @Patch('orders/:orderId/status')
  async updateOrderStatus(
    @Param('orderId') orderId: string,
    @Body() body: { status?: string },
  ) {
    if (!body?.status?.trim()) {
      throw new BadRequestException({
        success: false,
        error: { code: 'STATUS_REQUIRED', message: 'status is required' },
      });
    }
    const order = await this.orderService.updateOrderStatus(
      orderId.trim(),
      body.status.trim(),
    );
    if (!order) {
      throw new NotFoundException({
        success: false,
        error: { code: 'ORDER_NOT_FOUND', message: 'Order not found' },
      });
    }
    return {
      success: true,
      data: order,
      message: 'Order status updated',
    };
  }

  @Post('orders/:orderId/refund')
  async refundOrder(@Param('orderId') orderId: string) {
    const order = await this.orderService.refundOrder(orderId.trim());
    if (!order) {
      throw new NotFoundException({
        success: false,
        error: { code: 'ORDER_NOT_FOUND', message: 'Order not found' },
      });
    }
    return {
      success: true,
      data: order,
      message: 'Order refunded',
    };
  }

  // ─── Reviews ────────────────────────────────────────────────────────────

  /** List all reviews across all products (admin moderation). Supports pagination. */
  @Get('reviews')
  async getReviews(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('productId') productId?: string,
  ) {
    const result = await this.reviewService.listAllForAdmin({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
      productId: productId?.trim() || undefined,
    });
    return {
      success: true,
      data: result.data,
      pagination: result.pagination,
      message: 'Reviews retrieved',
    };
  }

  /** Delete any review (admin override). */
  @Delete('reviews/:reviewId')
  async deleteReview(@Param('reviewId') reviewId: string) {
    await this.reviewService.adminDelete(reviewId.trim());
    return { success: true, data: null, message: 'Review deleted' };
  }

  // ─── Bulk Product Upload ────────────────────────────────────────────────

  @Post('products/bulk')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
      fileFilter: (_req, file, cb) => {
        const allowed = /\.(csv|json)$/i;
        const mimeOk =
          /^(text\/csv|application\/json|text\/plain|application\/octet-stream)$/i;
        if (!allowed.test(file.originalname) && !mimeOk.test(file.mimetype)) {
          return cb(
            new BadRequestException('Only .csv and .json files are accepted'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async bulkUploadProducts(@UploadedFile() file: MulterFile) {
    if (!file) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'NO_FILE',
          message:
            'No file provided. Upload a .csv or .json file with field name "file".',
        },
      });
    }

    const content = file.buffer.toString('utf-8');
    const format = this.bulkUploadService.detectFormat(
      file.originalname,
      content,
    );

    let entries: BulkProductEntry[];
    try {
      entries =
        format === 'json'
          ? this.bulkUploadService.parseJSON(content)
          : this.bulkUploadService.parseCSV(content);
    } catch (err) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'PARSE_ERROR',
          message: `Failed to parse ${format.toUpperCase()} file: ${(err as Error).message}`,
        },
      });
    }

    if (entries.length === 0) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'EMPTY_FILE',
          message: 'File contains no product entries.',
        },
      });
    }

    const results: BulkRowResult[] = [];
    let succeeded = 0;
    let failed = 0;

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const validationError = this.bulkUploadService.validateEntry(entry);
      if (validationError) {
        results.push({
          row: i + 1,
          name: entry.name || '(unnamed)',
          status: 'error',
          error: validationError,
        });
        failed++;
        continue;
      }

      try {
        const created = await this.catalogService.createProduct({
          name: entry.name,
          description: entry.description,
          priceCents: entry.priceCents,
          stockQuantity: entry.stockQuantity,
          categoryId: entry.categoryId,
          brand: entry.brand,
          weightMetric: entry.weightMetric,
          weightImperial: entry.weightImperial,
          dimensionMetric: entry.dimensionMetric,
          dimensionImperial: entry.dimensionImperial,
          sizeOptions: entry.sizeOptions,
          material: entry.material,
          fit: entry.fit,
          careInstructions: entry.careInstructions,
          orientation: entry.orientation,
          framingInfo: entry.framingInfo,
          images: entry.images,
        });
        results.push({
          row: i + 1,
          name: entry.name,
          status: 'created',
          productId: created.id,
        });
        succeeded++;
      } catch (err) {
        results.push({
          row: i + 1,
          name: entry.name || '(unnamed)',
          status: 'error',
          error: this.friendlyDbError(err, entry),
        });
        failed++;
      }
    }

    const summary: BulkUploadResult = {
      total: entries.length,
      succeeded,
      failed,
      results,
    };

    return {
      success: true,
      data: summary,
      message: `Bulk upload complete: ${succeeded} created, ${failed} failed out of ${entries.length} total.`,
    };
  }

  // ─── Private helpers ──────────────────────────────────────────────────

  /**
   * Translate raw database / service errors into human-readable messages.
   * Avoids exposing SQL queries or internal details to end users (coding-rules §10).
   */
  private friendlyDbError(
    err: unknown,
    entry: { categoryId?: string },
  ): string {
    const raw = (err as Error).message ?? String(err);

    // Foreign-key violation on category_id
    if (
      raw.includes('category_id') ||
      raw.includes('violates foreign key') ||
      raw.includes('insert or update on table') ||
      raw.includes('is not present in table')
    ) {
      return `The Category ID "${entry.categoryId ?? '(empty)'}" does not match any existing category. Please use a valid category ID from your store.`;
    }

    // Unique constraint violation
    if (raw.includes('duplicate key') || raw.includes('unique constraint')) {
      return 'A product with this name or identifier already exists.';
    }

    // Not-null constraint violation
    if (
      raw.includes('not-null constraint') ||
      raw.includes('null value in column')
    ) {
      const colMatch = raw.match(/column "(\w+)"/);
      const col = colMatch
        ? colMatch[1].replace(/_/g, ' ')
        : 'a required field';
      return `Missing required value for "${col}". Please make sure all required fields are filled in.`;
    }

    // Data type / numeric errors
    if (raw.includes('invalid input syntax')) {
      return 'One of the values has an invalid format. Check that numbers are numbers, IDs are correct, etc.';
    }

    // Generic fallback — still keep internal details hidden
    return 'Something went wrong while saving this product. Please double-check all fields and try again.';
  }
}
