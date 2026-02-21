import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { betterAuth } from 'better-auth';
import { BETTER_AUTH_INSTANCE } from '../constants';

type BetterAuthInstance = ReturnType<typeof betterAuth>;

@Injectable()
export class BetterAuthGuard implements CanActivate {
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

    return true;
  }
}
