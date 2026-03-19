import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { betterAuth } from 'better-auth';
import type { AuthUser } from '../../common/auth.types';
import { BETTER_AUTH_INSTANCE } from '../constants';
import { decrypt } from '../crypto';
import * as authSchema from '../schema';

type BetterAuthInstance = ReturnType<typeof betterAuth>;

@Injectable()
export class BetterAuthGuard implements CanActivate {
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

    const u = session.user as AuthUser &
      Partial<typeof authSchema.user.$inferSelect>;
    // Decrypt fields encrypted at rest — email stores the blind index in the DB.
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
      // emailEncrypted is intentionally excluded — never forwarded to clients.
    };

    request.session = session.session;

    return true;
  }
}
