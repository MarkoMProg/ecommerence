import { relations } from 'drizzle-orm';
import { pgTable, text, boolean, timestamp, index } from 'drizzle-orm/pg-core';
import { user } from '../auth/schema';

export const userAddress = pgTable(
  'user_address',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    label: text('label').notNull().default('Home'),
    fullName: text('full_name').notNull(),
    phone: text('phone'),
    line1: text('line1').notNull(),
    line2: text('line2'),
    city: text('city').notNull(),
    stateOrRegion: text('state_or_region').notNull(),
    postalCode: text('postal_code').notNull(),
    country: text('country').notNull(),
    isDefaultShipping: boolean('is_default_shipping').notNull().default(false),
    isDefaultBilling: boolean('is_default_billing').notNull().default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index('user_address_userId_idx').on(table.userId)],
);

export const userAddressRelations = relations(userAddress, ({ one }) => ({
  user: one(user, {
    fields: [userAddress.userId],
    references: [user.id],
  }),
}));
