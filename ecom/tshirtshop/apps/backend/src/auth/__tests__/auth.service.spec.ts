import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { BETTER_AUTH_INSTANCE } from '../constants';

describe('AuthService', () => {
  let service: AuthService;
  let mockAuth: any;

  const mockUser = { id: 'user-1', email: 'test@example.com', name: 'Test User' };
  const mockSession = { id: 'session-1', token: 'tok', userId: 'user-1' };

  beforeEach(async () => {
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
    it('should authenticate and return user', async () => {
      mockAuth.api.signInEmail.mockResolvedValue({ user: mockUser, session: mockSession });

      const result = await service.login({
        email: 'test@example.com',
        password: 'Password1',
        headers: new Headers(),
      });

      expect(result).toEqual({ user: mockUser });
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
        service.login({ email: 'bad@example.com', password: 'wrong', headers: new Headers() }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

 

  describe('getSessionUser', () => {
    it('should return user when session is valid', async () => {
      mockAuth.api.getSession.mockResolvedValue({ user: mockUser });

      const result = await service.getSessionUser(new Headers({ cookie: 'x=y' }));
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
});
