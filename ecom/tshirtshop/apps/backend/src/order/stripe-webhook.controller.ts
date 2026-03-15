import {
  Controller,
  Post,
  Req,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import type { Request } from 'express';
import { StripeService } from './stripe.service';
import { OrderService } from './order.service';

/**
 * Stripe webhook endpoint (PAY-002).
 * Receives checkout.session.completed and marks order as paid.
 * Requires raw body for signature verification — middleware applies express.raw() to this path.
 */
@Controller('webhooks')
export class StripeWebhookController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly orderService: OrderService,
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
      await this.orderService.markOrderPaidIfPending(result.orderId, {
        stripeSessionId: result.sessionId,
      });
    }

    return { received: true };
  }
}
