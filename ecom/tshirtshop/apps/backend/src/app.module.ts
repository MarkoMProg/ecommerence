import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { BETTER_AUTH_INSTANCE } from './auth/constants';
import { BetterAuthCoreModule } from './auth/better-auth-core.module';
import { AuthExtModule } from './auth/auth-ext.module';
import { UsersModule } from './users/users.module';
import { CatalogModule } from './catalog/catalog.module';
import { CartModule } from './cart/cart.module';
import { OrderModule } from './order/order.module';
import { AdminModule } from './admin/admin.module';
import { UploadModule } from './upload/upload.module';
import { ReviewModule } from './review/review.module';
import { AddressModule } from './address/address.module';
import { BillingModule } from './billing/billing.module';
import { betterAuth } from 'better-auth';
import * as express from 'express';
import {
  createTokenBucketRateLimitMiddleware,
  ensureForwardedForHeader,
} from './auth/token-bucket-rate-limit';

type BetterAuthInstance = ReturnType<typeof betterAuth>;

const authControllerTokenBucketMiddleware = createTokenBucketRateLimitMiddleware([
  { path: '/api/v1/auth/login', capacity: 5, refillTokensPerSecond: 5 / 60 },
]);

/** SEC-002: Rate limit checkout and payment endpoints. */
const checkoutTokenBucketMiddleware = createTokenBucketRateLimitMiddleware([
  { path: '/api/v1/checkout', capacity: 10, refillTokensPerSecond: 10 / 60 },
  { path: '/payment-url', capacity: 5, refillTokensPerSecond: 5 / 60 },
  { path: '/verify-payment', capacity: 10, refillTokensPerSecond: 10 / 60 },
]);

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    BetterAuthCoreModule,
    AuthModule.forRootAsync({
      imports: [BetterAuthCoreModule],
      useFactory: (auth: BetterAuthInstance) => ({ auth }),
      inject: [BETTER_AUTH_INSTANCE],
    }),
    AuthExtModule,
    UsersModule,
    CatalogModule,
    CartModule,
    OrderModule,
    AdminModule,
    UploadModule,
    ReviewModule,
    AddressModule,
    BillingModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(authControllerTokenBucketMiddleware)
      .forRoutes({ path: 'api/v1/auth/login', method: RequestMethod.POST });

    // SEC-002: Rate limit checkout and payment endpoints
    consumer
      .apply(checkoutTokenBucketMiddleware)
      .forRoutes(
        { path: 'api/v1/checkout', method: RequestMethod.POST },
        { path: 'api/v1/checkout/verify-payment', method: RequestMethod.POST },
        { path: 'api/v1/checkout/:orderId/payment-url', method: RequestMethod.POST },
      );

    // Ensure forwarded IP is present for auth-mounted routes.
    consumer
      .apply((req: express.Request, _res: express.Response, next: express.NextFunction) => {
        ensureForwardedForHeader(req);
        next();
      })
      .forRoutes({ path: 'api/auth/*path', method: RequestMethod.ALL });

    // Stripe webhook needs raw body for signature verification (PAY-002)
    consumer
      .apply(express.raw({ type: 'application/json' }))
      .forRoutes({ path: 'webhooks/stripe', method: RequestMethod.POST });
    // Parse JSON for API routes
    consumer
      .apply(express.json(), express.urlencoded({ extended: true }))
      .forRoutes('api/v1/*path');
  }
}
