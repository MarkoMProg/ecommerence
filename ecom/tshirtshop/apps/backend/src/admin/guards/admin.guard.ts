import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import type { Request } from 'express';
import { betterAuth } from 'better-auth';
import type { AuthUser } from '../../common/auth.types';
import { BETTER_AUTH_INSTANCE } from '../../auth/constants';
import { decrypt } from '../../auth/crypto';
import * as authSchema from '../../auth/schema';

type BetterAuthInstance = ReturnType<typeof betterAuth>;

/**
 * Admin guard: authenticates user via Better Auth session, then checks
 * that the user has the 'admin' role (Better Auth admin plugin).
 * Used for custom admin endpoints (orders, reviews) that are NOT handled
 * by Better Auth's built-in admin API.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    @Inject(BETTER_AUTH_INSTANCE) private readonly auth: BetterAuthInstance,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    const webHeaders = new Headers();
    for (const [key, value] of Object.entries(request.headers)) {
      if (typeof value === 'string') {
        webHeaders.set(key, value);
      } else if (Array.isArray(value)) {
        webHeaders.set(key, value.join(', '));
      }
    }

    const session = await this.auth.api.getSession({ headers: webHeaders });

    if (!session?.user) {
      throw new UnauthorizedException('Not authenticated');
    }

    const u = session.user as AuthUser & Partial<typeof authSchema.user.$inferSelect>;
    const realEmail = u.emailEncrypted ? decrypt(u.emailEncrypted) : u.email;
    const realName = u.name ? decrypt(u.name) : u.name;
    request.user = {
      id: u.id,
      email: realEmail,
      name: realName,
      image: u.image,
      emailVerified: u.emailVerified,
      twoFactorEnabled: u.twoFactorEnabled,
      role: u.role,
    };
    request.session = session.session;

    if (u.role !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }

    if (!u.twoFactorEnabled) {
      throw new ForbiddenException(
        'Two-factor authentication is required for admin access. Please enable 2FA in your account settings.',
      );
    }

    return true;
  }
}
