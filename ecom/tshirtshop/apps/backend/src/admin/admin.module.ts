import { Module } from '@nestjs/common';
import { BetterAuthCoreModule } from '../auth/better-auth-core.module';
import { DatabaseModule } from '../database/database.module';
import { OrderModule } from '../order/order.module';
import { AdminController } from './admin.controller';
import { AdminGuard } from './guards/admin.guard';


@Module({
  imports: [BetterAuthCoreModule, DatabaseModule, OrderModule],
  controllers: [AdminController],
  providers: [AdminGuard],
  exports: [AdminGuard],
})
export class AdminModule {}
