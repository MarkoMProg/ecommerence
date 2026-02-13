import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });

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
