import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { CartModule } from '../cart/cart.module';
import { CheckoutService } from './checkout.service';
import { CheckoutController } from './checkout.controller';
import { OrderService } from './order.service';
import { OrdersController } from './orders.controller';

@Module({
  imports: [DatabaseModule, CartModule],
  controllers: [CheckoutController, OrdersController],
  providers: [CheckoutService, OrderService],
  exports: [CheckoutService, OrderService],
})
export class OrderModule {}
