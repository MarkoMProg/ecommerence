import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { betterAuth } from 'better-auth';
import { BETTER_AUTH_INSTANCE } from '../../auth/constants';

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
    const request = context.switchToHttp().getRequest();

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

    // Attach user to request for downstream handlers
    request.user = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      image: session.user.image,
      emailVerified: session.user.emailVerified,
      twoFactorEnabled: (session.user as any).twoFactorEnabled,
      role: (session.user as any).role,
    };
    request.session = session.session;

    // Check admin role (Better Auth admin plugin sets role field)
    const userRole = (session.user as any).role;
    if (userRole !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }

    // Enforce 2FA for admin users (security requirement)
    const twoFactorEnabled = (session.user as any).twoFactorEnabled;
    if (!twoFactorEnabled) {
      throw new ForbiddenException(
        'Two-factor authentication is required for admin access. Please enable 2FA in your account settings.',
      );
    }

    return true;
  }
}
