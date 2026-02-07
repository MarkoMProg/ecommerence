import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuthGuard, AuthModule } from '@thallesp/nestjs-better-auth';
import { betterAuth } from 'better-auth';
import { NodePgDatabase } from 'drizzle-orm/node-postgres/driver';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { DATABASE_CONNECTION } from './database/database-connection';
import { UsersModule } from './users/users.module';
import { config } from 'process';

@Module({
  imports: [
    UsersModule,
    ConfigModule.forRoot(),
    AuthModule.forRootAsync({
      imports: [DatabaseModule, ConfigModule],
      useFactory: (database: NodePgDatabase, configService: ConfigService) => ({
        auth:betterAuth({
          database: drizzleAdapter(database, {
            provider: 'pg',
          }),
          emailAndPassword: {
              enabled: true,
          },
          trustedOrigins: [
            configService.getOrThrow('UI_URL'),
          ]
        }),
      }),
      inject: [DATABASE_CONNECTION, ConfigService]
    }),
  ],
  controllers: [],
  providers: [
    {
      provide: 'AUTH_GUARD',
      useClass: AuthGuard
      },
  ],
})
export class AppModule {}
