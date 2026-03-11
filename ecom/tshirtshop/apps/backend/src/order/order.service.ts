import { Injectable, Inject, BadRequestException, ForbiddenException } from '@nestjs/common';
import { eq, desc } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DATABASE_CONNECTION } from '../database/database-connection';
import { order, orderItem } from './schema';
import type { OrderStatus } from './schema';
import { InventoryService } from '../inventory/inventory.service';
import { StripeService } from './stripe.service';
import { decrypt, decryptNullable } from '../common/crypto.util';

/** Valid status transitions. ORD-003 */
const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['paid', 'cancelled'],
  paid: ['shipped', 'cancelled', 'refunded'],
  shipped: ['completed', 'refunded'],
  completed: ['refunded'],
  cancelled: [],
  refunded: [],
};

export interface OrderItemDto {
  id: string;
  productId: string;
  quantity: number;
  priceCentsAtOrder: number;
  productNameAtOrder: string;
  /** Snapshot of the selected option at order time (e.g. size "M"). Null when no option was selected. */
  selectedOptionAtOrder: string | null;
}

export interface OrderDto {
  id: string;
  userId: string | null;
  status: string;
  shippingFullName: string;
  shippingLine1: string;
  shippingLine2: string | null;
  shippingCity: string;
  shippingStateOrProvince: string;
  shippingPostalCode: string;
  shippingCountry: string;
  shippingPhone: string | null;
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  /** Stripe Checkout Session ID when paid via Stripe (PAY-004). */
  stripeSessionId: string | null;
  /** When order was marked paid (PAY-004). */
  paidAt: Date | null;
  /** Stripe Refund ID when refund was issued. */
  stripeRefundId: string | null;
  /** When refund was issued. */
  refundedAt: Date | null;
  items: OrderItemDto[];
  createdAt: Date;
}

/** Statuses that indicate stock has already been decremented for the order */
const PAID_STATUSES: OrderStatus[] = ['paid', 'shipped', 'completed'];

/** Statuses that allow customer-initiated cancel-with-refund (paid, not yet shipped). */
const CUSTOMER_CANCEL_ELIGIBLE_STATUSES: OrderStatus[] = ['paid'];

@Injectable()
export class OrderService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase,
    private readonly inventoryService: InventoryService,
    private readonly stripeService: StripeService,
  ) {}

  /**
   * Get all orders (UI-007 admin). Returns most recent first.
   */
  async getAllOrders(): Promise<OrderDto[]> {
    const orders = await this.db
      .select()
      .from(order)
      .orderBy(desc(order.createdAt));

    const result: OrderDto[] = [];
    for (const o of orders) {
      const dto = await this.getOrderById(o.id);
      if (dto) result.push(dto);
    }
    return result;
  }

  /**
   * Get orders for a user (UI-006). Returns most recent first.
   */
  async getOrdersByUserId(userId: string): Promise<OrderDto[]> {
    const orders = await this.db
      .select()
      .from(order)
      .where(eq(order.userId, userId))
      .orderBy(desc(order.createdAt));

    const result: OrderDto[] = [];
    for (const o of orders) {
      const dto = await this.getOrderById(o.id);
      if (dto) result.push(dto);
    }
    return result;
  }

  /**
   * Get order by ID (CHK-004). Used for order confirmation page.
   * WARNING: Currently allows unauthenticated fetch by order ID (UUID is unguessable).
   * For production, consider signed confirmation tokens or requiring auth.
   */
  async getOrderById(orderId: string): Promise<OrderDto | null> {
    const [o] = await this.db.select().from(order).where(eq(order.id, orderId));
    if (!o) return null;

    const items = await this.db
      .select()
      .from(orderItem)
      .where(eq(orderItem.orderId, orderId));

    return {
      id: o.id,
      userId: o.userId,
      status: o.status,
      shippingFullName: decrypt(o.shippingFullName),
      shippingLine1: decrypt(o.shippingLine1),
      shippingLine2: decryptNullable(o.shippingLine2),
      shippingCity: decrypt(o.shippingCity),
      shippingStateOrProvince: decrypt(o.shippingStateOrProvince),
      shippingPostalCode: decrypt(o.shippingPostalCode),
      shippingCountry: decrypt(o.shippingCountry),
      shippingPhone: decryptNullable(o.shippingPhone),
      subtotalCents: o.subtotalCents,
      shippingCents: o.shippingCents,
      totalCents: o.totalCents,
      stripeSessionId: o.stripeSessionId ?? null,
      paidAt: o.paidAt ?? null,
      stripeRefundId: o.stripeRefundId ?? null,
      refundedAt: o.refundedAt ?? null,
      items: items.map((i) => ({
        id: i.id,
        productId: i.productId,
        quantity: i.quantity,
        priceCentsAtOrder: i.priceCentsAtOrder,
        productNameAtOrder: i.productNameAtOrder,
        selectedOptionAtOrder: i.selectedOptionAtOrder ?? null,
      })),
      createdAt: o.createdAt,
    };
  }

  /**
   * Mark order as paid if currently pending (PAY-002 idempotency).
   * Stores stripeSessionId and paidAt when provided (PAY-004).
   * Atomically decrements stock for all order items after marking as paid.
   *
   * The "if pending" guard makes this idempotent — stock is decremented exactly
   * once per order. If a stock decrement fails here (extremely rare race condition
   * where two users paid simultaneously for the last unit), the order is still
   * marked as paid (payment is authoritative) and the failure is logged for
   * admin review. Stock will show negative; admin should restock or cancel.
   *
   * Returns order; no-op (returns current state) if already paid.
   * Used by both the webhook and verify-payment paths.
   */
  async markOrderPaidIfPending(
    orderId: string,
    paymentMeta?: { stripeSessionId?: string },
  ): Promise<OrderDto | null> {
    const o = await this.getOrderById(orderId.trim());
    if (!o) return null;
    if (o.status === 'paid') return o; // idempotent — already processed
    if (o.status !== 'pending') return o;

    const now = new Date();
    const sessionId = paymentMeta?.stripeSessionId?.trim() || null;

    await this.db
      .update(order)
      .set({
        status: 'paid',
        stripeSessionId: sessionId,
        paidAt: now,
        updatedAt: now,
      })
      .where(eq(order.id, orderId.trim()));

    // Atomic stock decrement with row-level locking
    const stockResult = await this.inventoryService.decrementStockForOrder(
      o.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
    );

    if (!stockResult.ok) {
      // WARNING: Payment captured but stock was insufficient — oversell detected.
      // The order remains paid (payment is authoritative). Admin must resolve manually.
      // This should only happen when two users pay for the last unit within milliseconds.
      console.error(
        `[InventoryService] OVERSELL_WARNING orderId=${orderId}: ` +
          `stock insufficient for items after payment. Failures:`,
        stockResult.failures,
      );
    }

    return this.getOrderById(orderId.trim());
  }

  /**
   * Update order status (ORD-003). Validates lifecycle transitions.
   * WARNING: Endpoint is unauthenticated. Add auth for production (admin or webhook secret).
   */
  async updateOrderStatus(orderId: string, newStatus: string): Promise<OrderDto | null> {
    const status = newStatus.trim().toLowerCase();
    if (!(['pending', 'paid', 'shipped', 'completed', 'cancelled', 'refunded'] as const).includes(status as OrderStatus)) {
      throw new BadRequestException({
        success: false,
        error: { code: 'INVALID_STATUS', message: `Invalid status: ${newStatus}` },
      });
    }

    const [o] = await this.db.select().from(order).where(eq(order.id, orderId.trim()));
    if (!o) return null;

    const allowed = ALLOWED_TRANSITIONS[o.status as OrderStatus];
    if (!allowed?.includes(status as OrderStatus)) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'INVALID_TRANSITION',
          message: `Cannot transition from ${o.status} to ${status}`,
        },
      });
    }

    await this.db
      .update(order)
      .set({ status, updatedAt: new Date() })
      .where(eq(order.id, orderId.trim()));

    // Restore stock when cancelling/refunding a paid order (stock was already decremented at payment)
    const shouldRestock =
      (status === 'cancelled' || status === 'refunded') &&
      PAID_STATUSES.includes(o.status as OrderStatus);

    if (shouldRestock) {
      const items = await this.db
        .select({ productId: orderItem.productId, quantity: orderItem.quantity })
        .from(orderItem)
        .where(eq(orderItem.orderId, orderId.trim()));

      await this.inventoryService.incrementStockForOrder(items);
    }

    return this.getOrderById(orderId.trim());
  }

  /**
   * Cancel order (ORD-004). Only pending or paid orders can be cancelled.
   * Shipped/completed orders cannot be cancelled; use refundOrder (ORD-005) instead.
   * @deprecated Use cancelOrderWithRefund for paid orders (issues Stripe refund).
   */
  async cancelOrder(orderId: string): Promise<OrderDto | null> {
    return this.updateOrderStatus(orderId.trim(), 'cancelled');
  }

  /**
   * Customer-initiated cancel with full refund.
   * Only eligible when: order is paid, not shipped, belongs to user, has Stripe payment.
   * Issues full refund via Stripe, marks order cancelled, restocks inventory.
   */
  async cancelOrderWithRefund(
    orderId: string,
    userId: string,
  ): Promise<{ order: OrderDto; refundId: string } | { error: string; code: string }> {
    const id = orderId.trim();
    const [o] = await this.db.select().from(order).where(eq(order.id, id));
    if (!o) {
      return { error: 'Order not found', code: 'ORDER_NOT_FOUND' };
    }

    if (o.userId !== userId) {
      throw new ForbiddenException({
        success: false,
        error: { code: 'ORDER_NOT_YOURS', message: 'You can only cancel your own orders' },
      });
    }

    if (!CUSTOMER_CANCEL_ELIGIBLE_STATUSES.includes(o.status as OrderStatus)) {
      if (['shipped', 'completed'].includes(o.status)) {
        return {
          error: 'This order can no longer be cancelled because it has already shipped.',
          code: 'ORDER_ALREADY_SHIPPED',
        };
      }
      if (['cancelled', 'refunded'].includes(o.status)) {
        return {
          error: 'This order has already been cancelled or refunded.',
          code: 'ORDER_ALREADY_CANCELLED',
        };
      }
      return {
        error: 'This order cannot be cancelled.',
        code: 'ORDER_NOT_CANCELLABLE',
      };
    }

    if (o.stripeRefundId) {
      return {
        error: 'Refund has already been issued for this order.',
        code: 'REFUND_ALREADY_ISSUED',
      };
    }

    const sessionId = o.stripeSessionId?.trim();
    const isFreeOrder = o.totalCents <= 0;

    // $0 orders: no Stripe refund needed — just cancel and restock
    if (isFreeOrder) {
      await this.db
        .update(order)
        .set({ status: 'cancelled', updatedAt: new Date() })
        .where(eq(order.id, id));
      const items = await this.db
        .select({ productId: orderItem.productId, quantity: orderItem.quantity })
        .from(orderItem)
        .where(eq(orderItem.orderId, id));
      await this.inventoryService.incrementStockForOrder(items);
      const updated = await this.getOrderById(id);
      return updated ? { order: updated, refundId: 'free_order' } : { error: 'Order not found', code: 'ORDER_NOT_FOUND' };
    }

    if (!sessionId) {
      return {
        error: 'This order was not paid via Stripe and cannot be refunded automatically.',
        code: 'NO_STRIPE_PAYMENT',
      };
    }

    if (!this.stripeService.isConfigured()) {
      return {
        error: 'Refunds are not available at this time. Please contact support.',
        code: 'STRIPE_NOT_CONFIGURED',
      };
    }

    try {
      const { refundId } = await this.stripeService.createRefundForSession(
        sessionId,
        o.totalCents,
      );

      const now = new Date();
      await this.db
        .update(order)
        .set({
          status: 'cancelled',
          stripeRefundId: refundId,
          refundedAt: now,
          refundAmountCents: o.totalCents,
          updatedAt: now,
        })
        .where(eq(order.id, id));

      const items = await this.db
        .select({ productId: orderItem.productId, quantity: orderItem.quantity })
        .from(orderItem)
        .where(eq(orderItem.orderId, id));
      await this.inventoryService.incrementStockForOrder(items);

      const updated = await this.getOrderById(id);
      return updated ? { order: updated, refundId } : { error: 'Order not found', code: 'ORDER_NOT_FOUND' };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Refund failed';
      if (msg.includes('already been refunded') || msg.includes('Refund already exists')) {
        await this.db
          .update(order)
          .set({ status: 'cancelled', updatedAt: new Date() })
          .where(eq(order.id, id));
        const updated = await this.getOrderById(id);
        return updated
          ? { order: updated, refundId: 'already_refunded' }
          : { error: 'Order not found', code: 'ORDER_NOT_FOUND' };
      }
      throw new BadRequestException({
        success: false,
        error: { code: 'REFUND_FAILED', message: msg },
      });
    }
  }

  /**
   * Refund order (ORD-005). Only paid, shipped, or completed orders can be refunded.
   * Admin-only. When PAY-001 exists, integrate with Stripe/PayPal refund API and restore stock.
   */
  async refundOrder(orderId: string): Promise<OrderDto | null> {
    return this.updateOrderStatus(orderId.trim(), 'refunded');
  }
}
