import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { BETTER_AUTH_INSTANCE } from './auth/constants';
import { BetterAuthCoreModule } from './auth/better-auth-core.module';
import { AuthExtModule } from './auth/auth-ext.module';
import { UsersModule } from './users/users.module';
import { CatalogModule } from './catalog/catalog.module';
import { betterAuth } from 'better-auth';
import * as express from 'express';

type BetterAuthInstance = ReturnType<typeof betterAuth>;

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
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Parse JSON body for our custom endpoints (not Better Auth — it handles its own body)
    consumer
      .apply(express.json(), express.urlencoded({ extended: true }))
      .forRoutes('api/v1/*path');
  }
}
