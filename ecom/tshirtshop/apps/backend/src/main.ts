import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { readFileSync, existsSync } from 'fs';
import { AppModule } from './app.module';
import { createTokenBucketRateLimitMiddleware } from './auth/token-bucket-rate-limit';

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
