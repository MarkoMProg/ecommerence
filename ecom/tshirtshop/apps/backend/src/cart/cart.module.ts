import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AuthExtModule } from '../auth/auth-ext.module';
import { InventoryModule } from '../inventory/inventory.module';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';

@Module({
  imports: [DatabaseModule, AuthExtModule, InventoryModule],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}
