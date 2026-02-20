import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../database/database.module';
import { BetterAuthCoreModule } from './better-auth-core.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { BetterAuthGuard } from './guards/jwt-auth.guard';
import { AdminGuard } from './guards/admin.guard';

@Module({
  imports: [BetterAuthCoreModule, DatabaseModule, ConfigModule],
  controllers: [AuthController],
  providers: [AuthService, BetterAuthGuard, AdminGuard],
  exports: [AuthService, BetterAuthGuard, AdminGuard, BetterAuthCoreModule],
})
export class AuthExtModule {}
