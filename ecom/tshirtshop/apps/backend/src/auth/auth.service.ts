import {
  Inject,
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { betterAuth } from 'better-auth';
import { BETTER_AUTH_INSTANCE } from './constants';
import { DATABASE_CONNECTION } from '../database/database-connection';
import { manualRefreshToken } from './schema';
import { blindEmail } from './crypto';

type BetterAuthInstance = ReturnType<typeof betterAuth>;

@Injectable()
export class AuthService {
  constructor(
    @Inject(BETTER_AUTH_INSTANCE) private readonly auth: BetterAuthInstance,
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase,
  ) {}

  private static readonly MANUAL_REFRESH_TOKEN_TTL_MS =
    1000 * 60 * 60 * 24 * 14;

  private buildTokenHash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private buildRefreshTokenValue(): string {
    return randomBytes(48).toString('base64url');
  }

  async register(data: {
    name: string;
    email: string;
    password: string;
    headers: Headers;
  }) {
    const result = await this.auth.api.signUpEmail({
      body: {
        name: data.name,
        email: data.email,
        password: data.password,
      },
      headers: data.headers,
    });

    if (!result?.user) {
      throw new BadRequestException(
        'Registration failed. The email may already be in use.',
      );
    }

    return {
      user: result.user,
    };
  }

  async login(data: { email: string; password: string; headers: Headers }) {
    try {
      const result = await this.auth.api.signInEmail({
        body: {
          // Better Auth stores the blind index as {hmac}@blind.index in the email column.
          email: blindEmail(data.email),
          password: data.password,
        },
        headers: data.headers,
      });

      if (
        result &&
        typeof result === 'object' &&
        'twoFactorRedirect' in result &&
        (result as { twoFactorRedirect?: unknown }).twoFactorRedirect
      ) {
        return { twoFactorRequired: true };
      }

      if (!result?.user) {
        throw new UnauthorizedException('Invalid email or password');
      }

      return {
        user: result.user,
      };
    } catch (error: unknown) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Invalid email or password');
    }
  }

  async getSessionUser(headers: Headers) {
    const session = await this.auth.api.getSession({ headers });
    return session?.user ?? null;
  }

  async revokeSession(headers: Headers): Promise<void> {
    await this.auth.api.signOut({ headers });
  }

  async revokeAllSessions(headers: Headers): Promise<void> {
    await this.auth.api.revokeSessions({ headers });
  }

  async listSessions(headers: Headers) {
    return this.auth.api.listSessions({ headers });
  }

  async rotateRefreshToken(
    oldRefreshToken: string | null | undefined,
    sessionId?: string,
  ) {
    if (!oldRefreshToken) {
      return null;
    }

    const token = oldRefreshToken.trim();
    if (!token) {
      return null;
    }

    const tokenHash = this.buildTokenHash(token);
    const [existing] = await this.db
      .select()
      .from(manualRefreshToken)
      .where(eq(manualRefreshToken.tokenHash, tokenHash))
      .limit(1);

    if (!existing) {
      return null;
    }

    if (existing.usedAt) {
      return null;
    }

    if (existing.expiresAt.getTime() <= Date.now()) {
      return null;
    }

    const [consumed] = await this.db
      .update(manualRefreshToken)
      .set({ usedAt: new Date() })
      .where(
        and(
          eq(manualRefreshToken.id, existing.id),
          isNull(manualRefreshToken.usedAt),
        ),
      )
      .returning({
        id: manualRefreshToken.id,
        userId: manualRefreshToken.userId,
        sessionId: manualRefreshToken.sessionId,
      });

    if (!consumed) {
      return null;
    }

    const rotatedToken = this.buildRefreshTokenValue();
    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + AuthService.MANUAL_REFRESH_TOKEN_TTL_MS,
    );

    // Use provided sessionId or existing sessionId from the consumed token
    // For production, sessionId should always be provided
    const session = sessionId || existing.sessionId || randomUUID();

    await this.db.insert(manualRefreshToken).values({
      id: randomUUID(),
      userId: consumed.userId,
      sessionId: session,
      tokenHash: this.buildTokenHash(rotatedToken),
      expiresAt,
      createdAt: now,
    });

    return rotatedToken;
  }
}
