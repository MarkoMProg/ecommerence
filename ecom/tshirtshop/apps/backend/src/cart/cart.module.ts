import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AuthExtModule } from '../auth/auth-ext.module';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';

@Module({
  imports: [DatabaseModule, AuthExtModule],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}
