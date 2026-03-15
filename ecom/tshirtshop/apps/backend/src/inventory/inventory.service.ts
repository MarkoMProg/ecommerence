import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { eq, inArray } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DATABASE_CONNECTION } from '../database/database-connection';
import { product } from '../catalog/schema';

export interface StockFailure {
  productId: string;
  productName: string;
  required: number;
  available: number;
}

export type StockValidationResult =
  | { ok: true }
  | { ok: false; failures: StockFailure[] };

/** Internal sentinel thrown inside transactions to trigger rollback via catch */
class StockInsufficientError extends Error {
  constructor(public readonly failures: StockFailure[]) {
    super('insufficient_stock');
  }
}

@Injectable()
export class InventoryService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase,
  ) {}

  /**
   * Validate stock without locking. Used for fast pre-checks at order creation
   * and add-to-cart. Not a substitute for the atomic decrement at payment time.
   */
  async validateStockForItems(
    items: { productId: string; quantity: number }[],
  ): Promise<StockValidationResult> {
    if (items.length === 0) return { ok: true };

    const ids = items.map((i) => i.productId);
    const rows = await this.db
      .select({
        id: product.id,
        name: product.name,
        stockQuantity: product.stockQuantity,
      })
      .from(product)
      .where(inArray(product.id, ids));

    const stockMap = new Map(rows.map((r) => [r.id, r]));
    const failures: StockFailure[] = [];

    for (const item of items) {
      const row = stockMap.get(item.productId);
      const available = row?.stockQuantity ?? 0;
      if (available < item.quantity) {
        failures.push({
          productId: item.productId,
          productName: row?.name ?? 'Unknown product',
          required: item.quantity,
          available,
        });
      }
    }

    return failures.length === 0 ? { ok: true } : { ok: false, failures };
  }

  /**
   * Atomically decrement stock for a set of items using a database transaction
   * with SELECT ... FOR UPDATE row-level locking.
   *
   * Items are processed in productId order to prevent deadlocks when concurrent
   * transactions try to lock overlapping sets of products.
   *
   * Returns {ok: true} on success or {ok: false, failures} when any item has
   * insufficient stock. On failure the transaction is rolled back — no stock
   * is decremented for any item.
   */
  async decrementStockForOrder(
    items: { productId: string; quantity: number }[],
  ): Promise<StockValidationResult> {
    if (items.length === 0) return { ok: true };

    // Deduplicate and sort by productId (consistent lock order prevents deadlocks)
    const sorted = [...items].sort((a, b) =>
      a.productId.localeCompare(b.productId),
    );
    const failures: StockFailure[] = [];

    try {
      await this.db.transaction(async (tx) => {
        // Phase 1: Lock rows and read stock atomically
        for (const item of sorted) {
          const result = await tx.execute(
            sql`SELECT id, name, stock_quantity FROM product WHERE id = ${item.productId} FOR UPDATE`,
          );
          const row = (
            result.rows as {
              id: string;
              name: string;
              stock_quantity: number;
            }[]
          )[0];
          const available = row?.stock_quantity ?? 0;

          if (!row || available < item.quantity) {
            failures.push({
              productId: item.productId,
              productName: row?.name ?? 'Unknown product',
              required: item.quantity,
              available,
            });
          }
        }

        if (failures.length > 0) {
          // Throwing inside a Drizzle transaction causes automatic rollback
          throw new StockInsufficientError(failures);
        }

        // Phase 2: All checks passed — decrement each row
        for (const item of sorted) {
          await tx.execute(
            sql`UPDATE product
                SET stock_quantity = stock_quantity - ${item.quantity},
                    updated_at = NOW()
                WHERE id = ${item.productId}`,
          );
        }
      });

      return { ok: true };
    } catch (err) {
      if (err instanceof StockInsufficientError) {
        return { ok: false, failures: err.failures };
      }
      throw err;
    }
  }

  /**
   * Increment stock when an order is cancelled or refunded after payment.
   * Does not use locking — incrementing is always safe (no oversell risk).
   */
  async incrementStockForOrder(
    items: { productId: string; quantity: number }[],
  ): Promise<void> {
    if (items.length === 0) return;

    for (const item of items) {
      await this.db.execute(
        sql`UPDATE product
            SET stock_quantity = stock_quantity + ${item.quantity},
                updated_at = NOW()
            WHERE id = ${item.productId}`,
      );
    }
  }

  /**
   * Check whether a single product has enough stock.
   * Convenience wrapper around validateStockForItems for add-to-cart checks.
   * Throws BadRequestException if stock is insufficient, so it can be called
   * directly from CartService without extra error handling.
   */
  async assertSufficientStock(
    productId: string,
    quantity: number,
    productName?: string,
  ): Promise<void> {
    const [row] = await this.db
      .select({ stockQuantity: product.stockQuantity, name: product.name })
      .from(product)
      .where(eq(product.id, productId));

    const available = row?.stockQuantity ?? 0;
    const name = productName ?? row?.name ?? 'This item';

    if (available <= 0) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'OUT_OF_STOCK',
          message: `${name} is out of stock`,
          available: 0,
        },
      });
    }

    if (quantity > available) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'INSUFFICIENT_STOCK',
          message: `Only ${available} unit${available === 1 ? '' : 's'} of ${name} ${available === 1 ? 'is' : 'are'} available`,
          available,
        },
      });
    }
  }
}
