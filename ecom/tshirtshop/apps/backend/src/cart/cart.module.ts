import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AuthExtModule } from '../auth/auth-ext.module';
import { InventoryModule } from '../inventory/inventory.module';
import { CatalogModule } from '../catalog/catalog.module';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';

@Module({
  imports: [DatabaseModule, AuthExtModule, InventoryModule, CatalogModule],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}
