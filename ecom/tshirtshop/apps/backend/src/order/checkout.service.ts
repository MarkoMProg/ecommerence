import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { randomUUID } from 'crypto';
import { DATABASE_CONNECTION } from '../database/database-connection';
import { encrypt, encryptNullable, decrypt, decryptNullable } from '../common/crypto.util';
import { order, orderItem } from './schema';
import { CartService } from '../cart/cart.service';
import { InventoryService } from '../inventory/inventory.service';
import { applyCoupon } from './coupons';
import type { ShippingAddressInput } from './dto/checkout.dto';

export interface OrderItemDto {
  id: string;
  productId: string;
  quantity: number;
  priceCentsAtOrder: number;
  productNameAtOrder: string;
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
  couponApplied?: boolean;
}

@Injectable()
export class CheckoutService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase,
    private readonly cartService: CartService,
    private readonly inventoryService: InventoryService,
  ) {}

  /**
   * Get order summary for cart (CHK-003). Applies shipping rules and optional coupon; no order created.
   */
  async getOrderSummary(cartId: string, couponCode?: string | null): Promise<OrderSummaryDto | null> {
    const cartData = await this.cartService.getCartById(cartId);
    if (!cartData || !cartData.items.length) return null;

    const coupon = couponCode ? applyCoupon(couponCode) : null;
    const freeShippingByCoupon = coupon?.freeShipping ?? false;
    const shippingCents =
      freeShippingByCoupon || cartData.totalCents >= FREE_SHIPPING_THRESHOLD_CENTS
        ? 0
        : DEFAULT_SHIPPING_CENTS;

    return {
      subtotalCents: cartData.totalCents,
      shippingCents,
      totalCents: cartData.totalCents + shippingCents,
      itemCount: cartData.itemCount,
      freeShippingThresholdCents: FREE_SHIPPING_THRESHOLD_CENTS,
      couponApplied: coupon ? true : false,
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
    couponCode?: string | null,
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

    // Optimistic stock pre-check (no row lock). The authoritative atomic decrement
    // happens in order.service.ts when payment is confirmed.
    const stockCheck = await this.inventoryService.validateStockForItems(
      cartData.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
    );
    if (!stockCheck.ok) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'INSUFFICIENT_STOCK',
          message: 'Some items in your cart are no longer available in the requested quantity',
          details: stockCheck.failures,
        },
      });
    }

    const now = new Date();
    const orderId = randomUUID();

    const coupon = couponCode ? applyCoupon(couponCode) : null;
    const freeShippingByCoupon = coupon?.freeShipping ?? false;
    const shippingCents =
      freeShippingByCoupon || cartData.totalCents >= FREE_SHIPPING_THRESHOLD_CENTS
        ? 0
        : DEFAULT_SHIPPING_CENTS;
    const totalCents = cartData.totalCents + shippingCents;

    await this.db.insert(order).values({
      id: orderId,
      userId: userId ?? null,
      status: 'pending',
      shippingFullName: encrypt(String(shippingAddress.fullName ?? '').trim()),
      shippingLine1: encrypt(String(shippingAddress.line1 ?? '').trim()),
      shippingLine2: encryptNullable(shippingAddress.line2 != null ? String(shippingAddress.line2).trim() : null),
      shippingCity: encrypt(String(shippingAddress.city ?? '').trim()),
      shippingStateOrProvince: encrypt(String(shippingAddress.stateOrProvince ?? '').trim()),
      shippingPostalCode: encrypt(String(shippingAddress.postalCode ?? '').trim()),
      shippingCountry: encrypt(String(shippingAddress.country ?? '').trim()),
      shippingPhone: encryptNullable(shippingAddress.phone != null ? String(shippingAddress.phone).trim() : null),
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
        selectedOptionAtOrder: item.selectedOption ?? null,
        createdAt: now,
      });
    }

    await this.cartService.clearCart(cartId);

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
}
