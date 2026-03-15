import { Injectable, Inject } from '@nestjs/common';
import { eq, and, desc } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { randomUUID } from 'crypto';
import { DATABASE_CONNECTION } from '../database/database-connection';
import { userAddress } from './schema';
import type { CreateAddressDto, UpdateAddressDto } from './dto/address.dto';
import {
  encrypt,
  encryptNullable,
  decrypt,
  decryptNullable,
} from '../common/crypto.util';

export type UserAddressRow = typeof userAddress.$inferSelect;

@Injectable()
export class AddressService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase,
  ) {}

  /** Decrypts all PII text fields on a row fetched from the database. */
  private decryptRow(row: UserAddressRow): UserAddressRow {
    return {
      ...row,
      fullName: decrypt(row.fullName),
      phone: decryptNullable(row.phone),
      line1: decrypt(row.line1),
      line2: decryptNullable(row.line2),
      city: decrypt(row.city),
      stateOrRegion: decrypt(row.stateOrRegion),
      postalCode: decrypt(row.postalCode),
      country: decrypt(row.country),
    };
  }

  async listAddresses(userId: string): Promise<UserAddressRow[]> {
    const rows = await this.db
      .select()
      .from(userAddress)
      .where(eq(userAddress.userId, userId))
      .orderBy(desc(userAddress.createdAt));
    return rows.map((r) => this.decryptRow(r));
  }

  async createAddress(
    userId: string,
    dto: CreateAddressDto,
  ): Promise<UserAddressRow> {
    const existing = await this.listAddresses(userId);
    const isFirst = existing.length === 0;

    // Enforce single default: clear existing defaults before setting new ones
    if (dto.isDefaultShipping === true || isFirst) {
      await this.db
        .update(userAddress)
        .set({ isDefaultShipping: false })
        .where(
          and(
            eq(userAddress.userId, userId),
            eq(userAddress.isDefaultShipping, true),
          ),
        );
    }
    if (dto.isDefaultBilling === true || isFirst) {
      await this.db
        .update(userAddress)
        .set({ isDefaultBilling: false })
        .where(
          and(
            eq(userAddress.userId, userId),
            eq(userAddress.isDefaultBilling, true),
          ),
        );
    }

    const id = randomUUID();
    const now = new Date();
    await this.db.insert(userAddress).values({
      id,
      userId,
      label: (dto.label ?? '').trim() || 'Home',
      fullName: encrypt(dto.fullName.trim()),
      phone: encryptNullable(dto.phone?.trim() || null),
      line1: encrypt(dto.line1.trim()),
      line2: encryptNullable(dto.line2?.trim() || null),
      city: encrypt(dto.city.trim()),
      stateOrRegion: encrypt(dto.stateOrRegion.trim()),
      postalCode: encrypt(dto.postalCode.trim()),
      country: encrypt(dto.country.trim().toUpperCase()),
      // First address auto-becomes default; explicit flag overrides
      isDefaultShipping: dto.isDefaultShipping ?? isFirst,
      isDefaultBilling: dto.isDefaultBilling ?? isFirst,
      createdAt: now,
      updatedAt: now,
    });

    const [created] = await this.db
      .select()
      .from(userAddress)
      .where(eq(userAddress.id, id));
    return this.decryptRow(created);
  }

  async updateAddress(
    userId: string,
    id: string,
    dto: UpdateAddressDto,
  ): Promise<UserAddressRow | null> {
    const [existing] = await this.db
      .select()
      .from(userAddress)
      .where(and(eq(userAddress.id, id), eq(userAddress.userId, userId)));
    if (!existing) return null;

    // Enforce single default
    if (dto.isDefaultShipping === true) {
      await this.db
        .update(userAddress)
        .set({ isDefaultShipping: false })
        .where(
          and(
            eq(userAddress.userId, userId),
            eq(userAddress.isDefaultShipping, true),
          ),
        );
    }
    if (dto.isDefaultBilling === true) {
      await this.db
        .update(userAddress)
        .set({ isDefaultBilling: false })
        .where(
          and(
            eq(userAddress.userId, userId),
            eq(userAddress.isDefaultBilling, true),
          ),
        );
    }

    const patch: Partial<typeof userAddress.$inferInsert> = {};
    if (dto.label !== undefined) patch.label = dto.label.trim() || 'Home';
    if (dto.fullName !== undefined)
      patch.fullName = encrypt(dto.fullName.trim());
    if (dto.phone !== undefined)
      patch.phone = encryptNullable(dto.phone.trim() || null);
    if (dto.line1 !== undefined) patch.line1 = encrypt(dto.line1.trim());
    if (dto.line2 !== undefined)
      patch.line2 = encryptNullable(dto.line2.trim() || null);
    if (dto.city !== undefined) patch.city = encrypt(dto.city.trim());
    if (dto.stateOrRegion !== undefined)
      patch.stateOrRegion = encrypt(dto.stateOrRegion.trim());
    if (dto.postalCode !== undefined)
      patch.postalCode = encrypt(dto.postalCode.trim());
    if (dto.country !== undefined)
      patch.country = encrypt(dto.country.trim().toUpperCase());
    if (dto.isDefaultShipping !== undefined)
      patch.isDefaultShipping = dto.isDefaultShipping;
    if (dto.isDefaultBilling !== undefined)
      patch.isDefaultBilling = dto.isDefaultBilling;

    if (Object.keys(patch).length > 0) {
      await this.db
        .update(userAddress)
        .set(patch)
        .where(and(eq(userAddress.id, id), eq(userAddress.userId, userId)));
    }

    const [updated] = await this.db
      .select()
      .from(userAddress)
      .where(eq(userAddress.id, id));
    return updated ? this.decryptRow(updated) : null;
  }

  async deleteAddress(userId: string, id: string): Promise<boolean> {
    const [existing] = await this.db
      .select()
      .from(userAddress)
      .where(and(eq(userAddress.id, id), eq(userAddress.userId, userId)));
    if (!existing) return false;

    await this.db
      .delete(userAddress)
      .where(and(eq(userAddress.id, id), eq(userAddress.userId, userId)));

    // Graceful fallback: if deleted address held a default flag, promote next address
    if (existing.isDefaultShipping || existing.isDefaultBilling) {
      const remaining = await this.listAddresses(userId);
      if (remaining.length > 0) {
        const fallback = remaining[0];
        const promote: Partial<typeof userAddress.$inferInsert> = {};
        if (existing.isDefaultShipping && !fallback.isDefaultShipping) {
          promote.isDefaultShipping = true;
        }
        if (existing.isDefaultBilling && !fallback.isDefaultBilling) {
          promote.isDefaultBilling = true;
        }
        if (Object.keys(promote).length > 0) {
          await this.db
            .update(userAddress)
            .set(promote)
            .where(eq(userAddress.id, fallback.id));
        }
      }
    }

    return true;
  }

  async setDefaultShipping(
    userId: string,
    id: string,
  ): Promise<UserAddressRow | null> {
    const [addr] = await this.db
      .select()
      .from(userAddress)
      .where(and(eq(userAddress.id, id), eq(userAddress.userId, userId)));
    if (!addr) return null;

    await this.db
      .update(userAddress)
      .set({ isDefaultShipping: false })
      .where(
        and(
          eq(userAddress.userId, userId),
          eq(userAddress.isDefaultShipping, true),
        ),
      );

    await this.db
      .update(userAddress)
      .set({ isDefaultShipping: true })
      .where(eq(userAddress.id, id));

    const [updated] = await this.db
      .select()
      .from(userAddress)
      .where(eq(userAddress.id, id));
    return updated ? this.decryptRow(updated) : null;
  }

  async setDefaultBilling(
    userId: string,
    id: string,
  ): Promise<UserAddressRow | null> {
    const [addr] = await this.db
      .select()
      .from(userAddress)
      .where(and(eq(userAddress.id, id), eq(userAddress.userId, userId)));
    if (!addr) return null;

    await this.db
      .update(userAddress)
      .set({ isDefaultBilling: false })
      .where(
        and(
          eq(userAddress.userId, userId),
          eq(userAddress.isDefaultBilling, true),
        ),
      );

    await this.db
      .update(userAddress)
      .set({ isDefaultBilling: true })
      .where(eq(userAddress.id, id));

    const [updated] = await this.db
      .select()
      .from(userAddress)
      .where(eq(userAddress.id, id));
    return updated ? this.decryptRow(updated) : null;
  }
}
