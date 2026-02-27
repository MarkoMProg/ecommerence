import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../database/database.module';
import { BetterAuthCoreModule } from './better-auth-core.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { BetterAuthGuard } from './guards/jwt-auth.guard';
import { OptionalAuthGuard } from './guards/optional-auth.guard';


@Module({
  imports: [BetterAuthCoreModule, DatabaseModule, ConfigModule],
  controllers: [AuthController],
  providers: [AuthService, BetterAuthGuard, OptionalAuthGuard],
  exports: [AuthService, BetterAuthGuard, OptionalAuthGuard, BetterAuthCoreModule],
})
export class AuthExtModule {}
