import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DATABASE_CONNECTION } from './database-connection';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as authSchema from '../auth/schema';
import * as catalogSchema from '../catalog/schema';
import * as cartSchema from '../cart/schema';
import * as orderSchema from '../order/schema';
import * as reviewSchema from '../review/schema';
import * as addressSchema from '../address/schema';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: DATABASE_CONNECTION,
      useFactory: (configService: ConfigService) => {
        const pool = new Pool({
          connectionString: configService.getOrThrow('DATABASE_URL'),
          max: 5, // Limit connections to leave room for pgAdmin
          idleTimeoutMillis: 10000, // Close idle connections promptly
          connectionTimeoutMillis: 10000, // Error sooner on connection issues
        });
        return drizzle(pool, {
          schema: {
            ...authSchema,
            ...catalogSchema,
            ...cartSchema,
            ...orderSchema,
            ...reviewSchema,
            ...addressSchema,
          },
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [DATABASE_CONNECTION],
})
export class DatabaseModule {}
