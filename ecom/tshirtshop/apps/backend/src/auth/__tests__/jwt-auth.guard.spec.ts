import { BetterAuthGuard } from '../guards/jwt-auth.guard';
import { UnauthorizedException } from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common';

describe('BetterAuthGuard', () => {
  let guard: BetterAuthGuard;
  let mockAuth: any;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    image: null,
    emailVerified: true,
    twoFactorEnabled: false,
  };

  const mockSession = {
    id: 'session-1',
    token: 'session-token',
    userId: 'user-1',
  };

  beforeEach(() => {
    mockAuth = {
      api: {
        getSession: jest
          .fn()
          .mockResolvedValue({ user: mockUser, session: mockSession }),
      },
    };
    guard = new BetterAuthGuard(mockAuth);
  });

  function createMockContext(
    headers: Record<string, string> = {},
  ): ExecutionContext {
    const request: any = { headers };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as ExecutionContext;
  }

  it('should allow access when session is valid', async () => {
    const ctx = createMockContext({
      cookie: 'better-auth.session=valid-token',
    });
    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
    expect(mockAuth.api.getSession).toHaveBeenCalled();
  });

  it('should attach user and session to request', async () => {
    const ctx = createMockContext({
      cookie: 'better-auth.session=valid-token',
    });
    await guard.canActivate(ctx);

    const request = ctx.switchToHttp().getRequest();
    expect(request.user).toEqual(
      expect.objectContaining({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
      }),
    );
    expect(request.session).toEqual(mockSession);
  });

  it('should throw UnauthorizedException when session is invalid', async () => {
    mockAuth.api.getSession.mockResolvedValue(null);

    const ctx = createMockContext({ cookie: 'better-auth.session=expired' });
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException when no cookies are present', async () => {
    mockAuth.api.getSession.mockResolvedValue(null);

    const ctx = createMockContext();
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException when getSession returns user as null', async () => {
    mockAuth.api.getSession.mockResolvedValue({ user: null, session: null });

    const ctx = createMockContext({ cookie: 'some-cookie' });
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });
});
