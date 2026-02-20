import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { eq, desc } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DATABASE_CONNECTION } from '../database/database-connection';
import { order, orderItem } from './schema';
import type { OrderStatus } from './schema';

/** Valid status transitions. ORD-003 */
const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['paid', 'cancelled'],
  paid: ['shipped', 'cancelled'],
  shipped: ['completed'],
  completed: [],
  cancelled: [],
};

export interface OrderItemDto {
  id: string;
  productId: string;
  quantity: number;
  priceCentsAtOrder: number;
  productNameAtOrder: string;
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
  items: OrderItemDto[];
  createdAt: Date;
}

@Injectable()
export class OrderService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase,
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
      shippingFullName: o.shippingFullName,
      shippingLine1: o.shippingLine1,
      shippingLine2: o.shippingLine2,
      shippingCity: o.shippingCity,
      shippingStateOrProvince: o.shippingStateOrProvince,
      shippingPostalCode: o.shippingPostalCode,
      shippingCountry: o.shippingCountry,
      shippingPhone: o.shippingPhone,
      subtotalCents: o.subtotalCents,
      shippingCents: o.shippingCents,
      totalCents: o.totalCents,
      items: items.map((i) => ({
        id: i.id,
        productId: i.productId,
        quantity: i.quantity,
        priceCentsAtOrder: i.priceCentsAtOrder,
        productNameAtOrder: i.productNameAtOrder,
      })),
      createdAt: o.createdAt,
    };
  }

  /**
   * Update order status (ORD-003). Validates lifecycle transitions.
   * WARNING: Endpoint is unauthenticated. Add auth for production (admin or webhook secret).
   */
  async updateOrderStatus(orderId: string, newStatus: string): Promise<OrderDto | null> {
    const status = newStatus.trim().toLowerCase();
    if (!(['pending', 'paid', 'shipped', 'completed', 'cancelled'] as const).includes(status as OrderStatus)) {
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

    return this.getOrderById(orderId.trim());
  }

  /**
   * Cancel order (ORD-004). Only pending or paid orders can be cancelled.
   * Shipped/completed orders cannot be cancelled; use refund workflow (ORD-005) instead.
   */
  async cancelOrder(orderId: string): Promise<OrderDto | null> {
    return this.updateOrderStatus(orderId.trim(), 'cancelled');
  }
}
