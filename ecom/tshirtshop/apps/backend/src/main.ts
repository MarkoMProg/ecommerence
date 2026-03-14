import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { createTokenBucketRateLimitMiddleware } from './auth/token-bucket-rate-limit';

const authMountTokenBucketMiddleware = createTokenBucketRateLimitMiddleware(
  [
    { path: '/sign-in/email', capacity: 5, refillTokensPerSecond: 5 / 60 },
    { path: '/sign-up/email', capacity: 5, refillTokensPerSecond: 5 / 60 },
    { path: '/request-password-reset', capacity: 3, refillTokensPerSecond: 3 / 60 },
    { path: '/reset-password', capacity: 5, refillTokensPerSecond: 5 / 60 },
  ],
  new Map(),
  (req) => req.path,
);

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false });

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

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
