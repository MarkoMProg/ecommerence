import {
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { AdminGuard } from '../guards/admin.guard';

interface MockAuthApi {
  getSession: jest.Mock;
}

describe('AdminGuard', () => {
  let guard: AdminGuard;
  let mockAuth: { api: MockAuthApi };

  const makeUser = (overrides: Record<string, unknown> = {}) => ({
    id: 'user-admin-1',
    email: 'admin@example.com',
    name: 'Admin User',
    image: null,
    emailVerified: true,
    twoFactorEnabled: true,
    role: 'admin',
    ...overrides,
  });

  const mockSession = { id: 'session-1', token: 'tok', userId: 'user-admin-1' };

  function makeContext(
    headers: Record<string, string | string[]> = {},
  ): ExecutionContext {
    const request: { headers: Record<string, string | string[]> } = { headers };
    return {
      switchToHttp: () => ({ getRequest: () => request }),
    } as ExecutionContext;
  }

  beforeEach(() => {
    mockAuth = {
      api: {
        getSession: jest
          .fn()
          .mockResolvedValue({ user: makeUser(), session: mockSession }),
      },
    };
    guard = new AdminGuard(mockAuth);
  });

  // ─── Happy path ───────────────────────────────────────────────────────────

  it('allows access for admin user with 2FA enabled', async () => {
    const ctx = makeContext({ cookie: 'better-auth.session=token' });
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('attaches user and session to request', async () => {
    const ctx = makeContext({ cookie: 'better-auth.session=token' });
    await guard.canActivate(ctx);

    const req = ctx.switchToHttp().getRequest();
    expect(req.user).toEqual(
      expect.objectContaining({
        id: 'user-admin-1',
        email: 'admin@example.com',
        role: 'admin',
        twoFactorEnabled: true,
      }),
    );
    expect(req.session).toEqual(mockSession);
  });

  it('converts array header values to comma-separated string', async () => {
    const ctx = makeContext({ cookie: ['cookie1', 'cookie2'] });
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(mockAuth.api.getSession).toHaveBeenCalled();
  });

  // ─── No session ───────────────────────────────────────────────────────────

  it('throws UnauthorizedException when getSession returns null', async () => {
    mockAuth.api.getSession.mockResolvedValue(null);
    const ctx = makeContext({ cookie: 'better-auth.session=expired' });
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException when session.user is null', async () => {
    mockAuth.api.getSession.mockResolvedValue({ user: null, session: null });
    const ctx = makeContext({ cookie: 'better-auth.session=token' });
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException when no headers are present', async () => {
    mockAuth.api.getSession.mockResolvedValue(null);
    const ctx = makeContext();
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  // ─── Wrong role ───────────────────────────────────────────────────────────

  it('throws ForbiddenException when user role is "user"', async () => {
    mockAuth.api.getSession.mockResolvedValue({
      user: makeUser({ role: 'user' }),
      session: mockSession,
    });
    const ctx = makeContext({ cookie: 'better-auth.session=token' });
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('throws ForbiddenException when user role is null', async () => {
    mockAuth.api.getSession.mockResolvedValue({
      user: makeUser({ role: null }),
      session: mockSession,
    });
    const ctx = makeContext({ cookie: 'better-auth.session=token' });
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('throws ForbiddenException when user role is undefined', async () => {
    mockAuth.api.getSession.mockResolvedValue({
      user: makeUser({ role: undefined }),
      session: mockSession,
    });
    const ctx = makeContext({ cookie: 'better-auth.session=token' });
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('ForbiddenException message says "Admin access required" for non-admin role', async () => {
    mockAuth.api.getSession.mockResolvedValue({
      user: makeUser({ role: 'user' }),
      session: mockSession,
    });
    const ctx = makeContext({ cookie: 'better-auth.session=token' });
    await expect(guard.canActivate(ctx)).rejects.toThrow(
      'Admin access required',
    );
  });

  // ─── 2FA enforcement ─────────────────────────────────────────────────────

  it('throws ForbiddenException when admin does not have 2FA enabled', async () => {
    mockAuth.api.getSession.mockResolvedValue({
      user: makeUser({ twoFactorEnabled: false }),
      session: mockSession,
    });
    const ctx = makeContext({ cookie: 'better-auth.session=token' });
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('throws ForbiddenException when admin 2FA is null', async () => {
    mockAuth.api.getSession.mockResolvedValue({
      user: makeUser({ twoFactorEnabled: null }),
      session: mockSession,
    });
    const ctx = makeContext({ cookie: 'better-auth.session=token' });
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('ForbiddenException message mentions 2FA when 2FA is missing', async () => {
    mockAuth.api.getSession.mockResolvedValue({
      user: makeUser({ twoFactorEnabled: false }),
      session: mockSession,
    });
    const ctx = makeContext({ cookie: 'better-auth.session=token' });
    await expect(guard.canActivate(ctx)).rejects.toThrow(
      'Two-factor authentication is required for admin access',
    );
  });

  // ─── Edge: both role wrong and 2FA missing — role checked first ──────────

  it('throws ForbiddenException for wrong role even when 2FA is also missing', async () => {
    mockAuth.api.getSession.mockResolvedValue({
      user: makeUser({ role: 'user', twoFactorEnabled: false }),
      session: mockSession,
    });
    const ctx = makeContext({ cookie: 'better-auth.session=token' });
    // Role is checked before 2FA — message should be about admin access
    await expect(guard.canActivate(ctx)).rejects.toThrow(
      'Admin access required',
    );
  });
});
