import { Module } from '@nestjs/common';
import { BetterAuthCoreModule } from '../auth/better-auth-core.module';
import { DatabaseModule } from '../database/database.module';
import { OrderModule } from '../order/order.module';
import { CatalogModule } from '../catalog/catalog.module';
import { AdminController } from './admin.controller';
import { AdminGuard } from './guards/admin.guard';
import { BulkUploadService } from '../catalog/bulk-upload.service';


@Module({
  imports: [BetterAuthCoreModule, DatabaseModule, OrderModule, CatalogModule],
  controllers: [AdminController],
  providers: [AdminGuard, BulkUploadService],
  exports: [AdminGuard],
})
export class AdminModule {}
