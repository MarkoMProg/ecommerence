import { relations } from 'drizzle-orm';
import {
  pgTable,
  text,
  integer,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
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
 * Line item in a cart. One row per product+option per cart; quantity can be updated.
 * The same product in different sizes creates separate line items.
 * DB unique index uses COALESCE so NULL options are treated as '' for uniqueness.
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
    /** Selected option at time of add (e.g. size "M"). NULL = product has no options. */
    selectedOption: text('selected_option'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    // NOTE: Actual DB index uses COALESCE for NULL handling — see migration 0008.
    uniqueIndex('cart_item_cart_product_option_idx').on(
      table.cartId,
      table.productId,
      table.selectedOption,
    ),
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
