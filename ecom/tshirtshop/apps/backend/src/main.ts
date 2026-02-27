import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false });

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
