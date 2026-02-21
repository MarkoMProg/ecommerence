import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AuthExtModule } from '../auth/auth-ext.module';
import { CartModule } from '../cart/cart.module';
import { CheckoutService } from './checkout.service';
import { CheckoutController } from './checkout.controller';
import { OrderService } from './order.service';
import { OrdersController } from './orders.controller';
import { StripeService } from './stripe.service';
import { StripeWebhookController } from './stripe-webhook.controller';

@Module({
  imports: [DatabaseModule, AuthExtModule, CartModule],
  controllers: [CheckoutController, OrdersController, StripeWebhookController],
  providers: [CheckoutService, OrderService, StripeService],
  exports: [CheckoutService, OrderService],
})
export class OrderModule {}
