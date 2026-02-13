/// <reference types="jest" />
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { BetterAuthGuard } from '../guards/jwt-auth.guard';
import { BETTER_AUTH_INSTANCE } from '../constants';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
  };
  const mockSession = { id: 'session-1', token: 'tok', userId: 'user-1' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest
              .fn()
              .mockResolvedValue({ user: mockUser, session: mockSession }),
            login: jest
              .fn()
              .mockResolvedValue({ user: mockUser, session: mockSession }),
            revokeAllSessions: jest.fn().mockResolvedValue(undefined),
            listSessions: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: BETTER_AUTH_INSTANCE,
          useValue: {
            api: {
              getSession: jest
                .fn()
                .mockResolvedValue({ user: mockUser, session: mockSession }),
            },
          },
        },
        BetterAuthGuard,
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register and return user info', async () => {
      const req = {
        body: {
          name: 'Test User',
          email: 'test@example.com',
          password: 'Password1',
          captchaToken: 'valid-captcha',
        },
        headers: { 'x-captcha-response': 'valid-captcha' },
      } as any;

      const result = await controller.register(req);

      expect(authService.register).toHaveBeenCalledWith({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password1',
        headers: expect.any(Headers),
      });
      expect(result.user).toEqual({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
      });
      expect(result.message).toBeDefined();
    });

    it('should throw validation error for missing fields', async () => {
      const req = { body: { email: 'bad' } } as any;
      await expect(controller.register(req)).rejects.toThrow();
    });

    it('should throw validation error for weak password', async () => {
      const req = {
        body: {
          name: 'Test',
          email: 'test@example.com',
          password: 'weak',
          captchaToken: 'valid',
        },
      } as any;
      await expect(controller.register(req)).rejects.toThrow();
    });
  });

  describe('login', () => {
    it('should login and return user info', async () => {
      const req = {
        body: { email: 'test@example.com', password: 'Password1' },
      } as any;

      const result = await controller.login(req);

      expect(result.user).toEqual({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
      });
    });

    it('should return twoFactorRequired when 2FA is needed', async () => {
      (authService.login as jest.Mock).mockResolvedValue({
        twoFactorRequired: true,
      });

      const req = {
        body: { email: 'test@example.com', password: 'Password1' },
      } as any;

      const result = await controller.login(req);
      expect(result).toEqual({ twoFactorRequired: true });
    });
  });

  describe('getMe', () => {
    it('should return the user from request', () => {
      const req = {
        user: { id: 'user-1', email: 'test@example.com', name: 'Test' },
      } as any;
      const result = controller.getMe(req);
      expect(result).toEqual({
        user: { id: 'user-1', email: 'test@example.com', name: 'Test' },
      });
    });
  });

  describe('revokeAll', () => {
    it('should delegate to authService.revokeAllSessions', async () => {
      const req = { headers: { cookie: 'session=tok' } } as any;
      await controller.revokeAll(req);
      expect(authService.revokeAllSessions).toHaveBeenCalled();
    });
  });
});
