import type { Request, Response } from 'express';
import {
  createTokenBucketRateLimitMiddleware,
  ensureForwardedForHeader,
  getClientIp,
} from '../token-bucket-rate-limit';

describe('token-bucket-rate-limit', () => {
  let nowMs = 1_700_000_000_000;

  beforeEach(() => {
    jest.spyOn(Date, 'now').mockImplementation(() => nowMs);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  function createReq(path: string, overrides?: Partial<Request>): Request {
    return {
      originalUrl: path,
      path,
      headers: {},
      ip: '127.0.0.1',
      socket: { remoteAddress: '127.0.0.1' },
      ...overrides,
    } as unknown as Request;
  }

  function createRes() {
    const status = jest.fn().mockReturnThis();
    const json = jest.fn().mockReturnThis();
    const setHeader = jest.fn();

    return {
      res: {
        status,
        json,
        setHeader,
      } as unknown as Response,
      status,
      json,
      setHeader,
    };
  }

  it('allows requests until capacity, then returns 429', () => {
    const middleware = createTokenBucketRateLimitMiddleware([
      {
        path: '/api/v1/auth/login',
        capacity: 3,
        refillTokensPerSecond: 3 / 60,
      },
    ]);

    const req = createReq('/api/v1/auth/login');
    const { res, status, json, setHeader } = createRes();

    const next1 = jest.fn();
    middleware(req, res, next1);
    expect(next1).toHaveBeenCalledTimes(1);

    const next2 = jest.fn();
    middleware(req, res, next2);
    expect(next2).toHaveBeenCalledTimes(1);

    const next3 = jest.fn();
    middleware(req, res, next3);
    expect(next3).toHaveBeenCalledTimes(1);

    const next4 = jest.fn();
    middleware(req, res, next4);

    expect(next4).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(429);
    expect(json).toHaveBeenCalledWith({
      message: 'Too many requests. Please try again later.',
    });
    expect(setHeader).toHaveBeenCalledWith('X-Retry-After', expect.any(String));
  });

  it('refills tokens over time and allows again after refill', () => {
    const middleware = createTokenBucketRateLimitMiddleware([
      { path: '/api/v1/auth/login', capacity: 2, refillTokensPerSecond: 1 },
    ]);

    const req = createReq('/api/v1/auth/login');
    const { res, status } = createRes();

    const next1 = jest.fn();
    middleware(req, res, next1);
    expect(next1).toHaveBeenCalledTimes(1);

    const next2 = jest.fn();
    middleware(req, res, next2);
    expect(next2).toHaveBeenCalledTimes(1);

    const next3 = jest.fn();
    middleware(req, res, next3);
    expect(next3).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(429);

    nowMs += 1_000;

    const next4 = jest.fn();
    middleware(req, res, next4);
    expect(next4).toHaveBeenCalledTimes(1);
  });

  it('matches rules by suffix when mounted route path differs', () => {
    const middleware = createTokenBucketRateLimitMiddleware([
      { path: '/sign-in/email', capacity: 1, refillTokensPerSecond: 0.1 },
    ]);

    const req = createReq('/api/auth/sign-in/email');
    const { res, status } = createRes();

    const next1 = jest.fn();
    middleware(req, res, next1);
    expect(next1).toHaveBeenCalledTimes(1);

    const next2 = jest.fn();
    middleware(req, res, next2);
    expect(next2).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(429);
  });

  it('ensureForwardedForHeader sets forwarded IP when missing', () => {
    const req = createReq('/api/auth/sign-in/email', {
      headers: {},
      ip: '10.0.0.5',
      socket: { remoteAddress: '10.0.0.5' } as Request['socket'],
    });

    ensureForwardedForHeader(req);

    expect(req.headers['x-forwarded-for']).toBe('10.0.0.5');
    expect(getClientIp(req)).toBe('10.0.0.5');
  });
});
