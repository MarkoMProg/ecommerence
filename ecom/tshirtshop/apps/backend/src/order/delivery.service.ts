import { Inject, Injectable } from '@nestjs/common';
import { eq, asc } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DATABASE_CONNECTION } from '../database/database-connection';
import { shopDeliveryConfig, deliveryOption } from './schema';
import { applyCoupon } from './coupons';

const CONFIG_ID = 'default';

export interface DeliveryOptionRow {
  id: string;
  label: string;
  priceCents: number;
  sortOrder: number;
  active: boolean;
  isDefault: boolean;
}

export interface ShopDeliveryConfigRow {
  freeShippingThresholdCents: number;
}

@Injectable()
export class DeliveryService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase,
  ) {}

 
  async ensureDefaults(): Promise<void> {
    const [cfg] = await this.db
      .select()
      .from(shopDeliveryConfig)
      .where(eq(shopDeliveryConfig.id, CONFIG_ID))
      .limit(1);
    if (!cfg) {
      await this.db
        .insert(shopDeliveryConfig)
        .values({
          id: CONFIG_ID,
          freeShippingThresholdCents: 7500,
        })
        .onConflictDoNothing();
    }

    const existing = await this.db.select().from(deliveryOption);
    if (existing.length === 0) {
      await this.db
        .insert(deliveryOption)
        .values([
          {
            id: 'standard',
            label: 'Standard',
            priceCents: 599,
            sortOrder: 0,
            active: true,
            isDefault: true,
          },
          {
            id: 'express',
            label: 'Express',
            priceCents: 1299,
            sortOrder: 1,
            active: true,
            isDefault: false,
          },
        ])
        .onConflictDoNothing();
    }
  }

  async getConfig(): Promise<ShopDeliveryConfigRow> {
    await this.ensureDefaults();
    const [row] = await this.db
      .select()
      .from(shopDeliveryConfig)
      .where(eq(shopDeliveryConfig.id, CONFIG_ID))
      .limit(1);
    if (!row) {
      return { freeShippingThresholdCents: 7500 };
    }
    return { freeShippingThresholdCents: row.freeShippingThresholdCents };
  }

  async listAllOptions(): Promise<DeliveryOptionRow[]> {
    await this.ensureDefaults();
    const rows = await this.db
      .select()
      .from(deliveryOption)
      .orderBy(asc(deliveryOption.sortOrder), asc(deliveryOption.id));
    return rows.map((r) => ({
      id: r.id,
      label: r.label,
      priceCents: r.priceCents,
      sortOrder: r.sortOrder,
      active: r.active,
      isDefault: r.isDefault,
    }));
  }

  async listActiveOptionsPublic(): Promise<
    Array<{
      id: string;
      label: string;
      priceCents: number;
      isDefault: boolean;
    }>
  > {
    const rows = await this.listAllOptions();
    return rows
      .filter((r) => r.active)
      .map((r) => ({
        id: r.id,
        label: r.label,
        priceCents: r.priceCents,
        isDefault: r.isDefault,
      }));
  }

  async updateConfig(freeShippingThresholdCents: number): Promise<void> {
    if (
      !Number.isFinite(freeShippingThresholdCents) ||
      freeShippingThresholdCents < 0
    ) {
      throw new Error('freeShippingThresholdCents must be a non-negative number');
    }
    await this.ensureDefaults();
    await this.db
      .update(shopDeliveryConfig)
      .set({ freeShippingThresholdCents })
      .where(eq(shopDeliveryConfig.id, CONFIG_ID));
  }

  async replaceOptions(
    options: Array<{
      id: string;
      label: string;
      priceCents: number;
      sortOrder: number;
      active: boolean;
      isDefault: boolean;
    }>,
  ): Promise<void> {
    if (!options.length) {
      throw new Error('At least one delivery option is required');
    }
    const defaults = options.filter((o) => o.isDefault);
    if (defaults.length !== 1) {
      throw new Error('Exactly one option must be marked as default');
    }
    for (const o of options) {
      if (!o.id?.trim() || !o.label?.trim()) {
        throw new Error('Each option requires id and label');
      }
      if (!Number.isFinite(o.priceCents) || o.priceCents < 0) {
        throw new Error('priceCents must be non-negative');
      }
    }
    await this.ensureDefaults();
    await this.db.delete(deliveryOption);
    await this.db.insert(deliveryOption).values(
      options.map((o) => ({
        id: o.id.trim(),
        label: o.label.trim(),
        priceCents: Math.round(o.priceCents),
        sortOrder: o.sortOrder,
        active: o.active,
        isDefault: o.isDefault,
      })),
    );
  }

  /**
   * Resolves shipping cents and which option id applies (for order snapshot).
   * When subtotal qualifies for free shipping or coupon free shipping, shipping is 0 but selectedOptionId is still returned for display.
   */
  resolveShipping(
    subtotalCents: number,
    couponCode: string | null | undefined,
    requestedOptionId: string | null | undefined,
    config: ShopDeliveryConfigRow,
    activeOptions: DeliveryOptionRow[],
  ): { shippingCents: number; selectedOptionId: string | null } {
    const coupon = couponCode ? applyCoupon(couponCode) : null;
    const freeByCoupon = coupon?.freeShipping ?? false;
    const freeByThreshold =
      subtotalCents >= config.freeShippingThresholdCents;

    const active = activeOptions.filter((o) => o.active);
    if (active.length === 0) {
      return { shippingCents: 0, selectedOptionId: null };
    }

    const pickDefault = (): DeliveryOptionRow => {
      const d = active.find((o) => o.isDefault);
      if (d) return d;
      return [...active].sort((a, b) => a.sortOrder - b.sortOrder)[0]!;
    };

    let chosen = pickDefault();
    if (requestedOptionId?.trim()) {
      const found = active.find((o) => o.id === requestedOptionId.trim());
      if (found) chosen = found;
    }

    if (freeByCoupon || freeByThreshold) {
      return { shippingCents: 0, selectedOptionId: chosen.id };
    }

    return { shippingCents: chosen.priceCents, selectedOptionId: chosen.id };
  }
}
