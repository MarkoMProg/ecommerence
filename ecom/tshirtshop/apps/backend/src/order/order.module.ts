import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { DatabaseModule } from '../database/database.module';
import { AuthExtModule } from '../auth/auth-ext.module';
import { CartModule } from '../cart/cart.module';
import { InventoryModule } from '../inventory/inventory.module';
import { EmailModule } from '../email/email.module';
import { CheckoutService } from './checkout.service';
import { CheckoutController } from './checkout.controller';
import { OrderService } from './order.service';
import { OrdersController } from './orders.controller';
import { StripeService } from './stripe.service';
import { StripeWebhookController } from './stripe-webhook.controller';
import { PaymentEventsProcessor, PAYMENT_EVENTS_QUEUE } from './payment-events.processor';

@Module({
  imports: [
    DatabaseModule,
    AuthExtModule,
    CartModule,
    InventoryModule,
    EmailModule,
    BullModule.registerQueue({ name: PAYMENT_EVENTS_QUEUE }),
  ],
  controllers: [CheckoutController, OrdersController, StripeWebhookController],
  providers: [CheckoutService, OrderService, StripeService, PaymentEventsProcessor],
  exports: [CheckoutService, OrderService],
})
export class OrderModule {}
