import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { readFileSync, existsSync } from 'fs';
import type { Request, Response, NextFunction } from 'express';
import { AppModule } from './app.module';
import { createTokenBucketRateLimitMiddleware } from './auth/token-bucket-rate-limit';
import { decrypt } from './auth/crypto';

const authMountTokenBucketMiddleware = createTokenBucketRateLimitMiddleware(
  [
    { path: '/sign-in/email', capacity: 5, refillTokensPerSecond: 5 / 60 },
    { path: '/sign-up/email', capacity: 5, refillTokensPerSecond: 5 / 60 },
    {
      path: '/request-password-reset',
      capacity: 3,
      refillTokensPerSecond: 3 / 60,
    },
    { path: '/reset-password', capacity: 5, refillTokensPerSecond: 5 / 60 },
  ],
  new Map(),
  (req) => req.path,
);

async function bootstrap() {
  const useHttps =
    process.env.USE_HTTPS === '1' || process.env.USE_HTTPS === 'true';
  const certsDir = join(process.cwd(), 'certs');
  const keyPath = join(certsDir, 'key.pem');
  const certPath = join(certsDir, 'cert.pem');

  let httpsOptions: { key: Buffer; cert: Buffer } | undefined;
  if (useHttps && existsSync(keyPath) && existsSync(certPath)) {
    try {
      httpsOptions = {
        key: readFileSync(keyPath),
        cert: readFileSync(certPath),
      };
      console.log(
        '[main] HTTPS enabled (SEC-001). Using self-signed cert from certs/',
      );
    } catch (err) {
      console.warn(
        '[main] USE_HTTPS=1 but failed to load certs:',
        (err as Error).message,
      );
    }
  } else if (useHttps) {
    console.warn(
      '[main] USE_HTTPS=1 but certs not found. Run: node scripts/generate-tls-cert.mjs',
    );
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
    httpsOptions: httpsOptions ?? undefined,
  });

  app.use('/api/auth', authMountTokenBucketMiddleware);

  // Decrypt encrypted user fields (email, name) in Better Auth admin API responses.
  // BA's adapter writes via res.end(), not res.json(), so we intercept end().
  app.use(
    '/api/auth/admin/',
    (_req: Request, res: Response, next: NextFunction) => {
      const originalEnd = res.end.bind(res) as Response['end'];
      res.end = ((...args: unknown[]) => {
        try {
          const chunk = args[0];
          const contentType = res.getHeader('content-type');
          if (
            chunk &&
            typeof contentType === 'string' &&
            contentType.includes('application/json')
          ) {
            const raw =
              typeof chunk === 'string'
                ? chunk
                : Buffer.isBuffer(chunk)
                  ? chunk.toString('utf8')
                  : null;
            if (raw) {
              const data = JSON.parse(raw) as Record<string, unknown>;
              let modified = false;
              const decryptUser = (u: Record<string, unknown>) => {
                const enc = u['emailEncrypted'] ?? u['email_encrypted'];
                const name = u['name'];
                return {
                  ...u,
                  email: enc ? decrypt(enc as string) : u['email'],
                  name: name
                    ? (() => {
                        try {
                          return decrypt(name as string);
                        } catch {
                          return name;
                        }
                      })()
                    : name,
                };
              };
              const users = data['users'];
              if (users && Array.isArray(users)) {
                data['users'] = (users as Record<string, unknown>[]).map(
                  decryptUser,
                );
                modified = true;
              }
              const user = data['user'];
              if (user && typeof user === 'object' && user !== null) {
                data['user'] = decryptUser(user as Record<string, unknown>);
                modified = true;
              }
              if (modified) {
                const body = JSON.stringify(data);
                res.setHeader('content-length', Buffer.byteLength(body));
                return originalEnd(body, args[1] as BufferEncoding);
              }
            }
          }
        } catch {
          // never break admin functionality
        }
        return originalEnd(...(args as Parameters<Response['end']>));
      }) as Response['end'];
      next();
    },
  );

  // Serve uploaded product images: GET /uploads/<filename>
  app.useStaticAssets(join(process.cwd(), 'public', 'uploads'), {
    prefix: '/uploads',
  });

  // Enable CORS for the frontend with all necessary headers for Better Auth
  app.enableCors({
    origin: process.env.UI_URL || 'http://localhost:3001',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Cookie',
      'x-captcha-response',
      'x-better-auth',
    ],
    exposedHeaders: ['Set-Cookie'],
  });

  const port = process.env.PORT ?? 3000;
  const protocol = httpsOptions ? 'https' : 'http';
  await app.listen(port);
  console.log(`[main] Listening on ${protocol}://localhost:${port}`);
}
void bootstrap();
