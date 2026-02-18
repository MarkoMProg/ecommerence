import { relations } from 'drizzle-orm';
import {
  pgTable,
  text,
  integer,
  timestamp,
  boolean,
} from 'drizzle-orm/pg-core';

export const category = pgTable('category', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  parentCategoryId: text('parent_category_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const product = pgTable('product', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  priceCents: integer('price_cents').notNull(),
  stockQuantity: integer('stock_quantity').notNull().default(0),
  categoryId: text('category_id')
    .notNull()
    .references(() => category.id, { onDelete: 'restrict' }),
  brand: text('brand').notNull(),
  weightMetric: text('weight_metric'),
  weightImperial: text('weight_imperial'),
  dimensionMetric: text('dimension_metric'),
  dimensionImperial: text('dimension_imperial'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const productImage = pgTable('product_image', {
  id: text('id').primaryKey(),
  productId: text('product_id')
    .notNull()
    .references(() => product.id, { onDelete: 'cascade' }),
  imageUrl: text('image_url').notNull(),
  isPrimary: boolean('is_primary').default(false).notNull(),
});

export const categoryRelations = relations(category, ({ many }) => ({
  products: many(product),
}));

export const productRelations = relations(product, ({ one, many }) => ({
  category: one(category, {
    fields: [product.categoryId],
    references: [category.id],
  }),
  images: many(productImage),
}));

export const productImageRelations = relations(productImage, ({ one }) => ({
  product: one(product, {
    fields: [productImage.productId],
    references: [product.id],
  }),
}));

