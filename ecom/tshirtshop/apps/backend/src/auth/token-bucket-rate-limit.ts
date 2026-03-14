import type { NextFunction, Request, Response } from 'express';

export type TokenBucketRule = {
  path: string;
  capacity: number;
  refillTokensPerSecond: number;
};

type BucketState = {
  tokens: number;
  lastRefillAtMs: number;
};

const DEFAULT_IP = '127.0.0.1';

function parseForwardedIp(forwardedFor: string | string[] | undefined): string | undefined {
  if (typeof forwardedFor === 'string' && forwardedFor.trim().length > 0) {
    return forwardedFor.split(',')[0]?.trim() || undefined;
  }
  if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
    return forwardedFor[0]?.trim() || undefined;
  }
  return undefined;
}

export function getClientIp(req: Request): string {
  return (
    parseForwardedIp(req.headers['x-forwarded-for']) ||
    req.ip ||
    req.socket.remoteAddress ||
    DEFAULT_IP
  );
}

export function ensureForwardedForHeader(req: Request): void {
  if (!req.headers['x-forwarded-for']) {
    req.headers['x-forwarded-for'] = getClientIp(req);
  }
}

function selectRule(path: string, rules: TokenBucketRule[]): TokenBucketRule | undefined {
  return rules.find((rule) => path === rule.path || path.endsWith(rule.path));
}

function consumeToken(
  store: Map<string, BucketState>,
  key: string,
  capacity: number,
  refillTokensPerSecond: number,
): { allowed: true } | { allowed: false; retryAfterSeconds: number } {
  const nowMs = Date.now();
  const current = store.get(key) ?? {
    tokens: capacity,
    lastRefillAtMs: nowMs,
  };

  const elapsedSeconds = Math.max(0, (nowMs - current.lastRefillAtMs) / 1000);
  const refilled = Math.min(capacity, current.tokens + elapsedSeconds * refillTokensPerSecond);

  if (refilled < 1) {
    const missingTokens = 1 - refilled;
    const retryAfterSeconds = Math.max(1, Math.ceil(missingTokens / refillTokensPerSecond));
    store.set(key, {
      tokens: refilled,
      lastRefillAtMs: nowMs,
    });
    return { allowed: false, retryAfterSeconds };
  }

  store.set(key, {
    tokens: refilled - 1,
    lastRefillAtMs: nowMs,
  });

  return { allowed: true };
}

export function createTokenBucketRateLimitMiddleware(
  rules: TokenBucketRule[],
  store = new Map<string, BucketState>(),
  resolvePath: (req: Request) => string = (req) => req.originalUrl.split('?')[0] || req.path,
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const requestPath = resolvePath(req);
    const rule = selectRule(requestPath, rules);

    if (!rule) {
      next();
      return;
    }

    ensureForwardedForHeader(req);
    const ip = getClientIp(req);
    const key = `${ip}|${rule.path}`;

    const result = consumeToken(store, key, rule.capacity, rule.refillTokensPerSecond);
    if (!result.allowed) {
      res.setHeader('X-Retry-After', result.retryAfterSeconds.toString());
      res.status(429).json({ message: 'Too many requests. Please try again later.' });
      return;
    }

    next();
  };
}
