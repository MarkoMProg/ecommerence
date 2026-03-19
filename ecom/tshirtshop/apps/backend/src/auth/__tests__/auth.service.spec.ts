import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { BETTER_AUTH_INSTANCE } from '../constants';
import { DATABASE_CONNECTION } from '../../database/database-connection';

jest.mock('../crypto', () => ({
  decrypt: jest.fn((v: string) => v),
  encrypt: jest.fn((v: string) => v),
  blindIndex: jest.fn((v: string) => v),
  blindEmail: jest.fn((v: string) => `${v}@blind.index`),
}));

interface MockAuthApi {
  signUpEmail: jest.Mock;
  signInEmail: jest.Mock;
  getSession: jest.Mock;
  signOut: jest.Mock;
  revokeSessions: jest.Mock;
  listSessions: jest.Mock;
}

describe('AuthService', () => {
  let service: AuthService;
  let mockAuth: { api: MockAuthApi };
  let mockDb: {
    select: jest.Mock;
    insert: jest.Mock;
    update: jest.Mock;
  };

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
  };
  const mockSession = { id: 'session-1', token: 'tok', userId: 'user-1' };

  beforeEach(async () => {
    mockDb = {
      select: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
    };

    mockAuth = {
      api: {
        signUpEmail: jest.fn(),
        signInEmail: jest.fn(),
        getSession: jest.fn(),
        signOut: jest.fn().mockResolvedValue(undefined),
        revokeSessions: jest.fn().mockResolvedValue(undefined),
        listSessions: jest.fn().mockResolvedValue([]),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: BETTER_AUTH_INSTANCE,
          useValue: mockAuth,
        },
        {
          provide: DATABASE_CONNECTION,
          useValue: mockDb,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('should create user and return user data', async () => {
      mockAuth.api.signUpEmail.mockResolvedValue({ user: mockUser });

      const result = await service.register({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password1',
        headers: new Headers(),
      });

      expect(mockAuth.api.signUpEmail).toHaveBeenCalled();
      expect(result.user).toEqual(mockUser);
    });

    it('should throw BadRequestException when Better Auth signup fails', async () => {
      mockAuth.api.signUpEmail.mockResolvedValue({ user: null });

      await expect(
        service.register({
          name: 'Test',
          email: 'test@example.com',
          password: 'Password1',
          headers: new Headers(),
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('login', () => {
    it('should authenticate and return user with auto-issued refresh token', async () => {
      const values = jest.fn().mockResolvedValue(undefined);
      mockDb.insert.mockReturnValue({ values });

      mockAuth.api.signInEmail.mockResolvedValue({
        user: mockUser,
        session: mockSession,
      });

      const result = await service.login({
        email: 'test@example.com',
        password: 'Password1',
        headers: new Headers(),
      });

      expect(result).toEqual({ user: mockUser });
      expect(mockDb.insert).not.toHaveBeenCalled();
    });

    it('should return twoFactorRequired when 2FA is needed', async () => {
      mockAuth.api.signInEmail.mockResolvedValue({ twoFactorRedirect: true });

      const result = await service.login({
        email: 'test@example.com',
        password: 'Password1',
        headers: new Headers(),
      });

      expect(result).toEqual({ twoFactorRequired: true });
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      mockAuth.api.signInEmail.mockRejectedValue(new Error('Invalid'));

      await expect(
        service.login({
          email: 'bad@example.com',
          password: 'wrong',
          headers: new Headers(),
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getSessionUser', () => {
    it('should return user when session is valid', async () => {
      mockAuth.api.getSession.mockResolvedValue({ user: mockUser });

      const result = await service.getSessionUser(
        new Headers({ cookie: 'x=y' }),
      );
      expect(result).toEqual(mockUser);
    });

    it('should return null when no session', async () => {
      mockAuth.api.getSession.mockResolvedValue(null);

      const result = await service.getSessionUser(new Headers());
      expect(result).toBeNull();
    });
  });

  describe('revokeSession', () => {
    it('should delegate to auth.api.signOut', async () => {
      const headers = new Headers({ cookie: 'session=tok' });
      await service.revokeSession(headers);
      expect(mockAuth.api.signOut).toHaveBeenCalledWith({ headers });
    });
  });

  describe('revokeAllSessions', () => {
    it('should delegate to auth.api.revokeSessions', async () => {
      const headers = new Headers({ cookie: 'session=tok' });
      await service.revokeAllSessions(headers);
      expect(mockAuth.api.revokeSessions).toHaveBeenCalledWith({ headers });
    });
  });

  describe('refresh token rotation security', () => {
    it('rotates a valid refresh token and returns new token or null', async () => {
      const oldToken = 'old-refresh-token';
      const existing = {
        id: 'rt-1',
        userId: mockUser.id,
        tokenHash: 'hash',
        expiresAt: new Date(Date.now() + 60_000),
        usedAt: null,
      };

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([existing]),
          }),
        }),
      });

      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest
              .fn()
              .mockResolvedValue([{ id: existing.id, userId: existing.userId }]),
          }),
        }),
      });

      const values = jest.fn().mockResolvedValue(undefined);
      mockDb.insert.mockReturnValue({ values });

      const result = await service.rotateRefreshToken(oldToken);

      expect(result).toBeDefined();
      expect(result).not.toBe(oldToken);
    });

    it('silently returns null for already-used refresh tokens (non-throwing)', async () => {
      const existing = {
        id: 'rt-1',
        userId: mockUser.id,
        tokenHash: 'hash',
        expiresAt: new Date(Date.now() + 60_000),
        usedAt: new Date(),
      };

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([existing]),
          }),
        }),
      });

      const result = await service.rotateRefreshToken('already-used-token');

      expect(result).toBeNull();
      expect(mockDb.update).not.toHaveBeenCalled();
    });

    it('silently returns null if token not found or consumed (non-throwing)', async () => {
      const existing = {
        id: 'rt-1',
        userId: mockUser.id,
        tokenHash: 'hash',
        expiresAt: new Date(Date.now() + 60_000),
        usedAt: null,
      };

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([existing]),
          }),
        }),
      });

      // Simulate a race where the token has already been consumed by another request.
      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await service.rotateRefreshToken('old-token');

      expect(result).toBeNull();
    });

    it('enforces single-use rotation and rejects replayed old tokens', async () => {
      const freshTokenA = 'token-a';
      const recordAUnused = {
        id: 'rt-1',
        userId: mockUser.id,
        tokenHash: 'hash-a',
        expiresAt: new Date(Date.now() + 60_000),
        usedAt: null,
      };
      const recordAUsed = {
        ...recordAUnused,
        usedAt: new Date(),
      };
      const recordBUnused = {
        id: 'rt-2',
        userId: mockUser.id,
        tokenHash: 'hash-b',
        expiresAt: new Date(Date.now() + 60_000),
        usedAt: null,
      };
      const recordBUsed = {
        ...recordBUnused,
        usedAt: new Date(),
      };

      const selectLimit = jest
        .fn()

        .mockResolvedValueOnce([recordAUnused])

        .mockResolvedValueOnce([recordAUsed])

        .mockResolvedValueOnce([recordBUnused])

        .mockResolvedValueOnce([recordBUsed]);

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: selectLimit,
          }),
        }),
      });

      mockDb.update
        // consume token A
        .mockReturnValueOnce({
          set: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              returning: jest
                .fn()
                .mockResolvedValue([{ id: recordAUnused.id, userId: mockUser.id }]),
            }),
          }),
        })
        // consume token B
        .mockReturnValueOnce({
          set: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              returning: jest
                .fn()
                .mockResolvedValue([{ id: recordBUnused.id, userId: mockUser.id }]),
            }),
          }),
        });

      const values = jest.fn().mockResolvedValue(undefined);
      mockDb.insert.mockReturnValue({ values });

      const freshTokenB = await service.rotateRefreshToken(freshTokenA);
      const replayA = await service.rotateRefreshToken(freshTokenA);
      const freshTokenC = await service.rotateRefreshToken(freshTokenB);
      const replayB = await service.rotateRefreshToken(freshTokenB);

      expect(freshTokenB).toBeDefined();
      expect(freshTokenC).toBeDefined();
      expect(freshTokenB).not.toBe(freshTokenA);
      expect(freshTokenC).not.toBe(freshTokenB);
      expect(replayA).toBeNull();
      expect(replayB).toBeNull();
      expect(mockDb.update).toHaveBeenCalledTimes(2);
      expect(mockDb.insert).toHaveBeenCalledTimes(2);
      expect(values).toHaveBeenCalledTimes(2);
    });
  });
});
