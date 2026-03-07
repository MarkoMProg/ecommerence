import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { eq, and, inArray, desc } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { randomUUID } from 'crypto';
import { DATABASE_CONNECTION } from '../database/database-connection';
import { cart, cartItem } from './schema';
import { product, productImage } from '../catalog/schema';
import { InventoryService } from '../inventory/inventory.service';

export interface CartItemWithProduct {
  id: string;
  productId: string;
  slug: string;
  quantity: number;
  productName: string;
  priceCents: number;
  imageUrl: string | null;
  /** Selected option for this line item (e.g. size "M"). Null when product has no options. */
  selectedOption: string | null;
  /** Current stock quantity for the product. Used for cart-level stock warnings on the frontend. */
  stockQuantity: number;
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
    private readonly inventoryService: InventoryService,
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

  /** Get user's cart (CART-006). Returns most recent by updatedAt. */
  async getCartByUserId(userId: string): Promise<CartWithItems | null> {
    const [c] = await this.db
      .select()
      .from(cart)
      .where(eq(cart.userId, userId))
      .orderBy(desc(cart.updatedAt))
      .limit(1);
    if (!c) return null;
    return this.enrichCartWithItems(c);
  }

  /** Get or create user cart (CART-006). */
  async getOrCreateUserCart(userId: string): Promise<CartWithItems> {
    const existing = await this.getCartByUserId(userId);
    if (existing) return existing;
    const id = randomUUID();
    await this.db.insert(cart).values({
      id,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const [c] = await this.db.select().from(cart).where(eq(cart.id, id));
    if (!c) throw new Error('Failed to create user cart');
    return this.enrichCartWithItems(c);
  }

  /**
   * Merge guest cart into user cart (CART-006). Adds guest items to user cart (combines quantities).
   * Deletes guest cart after merge. Returns user cart.
   */
  async mergeGuestCartIntoUser(
    guestCartId: string,
    userId: string,
  ): Promise<CartWithItems> {
    const guestCart = await this.getCartById(guestCartId);
    if (!guestCart || guestCart.userId) {
      return this.getOrCreateUserCart(userId);
    }
    let userCartData = await this.getOrCreateUserCart(userId);
    for (const item of guestCart.items) {
      userCartData = await this.addItem(userCartData.id, item.productId, item.quantity, item.selectedOption);
    }
    await this.db.delete(cart).where(eq(cart.id, guestCartId));
    return userCartData;
  }

  /** Get or create cart, add item, return cart. `created` true if new cart was created. */
  async getOrCreateCartAndAddItem(
    cartId: string | undefined,
    productId: string,
    quantity: number,
    selectedOption?: string | null,
  ): Promise<{ cart: CartWithItems; created: boolean }> {
    let cartData: CartWithItems;
    let created = false;
    if (cartId) {
      const existing = await this.getCartById(cartId);
      if (existing) {
        cartData = await this.addItem(cartId, productId, quantity, selectedOption);
      } else {
        cartData = await this.createGuestCart();
        created = true;
        cartData = await this.addItem(cartData.id, productId, quantity, selectedOption);
      }
    } else {
      cartData = await this.createGuestCart();
      created = true;
      cartData = await this.addItem(cartData.id, productId, quantity, selectedOption);
    }
    return { cart: cartData, created };
  }

  async addItem(
    cartId: string,
    productId: string,
    quantity = 1,
    selectedOption?: string | null,
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

    // Stock check: total cart quantity after this add must not exceed available stock
    const currentCartQty = existingItem?.quantity ?? 0;
    const newTotalQty = currentCartQty + quantity;
    await this.inventoryService.assertSufficientStock(productId, newTotalQty, existingProduct.name);

    if (existingItem) {
      const newQty = existingItem.quantity + quantity;
      await this.db
        .update(cartItem)
        .set({
          quantity: newQty,
          updatedAt: new Date(),
          // Update the selected option if a new one is provided (last-selection-wins)
          ...(selectedOption !== undefined ? { selectedOption: selectedOption ?? null } : {}),
        })
        .where(eq(cartItem.id, existingItem.id));
    } else {
      const id = randomUUID();
      await this.db.insert(cartItem).values({
        id,
        cartId,
        productId,
        quantity,
        selectedOption: selectedOption ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    const [c] = await this.db.select().from(cart).where(eq(cart.id, cartId));
    if (!c) throw new NotFoundException({ code: 'CART_NOT_FOUND', message: 'Cart not found' });
    return this.enrichCartWithItems(c);
  }

  /** Remove all items from cart. Used after order is completed. */
  async clearCart(cartId: string): Promise<void> {
    await this.db.delete(cartItem).where(eq(cartItem.cartId, cartId));
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

    // Stock check: new quantity must not exceed available stock
    await this.inventoryService.assertSufficientStock(productId, quantity);

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
        slug: product.slug,
        quantity: cartItem.quantity,
        productName: product.name,
        priceCents: product.priceCents,
        selectedOption: cartItem.selectedOption,
        stockQuantity: product.stockQuantity,
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
      slug: i.slug,
      quantity: i.quantity,
      productName: i.productName,
      priceCents: i.priceCents,
      imageUrl: primaryByProduct.get(i.productId) ?? null,
      selectedOption: i.selectedOption ?? null,
      stockQuantity: i.stockQuantity ?? 0,
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
