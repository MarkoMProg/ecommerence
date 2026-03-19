import { Injectable, Inject } from '@nestjs/common';
import { eq, desc, sql, inArray } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DATABASE_CONNECTION } from '../database/database-connection';
import { user } from '../auth/schema';
import { order } from '../order/schema';
import { decrypt, blindIndex } from '../auth/crypto';

export interface AdminUserDto {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  twoFactorEnabled: boolean | null;
  role: string | null;
  banned: boolean | null;
  createdAt: Date;
  orderCount: number;
}

export interface AdminUserDetailDto extends AdminUserDto {
  image: string | null;
  updatedAt: Date;
  banReason: string | null;
}

export interface ListUsersResult {
  data: AdminUserDto[];
  pagination: { page: number; limit: number; total: number };
}

@Injectable()
export class AdminUsersService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase,
  ) {}

  /**
   * List users for admin (ADM-004). Paginated, optional search by email or name.
   */
  async listUsers(
    page = 1,
    limit = 20,
    search?: string,
  ): Promise<ListUsersResult> {
    const offset = Math.max(0, (page - 1) * limit);
    const safeLimit = Math.min(100, Math.max(1, limit));

    const searchTrimmed = search?.trim();
    // Email is stored as a blind index — exact HMAC match only.
    // Name is AES-encrypted so SQL LIKE is not possible.
    const whereClause = searchTrimmed
      ? eq(user.emailIndex, blindIndex(searchTrimmed.toLowerCase()))
      : undefined;

    const rows = await this.db
      .select({
        id: user.id,
        name: user.name,
        emailEncrypted: user.emailEncrypted,
        emailVerified: user.emailVerified,
        twoFactorEnabled: user.twoFactorEnabled,
        role: user.role,
        banned: user.banned,
        createdAt: user.createdAt,
      })
      .from(user)
      .where(whereClause)
      .orderBy(desc(user.createdAt))
      .limit(safeLimit)
      .offset(offset);

    const users = rows.map((r) => ({
      ...r,
      email: r.emailEncrypted ? decrypt(r.emailEncrypted) : '',
      name: r.name ? decrypt(r.name) : '',
    }));

    const [countResult] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(user)
      .where(whereClause);
    const total = countResult?.count ?? 0;

    const userIds = users.map((u) => u.id);
    const orderCountMap = new Map<string, number>();
    if (userIds.length > 0) {
      const orderCounts = await this.db
        .select({
          userId: order.userId,
          count: sql<number>`count(*)::int`,
        })
        .from(order)
        .where(inArray(order.userId, userIds))
        .groupBy(order.userId);
      for (const o of orderCounts) {
        if (o.userId) orderCountMap.set(o.userId, o.count);
      }
    }

    const data: AdminUserDto[] = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      emailVerified: u.emailVerified,
      twoFactorEnabled: u.twoFactorEnabled ?? null,
      role: u.role ?? null,
      banned: u.banned ?? null,
      createdAt: u.createdAt,
      orderCount: orderCountMap.get(u.id) ?? 0,
    }));

    return {
      data,
      pagination: { page, limit: safeLimit, total },
    };
  }

  /**
   * Get user by ID for admin (ADM-004).
   */
  async getUserById(userId: string): Promise<AdminUserDetailDto | null> {
    const [u] = await this.db.select().from(user).where(eq(user.id, userId));
    if (!u) return null;

    const [orderRow] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(order)
      .where(eq(order.userId, userId));

    return {
      id: u.id,
      name: u.name ? decrypt(u.name) : '',
      email: u.emailEncrypted ? decrypt(u.emailEncrypted) : '',
      emailVerified: u.emailVerified,
      twoFactorEnabled: u.twoFactorEnabled,
      role: u.role ?? null,
      banned: u.banned ?? null,
      banReason: u.banReason ?? null,
      image: u.image,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
      orderCount: orderRow?.count ?? 0,
    };
  }
}
