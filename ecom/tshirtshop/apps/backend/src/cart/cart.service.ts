import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and, inArray } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { randomUUID } from 'crypto';
import { DATABASE_CONNECTION } from '../database/database-connection';
import { cart, cartItem } from './schema';
import { product, productImage } from '../catalog/schema';

export interface CartItemWithProduct {
  id: string;
  productId: string;
  quantity: number;
  productName: string;
  priceCents: number;
  imageUrl: string | null;
}

export interface CartWithItems {
  id: string;
  userId: string | null;
  items: CartItemWithProduct[];
  itemCount: number;
  totalCents: number;
}

@Injectable()
export class CartService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase,
  ) {}

  async getCartById(cartId: string): Promise<CartWithItems | null> {
    const [c] = await this.db.select().from(cart).where(eq(cart.id, cartId));
    if (!c) return null;
    return this.enrichCartWithItems(c);
  }

  async createGuestCart(): Promise<CartWithItems> {
    const id = randomUUID();
    await this.db.insert(cart).values({
      id,
      userId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const [c] = await this.db.select().from(cart).where(eq(cart.id, id));
    if (!c) throw new Error('Failed to create cart');
    return this.enrichCartWithItems(c);
  }

  async getOrCreateCart(cartId: string | undefined): Promise<CartWithItems> {
    if (cartId) {
      const existing = await this.getCartById(cartId);
      if (existing) return existing;
    }
    return this.createGuestCart();
  }

  /** Get or create cart, add item, return cart. `created` true if new cart was created. */
  async getOrCreateCartAndAddItem(
    cartId: string | undefined,
    productId: string,
    quantity: number,
  ): Promise<{ cart: CartWithItems; created: boolean }> {
    let cartData: CartWithItems;
    let created = false;
    if (cartId) {
      const existing = await this.getCartById(cartId);
      if (existing) {
        cartData = await this.addItem(cartId, productId, quantity);
      } else {
        cartData = await this.createGuestCart();
        created = true;
        cartData = await this.addItem(cartData.id, productId, quantity);
      }
    } else {
      cartData = await this.createGuestCart();
      created = true;
      cartData = await this.addItem(cartData.id, productId, quantity);
    }
    return { cart: cartData, created };
  }

  async addItem(
    cartId: string,
    productId: string,
    quantity = 1,
  ): Promise<CartWithItems> {
    if (quantity < 1) quantity = 1;

    const [existingCart] = await this.db.select().from(cart).where(eq(cart.id, cartId));
    if (!existingCart) {
      throw new NotFoundException({ code: 'CART_NOT_FOUND', message: 'Cart not found' });
    }

    const [existingProduct] = await this.db.select().from(product).where(eq(product.id, productId));
    if (!existingProduct) {
      throw new NotFoundException({ code: 'PRODUCT_NOT_FOUND', message: 'Product not found' });
    }

    const [existingItem] = await this.db
      .select()
      .from(cartItem)
      .where(and(eq(cartItem.cartId, cartId), eq(cartItem.productId, productId)));

    if (existingItem) {
      const newQty = existingItem.quantity + quantity;
      await this.db
        .update(cartItem)
        .set({ quantity: newQty, updatedAt: new Date() })
        .where(eq(cartItem.id, existingItem.id));
    } else {
      const id = randomUUID();
      await this.db.insert(cartItem).values({
        id,
        cartId,
        productId,
        quantity,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    const [c] = await this.db.select().from(cart).where(eq(cart.id, cartId));
    if (!c) throw new NotFoundException({ code: 'CART_NOT_FOUND', message: 'Cart not found' });
    return this.enrichCartWithItems(c);
  }

  async removeItem(cartId: string, productId: string): Promise<CartWithItems> {
    const [existingCart] = await this.db.select().from(cart).where(eq(cart.id, cartId));
    if (!existingCart) {
      throw new NotFoundException({ code: 'CART_NOT_FOUND', message: 'Cart not found' });
    }

    const [existingItem] = await this.db
      .select()
      .from(cartItem)
      .where(and(eq(cartItem.cartId, cartId), eq(cartItem.productId, productId)));

    if (!existingItem) {
      throw new NotFoundException({ code: 'ITEM_NOT_FOUND', message: 'Item not found in cart' });
    }

    await this.db
      .delete(cartItem)
      .where(eq(cartItem.id, existingItem.id));

    const [c] = await this.db.select().from(cart).where(eq(cart.id, cartId));
    if (!c) throw new NotFoundException({ code: 'CART_NOT_FOUND', message: 'Cart not found' });
    return this.enrichCartWithItems(c);
  }

  async updateItemQuantity(
    cartId: string,
    productId: string,
    quantity: number,
  ): Promise<CartWithItems> {
    const [existingCart] = await this.db.select().from(cart).where(eq(cart.id, cartId));
    if (!existingCart) {
      throw new NotFoundException({ code: 'CART_NOT_FOUND', message: 'Cart not found' });
    }

    if (quantity < 1) {
      return this.removeItem(cartId, productId);
    }

    const [existingItem] = await this.db
      .select()
      .from(cartItem)
      .where(and(eq(cartItem.cartId, cartId), eq(cartItem.productId, productId)));

    if (!existingItem) {
      throw new NotFoundException({ code: 'ITEM_NOT_FOUND', message: 'Item not found in cart' });
    }

    await this.db
      .update(cartItem)
      .set({ quantity, updatedAt: new Date() })
      .where(eq(cartItem.id, existingItem.id));

    const [c] = await this.db.select().from(cart).where(eq(cart.id, cartId));
    if (!c) throw new NotFoundException({ code: 'CART_NOT_FOUND', message: 'Cart not found' });
    return this.enrichCartWithItems(c);
  }

  private async enrichCartWithItems(c: typeof cart.$inferSelect): Promise<CartWithItems> {
    const items = await this.db
      .select({
        id: cartItem.id,
        productId: cartItem.productId,
        quantity: cartItem.quantity,
        productName: product.name,
        priceCents: product.priceCents,
      })
      .from(cartItem)
      .innerJoin(product, eq(cartItem.productId, product.id))
      .where(eq(cartItem.cartId, c.id));

    const productIds = items.map((i) => i.productId);
    const images =
      productIds.length > 0
        ? await this.db
            .select({
              productId: productImage.productId,
              imageUrl: productImage.imageUrl,
              isPrimary: productImage.isPrimary,
            })
            .from(productImage)
            .where(inArray(productImage.productId, productIds))
        : [];

    const primaryByProduct = new Map<string, string>();
    for (const img of images) {
      if (img.isPrimary || !primaryByProduct.has(img.productId)) {
        primaryByProduct.set(img.productId, img.imageUrl);
      }
    }

    const enriched: CartItemWithProduct[] = items.map((i) => ({
      id: i.id,
      productId: i.productId,
      quantity: i.quantity,
      productName: i.productName,
      priceCents: i.priceCents,
      imageUrl: primaryByProduct.get(i.productId) ?? null,
    }));

    const itemCount = enriched.reduce((sum, i) => sum + i.quantity, 0);
    const totalCents = enriched.reduce((sum, i) => sum + i.priceCents * i.quantity, 0);

    return {
      id: c.id,
      userId: c.userId,
      items: enriched,
      itemCount,
      totalCents,
    };
  }
}
