import { relations } from 'drizzle-orm';
import { pgTable, text, integer, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { user } from '../auth/schema';
import { product } from '../catalog/schema';

/**
 * Shopping cart. Supports both guest (userId null) and authenticated (userId set) carts.
 * Guest carts are identified by cart id stored in cookie.
 */
export const cart = pgTable('cart', {
  id: text('id').primaryKey(),
  /** Nullable: null = guest cart, set = user cart */
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

/**
 * Line item in a cart. One row per product per cart; quantity can be updated.
 */
export const cartItem = pgTable(
  'cart_item',
  {
    id: text('id').primaryKey(),
    cartId: text('cart_id')
      .notNull()
      .references(() => cart.id, { onDelete: 'cascade' }),
    productId: text('product_id')
      .notNull()
      .references(() => product.id, { onDelete: 'cascade' }),
    quantity: integer('quantity').notNull().default(1),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex('cart_item_cart_product_idx').on(table.cartId, table.productId),
  ],
);

export const cartRelations = relations(cart, ({ one, many }) => ({
  user: one(user, {
    fields: [cart.userId],
    references: [user.id],
  }),
  items: many(cartItem),
}));

export const cartItemRelations = relations(cartItem, ({ one }) => ({
  cart: one(cart, {
    fields: [cartItem.cartId],
    references: [cart.id],
  }),
  product: one(product, {
    fields: [cartItem.productId],
    references: [product.id],
  }),
}));
