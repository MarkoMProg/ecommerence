import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Req,
  HttpCode,
  HttpStatus,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DATABASE_CONNECTION } from '../database/database-connection';
import { product as productTable } from '../catalog/schema';
import { BetterAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrderService } from './order.service';
import { CartService } from '../cart/cart.service';
import type { CartWithItems } from '../cart/cart.service';

/** Per-item result returned from the reorder endpoint. */
export interface ReorderItemResult {
  productId: string;
  productNameAtOrder: string;
  requestedQuantity: number;
  addedQuantity: number;
  /** Current catalog price in cents (0 if product not found). */
  currentPriceCents: number;
  status: 'added' | 'adjusted' | 'unavailable';
  /** Human-readable reason, present only when status is 'unavailable'. */
  reason?: string;
}

/** Maximum quantity we'll add per item during reorder. */
const MAX_REORDER_QTY = 99;

@Controller('api/v1/orders')
export class OrdersController {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase,
    private readonly orderService: OrderService,
    private readonly cartService: CartService,
  ) {}

  /**
   * List my orders (UI-006). Requires authentication.
   */
  @Get()
  @UseGuards(BetterAuthGuard)
  async getMyOrders(@Req() req: Request) {
    const user = (req as any).user;
    const orders = await this.orderService.getOrdersByUserId(user.id);
    return {
      success: true,
      data: orders,
      message: 'Orders retrieved',
    };
  }

  /**
   * Cancel order (ORD-004). Only pending or paid orders can be cancelled.
   */
  @Post(':orderId/cancel')
  @AllowAnonymous()
  @HttpCode(HttpStatus.OK)
  async cancelOrder(@Param('orderId') orderId: string) {
    const order = await this.orderService.cancelOrder(orderId.trim());
    if (!order) {
      throw new NotFoundException({
        success: false,
        error: { code: 'ORDER_NOT_FOUND', message: 'Order not found' },
      });
    }
    return {
      success: true,
      data: order,
      message: 'Order cancelled',
    };
  }

  /**
   * Update order status (ORD-003). Validates lifecycle transitions.
   * PATCH body: { status: "paid" | "shipped" | "completed" | "cancelled" }
   */
  @Patch(':orderId/status')
  @AllowAnonymous()
  async updateStatus(
    @Param('orderId') orderId: string,
    @Body() body: { status?: string },
  ) {
    if (!body?.status?.trim()) {
      throw new BadRequestException({
        success: false,
        error: { code: 'STATUS_REQUIRED', message: 'status is required' },
      });
    }
    const order = await this.orderService.updateOrderStatus(orderId.trim(), body.status.trim());
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

  /**
   * Get order by ID (CHK-004). Used for order confirmation page.
   */
  @Get(':orderId')
  @AllowAnonymous()
  async getOrder(@Param('orderId') orderId: string) {
    const order = await this.orderService.getOrderById(orderId.trim());
    if (!order) {
      throw new NotFoundException({
        success: false,
        error: { code: 'ORDER_NOT_FOUND', message: 'Order not found' },
      });
    }
    return {
      success: true,
      data: order,
      message: 'Order retrieved',
    };
  }

  /**
   * Reorder: add items from a past order into the current user's cart (ORD-006).
   *
   * - Uses CURRENT catalog prices — historical prices are not replayed.
   * - Respects current stock; quantities are capped at available stock.
   * - Items whose products no longer exist or are out of stock are skipped.
   * - Never mutates the original order record.
   * - Requires authentication; enforces ownership — users can only reorder their own orders.
   */
  @Post(':orderId/reorder')
  @UseGuards(BetterAuthGuard)
  @HttpCode(HttpStatus.OK)
  async reorder(@Req() req: Request, @Param('orderId') orderId: string) {
    const user = (req as any).user as { id: string };

    const order = await this.orderService.getOrderById(orderId.trim());
    if (!order) {
      throw new NotFoundException({
        success: false,
        error: { code: 'ORDER_NOT_FOUND', message: 'Order not found' },
      });
    }

    // Strict ownership check: only the original buyer can reorder
    if (order.userId !== user.id) {
      throw new ForbiddenException({
        success: false,
        error: { code: 'ORDER_NOT_YOURS', message: 'You can only reorder your own orders' },
      });
    }

    if (!order.items.length) {
      throw new BadRequestException({
        success: false,
        error: { code: 'ORDER_EMPTY', message: 'Order has no items to reorder' },
      });
    }

    // Validate each item against current catalog state
    const itemResults: ReorderItemResult[] = [];

    for (const item of order.items) {
      if (!item.productId) {
        // Defensive: shouldn't happen due to onDelete: restrict, but handle gracefully
        itemResults.push({
          productId: '',
          productNameAtOrder: item.productNameAtOrder,
          requestedQuantity: item.quantity,
          addedQuantity: 0,
          currentPriceCents: 0,
          status: 'unavailable',
          reason: 'Product no longer available',
        });
        continue;
      }

      const [currentProduct] = await this.db
        .select({
          id: productTable.id,
          priceCents: productTable.priceCents,
          stockQuantity: productTable.stockQuantity,
        })
        .from(productTable)
        .where(eq(productTable.id, item.productId));

      if (!currentProduct) {
        itemResults.push({
          productId: item.productId,
          productNameAtOrder: item.productNameAtOrder,
          requestedQuantity: item.quantity,
          addedQuantity: 0,
          currentPriceCents: 0,
          status: 'unavailable',
          reason: 'Product no longer available',
        });
        continue;
      }

      if (currentProduct.stockQuantity <= 0) {
        itemResults.push({
          productId: item.productId,
          productNameAtOrder: item.productNameAtOrder,
          requestedQuantity: item.quantity,
          addedQuantity: 0,
          currentPriceCents: currentProduct.priceCents,
          status: 'unavailable',
          reason: 'Out of stock',
        });
        continue;
      }

      // Cap at available stock and sanity max
      const requestedQty = Math.min(item.quantity, MAX_REORDER_QTY);
      const addedQty = Math.min(requestedQty, currentProduct.stockQuantity);

      itemResults.push({
        productId: item.productId,
        productNameAtOrder: item.productNameAtOrder,
        requestedQuantity: item.quantity,
        addedQuantity: addedQty,
        currentPriceCents: currentProduct.priceCents,
        status: addedQty < item.quantity ? 'adjusted' : 'added',
      });
    }

    // Add available items to the user's cart (addItem merges with existing quantity)
    const validItems = itemResults.filter((r) => r.addedQuantity > 0);
    let cartData: CartWithItems = await this.cartService.getOrCreateUserCart(user.id);

    for (const item of validItems) {
      cartData = await this.cartService.addItem(cartData.id, item.productId, item.addedQuantity);
    }

    const addedCount = itemResults.filter((r) => r.status === 'added').length;
    const adjustedCount = itemResults.filter((r) => r.status === 'adjusted').length;
    const unavailableCount = itemResults.filter((r) => r.status === 'unavailable').length;

    const message =
      validItems.length === 0
        ? 'No items could be added — all are currently unavailable.'
        : unavailableCount > 0
          ? `${validItems.length} item${validItems.length !== 1 ? 's' : ''} added to cart; ${unavailableCount} unavailable.`
          : `All ${addedCount + adjustedCount} item${addedCount + adjustedCount !== 1 ? 's' : ''} added to cart.`;

    return {
      success: true,
      data: {
        cart: cartData,
        addedCount,
        adjustedCount,
        unavailableCount,
        items: itemResults,
      },
      message,
    };
  }
}
