import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

/**
 * Guard that requires the user to be an admin (ADM-001).
 * Must be used after BetterAuthGuard (req.user must exist).
 * Admin = user.role === 'admin' OR user.email in ADMIN_EMAILS (fallback during migration).
 */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user;
    if (!user?.email) {
      throw new ForbiddenException('Not authenticated');
    }
    if (user.role === 'admin') {
      return true;
    }
    const adminEmailsRaw = this.configService.get<string>('ADMIN_EMAILS') ?? '';
    const adminEmails = new Set(
      adminEmailsRaw
        .split(',')
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean),
    );
    if (adminEmails.has(user.email.toLowerCase())) {
      return true;
    }
    throw new ForbiddenException('Admin access required');
  }
}
