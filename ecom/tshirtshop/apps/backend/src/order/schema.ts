import { relations } from 'drizzle-orm';
import { pgTable, text, integer, timestamp } from 'drizzle-orm/pg-core';
import { user } from '../auth/schema';
import { product } from '../catalog/schema';

/**
 * Order status lifecycle:
 * - pending: Created, awaiting payment (PAY-001)
 * - paid: Payment confirmed
 * - shipped: Order shipped
 * - completed: Delivered
 * - cancelled: Cancelled by user or system
 * - refunded: Refunded (ORD-005); from paid/shipped/completed
 */
export const orderStatusEnum = ['pending', 'paid', 'shipped', 'completed', 'cancelled', 'refunded'] as const;
export type OrderStatus = (typeof orderStatusEnum)[number];

/**
 * Placed order. Created from cart at checkout.
 * Shipping address stored as columns for validation and indexing (CHK-002).
 */
export const order = pgTable('order', {
  id: text('id').primaryKey(),
  /** Nullable: guest checkout when null */
  userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
  status: text('status').notNull().default('pending'),
  /** Shipping address */
  shippingFullName: text('shipping_full_name').notNull(),
  shippingLine1: text('shipping_line1').notNull(),
  shippingLine2: text('shipping_line2'),
  shippingCity: text('shipping_city').notNull(),
  shippingStateOrProvince: text('shipping_state_or_province').notNull(),
  shippingPostalCode: text('shipping_postal_code').notNull(),
  shippingCountry: text('shipping_country').notNull(),
  shippingPhone: text('shipping_phone'),
  subtotalCents: integer('subtotal_cents').notNull(),
  shippingCents: integer('shipping_cents').notNull().default(0),
  totalCents: integer('total_cents').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

/**
 * Line item in an order. Snapshots product price and name at order time.
 */
export const orderItem = pgTable('order_item', {
  id: text('id').primaryKey(),
  orderId: text('order_id')
    .notNull()
    .references(() => order.id, { onDelete: 'cascade' }),
  productId: text('product_id')
    .notNull()
    .references(() => product.id, { onDelete: 'restrict' }),
  quantity: integer('quantity').notNull(),
  priceCentsAtOrder: integer('price_cents_at_order').notNull(),
  productNameAtOrder: text('product_name_at_order').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const orderRelations = relations(order, ({ one, many }) => ({
  user: one(user, {
    fields: [order.userId],
    references: [user.id],
  }),
  items: many(orderItem),
}));

export const orderItemRelations = relations(orderItem, ({ one }) => ({
  order: one(order, {
    fields: [orderItem.orderId],
    references: [order.id],
  }),
  product: one(product, {
    fields: [orderItem.productId],
    references: [product.id],
  }),
}));
