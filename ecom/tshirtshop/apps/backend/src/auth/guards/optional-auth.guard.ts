import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import { betterAuth } from 'better-auth';
import type { AuthUser } from '../../common/auth.types';
import { BETTER_AUTH_INSTANCE } from '../constants';

type BetterAuthInstance = ReturnType<typeof betterAuth>;

/**
 * Optional auth: attaches req.user when session exists, does not throw when absent.
 * Use for endpoints that support both guest and authenticated users (e.g. cart).
 */
@Injectable()
export class OptionalAuthGuard implements CanActivate {
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

    if (session?.user) {
      const u = session.user as AuthUser;
      request.user = {
        id: u.id,
        email: u.email,
        name: u.name,
        image: u.image,
        emailVerified: u.emailVerified,
        twoFactorEnabled: u.twoFactorEnabled,
        role: u.role,
      };
      request.session = session.session;
    } else {
      request.user = null;
    }

    return true;
  }
}
