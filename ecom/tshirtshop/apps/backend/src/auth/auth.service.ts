import {
  Inject,
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { betterAuth } from 'better-auth';
import { BETTER_AUTH_INSTANCE } from './constants';

type BetterAuthInstance = ReturnType<typeof betterAuth>;

@Injectable()
export class AuthService {
  constructor(
    @Inject(BETTER_AUTH_INSTANCE) private readonly auth: BetterAuthInstance,
  ) {}

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
          email: data.email,
          password: data.password,
        },
        headers: data.headers,
      });

      if ((result as any)?.twoFactorRedirect) {
        return { twoFactorRequired: true };
      }

      if (!result?.user) {
        throw new UnauthorizedException('Invalid email or password');
      }

      return {
        user: result.user,
      };
    } catch (error: any) {
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
}
