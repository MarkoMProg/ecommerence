import {
  Controller,
  Post,
  Req,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Request } from 'express';
import { Queue } from 'bullmq';
import { StripeService } from './stripe.service';
import {
  PAYMENT_EVENTS_QUEUE,
  type PaymentSuccessJobData,
} from './payment-events.processor';

@Controller('webhooks')
export class StripeWebhookController {
  constructor(
    private readonly stripeService: StripeService,
    @InjectQueue(PAYMENT_EVENTS_QUEUE)
    private readonly paymentQueue: Queue<PaymentSuccessJobData>,
  ) {}

  @Post('stripe')
  @HttpCode(HttpStatus.OK)
  async handleStripeWebhook(
    @Req() req: Request,
  ): Promise<{ received: boolean }> {
    const rawBody = req.body as Buffer | undefined;

    if (!rawBody || !Buffer.isBuffer(rawBody)) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'RAW_BODY_REQUIRED',
          message:
            'Webhook requires raw body. Ensure express.raw() is applied to this route.',
        },
      });
    }

    const signature = req.headers['stripe-signature'];
    if (typeof signature !== 'string') {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'STRIPE_SIGNATURE_REQUIRED',
          message: 'Missing Stripe-Signature header',
        },
      });
    }

    const result = this.stripeService.handleWebhookEvent(rawBody, signature);
    if (result) {
      await this.paymentQueue.add(
        'payment.success',
        { orderId: result.orderId, sessionId: result.sessionId },
        {
          attempts: 5,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: { count: 1000 },
          removeOnFail: false,
        },
      );
    }

    return { received: true };
  }
}
