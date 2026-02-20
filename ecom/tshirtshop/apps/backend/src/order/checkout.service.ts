import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { randomUUID } from 'crypto';
import { DATABASE_CONNECTION } from '../database/database-connection';
import { order, orderItem } from './schema';
import { CartService } from '../cart/cart.service';
import type { ShippingAddressInput } from './dto/checkout.dto';

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

/** Free shipping threshold: $75 */
export const FREE_SHIPPING_THRESHOLD_CENTS = 7500;
/** Default shipping cost when under threshold (cents) */
export const DEFAULT_SHIPPING_CENTS = 599;

export interface OrderSummaryDto {
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  itemCount: number;
  freeShippingThresholdCents: number;
}

@Injectable()
export class CheckoutService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase,
    private readonly cartService: CartService,
  ) {}

  /**
   * Get order summary for cart (CHK-003). Applies shipping rules; no order created.
   */
  async getOrderSummary(cartId: string): Promise<OrderSummaryDto | null> {
    const cartData = await this.cartService.getCartById(cartId);
    if (!cartData || !cartData.items.length) return null;

    const shippingCents =
      cartData.totalCents >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : DEFAULT_SHIPPING_CENTS;

    return {
      subtotalCents: cartData.totalCents,
      shippingCents,
      totalCents: cartData.totalCents + shippingCents,
      itemCount: cartData.itemCount,
      freeShippingThresholdCents: FREE_SHIPPING_THRESHOLD_CENTS,
    };
  }

  /**
   * Create order from cart. Copies items with price snapshot.
   * Order status: pending (awaiting payment).
   * Cart is NOT cleared — call separately if desired.
   */
  async createOrderFromCart(
    cartId: string,
    shippingAddress: ShippingAddressInput,
    userId?: string | null,
  ): Promise<OrderDto> {
    const cartData = await this.cartService.getCartById(cartId);
    if (!cartData) {
      throw new NotFoundException({ code: 'CART_NOT_FOUND', message: 'Cart not found or expired' });
    }
    if (!cartData.items.length) {
      throw new BadRequestException({
        code: 'CART_EMPTY',
        message: 'Cannot checkout with an empty cart',
      });
    }

    const now = new Date();
    const orderId = randomUUID();

    const shippingCents =
      cartData.totalCents >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : DEFAULT_SHIPPING_CENTS;
    const totalCents = cartData.totalCents + shippingCents;

    await this.db.insert(order).values({
      id: orderId,
      userId: userId ?? null,
      status: 'pending',
      shippingFullName: String(shippingAddress.fullName ?? '').trim(),
      shippingLine1: String(shippingAddress.line1 ?? '').trim(),
      shippingLine2: shippingAddress.line2 != null ? String(shippingAddress.line2).trim() : null,
      shippingCity: String(shippingAddress.city ?? '').trim(),
      shippingStateOrProvince: String(shippingAddress.stateOrProvince ?? '').trim(),
      shippingPostalCode: String(shippingAddress.postalCode ?? '').trim(),
      shippingCountry: String(shippingAddress.country ?? '').trim(),
      shippingPhone: shippingAddress.phone != null ? String(shippingAddress.phone).trim() : null,
      subtotalCents: cartData.totalCents,
      shippingCents,
      totalCents,
      createdAt: now,
      updatedAt: now,
    });

    for (const item of cartData.items) {
      await this.db.insert(orderItem).values({
        id: randomUUID(),
        orderId,
        productId: item.productId,
        quantity: item.quantity,
        priceCentsAtOrder: item.priceCents,
        productNameAtOrder: item.productName,
        createdAt: now,
      });
    }

    const [o] = await this.db.select().from(order).where(eq(order.id, orderId));
    if (!o) throw new Error('Order creation failed');

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
}
