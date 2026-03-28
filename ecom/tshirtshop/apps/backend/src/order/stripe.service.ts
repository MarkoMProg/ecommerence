import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

/**
 * Stripe PaymentIntent integration (PAY-001).
 * Only active when STRIPE_SECRET_KEY is set.
 */
export type WebhookResult =
  | { type: 'payment.success'; orderId: string; paymentIntentId: string }
  | {
      type: 'payment.failed';
      orderId: string;
      paymentIntentId: string;
      reason: string;
    };

@Injectable()
export class StripeService {
  private readonly stripe: Stripe | null = null;

  constructor(private readonly configService: ConfigService) {
    const secretKey = this.configService
      .get<string>('STRIPE_SECRET_KEY')
      ?.trim();
    if (secretKey?.startsWith('sk_')) {
      this.stripe = new Stripe(secretKey);
    }
  }

  isConfigured(): boolean {
    // BRITTLE: Local E2E only — Playwright sets E2E_SKIP_STRIPE_CHECKOUT=1 so checkout
    // can skip PaymentIntent and redirect to /checkout/confirmation without Stripe keys. Ignored in production.
    const skipStripe =
      this.configService.get<string>('E2E_SKIP_STRIPE_CHECKOUT')?.trim() ===
        '1' || process.env.E2E_SKIP_STRIPE_CHECKOUT === '1';
    if (process.env.NODE_ENV !== 'production' && skipStripe) {
      return false;
    }
    return this.stripe !== null;
  }

  /**
   * Create a Stripe PaymentIntent for an order.
   * Returns { clientSecret, paymentIntentId } or null if Stripe not configured.
   * Pass customerId to attach saved payment methods.
   */
  async createPaymentIntent(
    orderId: string,
    totalCents: number,
    currency: string = 'usd',
    customerId?: string | null,
  ): Promise<{ clientSecret: string; paymentIntentId: string } | null> {
    if (!this.stripe) return null;

    const params: Stripe.PaymentIntentCreateParams = {
      amount: totalCents,
      currency,
      metadata: { orderId },
      automatic_payment_methods: { enabled: true },
    };

    if (customerId) {
      params.customer = customerId;
      params.setup_future_usage = 'off_session';
    }

    const pi = await this.stripe.paymentIntents.create(params);
    return {
      clientSecret: pi.client_secret!,
      paymentIntentId: pi.id,
    };
  }

  /**
   * Create a Stripe Customer Session so PaymentElement can display saved payment methods.
   * Returns the customer_session client_secret, or null if Stripe/customer not available.
   */
  async createCustomerSession(
    customerId: string,
  ): Promise<string | null> {
    if (!this.stripe) return null;
    const session = await (this.stripe as any).customerSessions.create({
      customer: customerId,
      components: {
        payment_element: {
          enabled: true,
          features: {
            payment_method_redisplay: 'enabled',
            payment_method_save: 'enabled',
            payment_method_remove: 'enabled',
          },
        },
      },
    });
    return session.client_secret ?? null;
  }

  /** Result from processing a Stripe webhook event. */
  handleWebhookEvent(
    rawBody: Buffer,
    signature: string,
  ): WebhookResult | null {
    if (!this.stripe) return null;

    const webhookSecret = this.configService
      .get<string>('STRIPE_WEBHOOK_SECRET')
      ?.trim();
    if (!webhookSecret) {
      throw new Error(
        'STRIPE_WEBHOOK_SECRET is required for webhook verification',
      );
    }

    const event = this.stripe.webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret,
    );

    if (event.type === 'payment_intent.succeeded') {
      const pi = event.data.object;
      const orderId = pi.metadata?.orderId?.trim();
      if (orderId && pi.id) {
        return {
          type: 'payment.success',
          orderId,
          paymentIntentId: pi.id,
        };
      }
    }

    if (event.type === 'payment_intent.payment_failed') {
      const pi = event.data.object;
      const orderId = pi.metadata?.orderId?.trim();
      if (orderId && pi.id) {
        return {
          type: 'payment.failed',
          orderId,
          paymentIntentId: pi.id,
          reason:
            pi.last_payment_error?.message ??
            'Your payment method was declined or could not be processed. Please try a different payment method.',
        };
      }
    }

    return null;
  }

  /**
   * Create a full refund for an order paid via Stripe PaymentIntent.
   * Returns { refundId } on success.
   */
  async createRefundForPaymentIntent(
    paymentIntentId: string,
    amountCents: number,
  ): Promise<{ refundId: string }> {
    if (!this.stripe) {
      throw new Error('Stripe is not configured');
    }

    const pi = await this.stripe.paymentIntents.retrieve(paymentIntentId);
    if (pi.status !== 'succeeded') {
      throw new Error(`Payment not captured: ${pi.status}`);
    }

    const refund = await this.stripe.refunds.create({
      payment_intent: pi.id,
      amount: amountCents,
      reason: 'requested_by_customer',
    });

    return { refundId: refund.id };
  }

  /**
   * Retrieve the receipt email from a PaymentIntent.
   * Returns the email from receipt_email or customer, or null.
   */
  async getPaymentIntentEmail(
    paymentIntentId: string,
  ): Promise<string | null> {
    if (!this.stripe) return null;
    try {
      const pi = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      if (pi.receipt_email) return pi.receipt_email;
      if (pi.customer && typeof pi.customer === 'string') {
        const customer = await this.stripe.customers.retrieve(pi.customer);
        if (!customer.deleted && customer.email) return customer.email;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Verify a PaymentIntent and return orderId if payment succeeded (PAY-002: amount validation).
   * Throws if PI not found, not succeeded, metadata.orderId mismatch, or amount mismatch.
   */
  async verifyPaymentIntent(
    paymentIntentId: string,
    expectedOrderId?: string,
    expectedTotalCents?: number,
  ): Promise<string> {
    if (!this.stripe) {
      throw new Error('Stripe is not configured');
    }

    const pi = await this.stripe.paymentIntents.retrieve(paymentIntentId);
    if (pi.status !== 'succeeded') {
      throw new Error(`Payment not complete: ${pi.status}`);
    }

    const orderId = pi.metadata?.orderId;
    if (!orderId?.trim()) {
      throw new Error('PaymentIntent has no orderId in metadata');
    }
    if (expectedOrderId && orderId.trim() !== expectedOrderId.trim()) {
      throw new Error('PaymentIntent orderId does not match');
    }

    if (expectedTotalCents != null && pi.amount !== expectedTotalCents) {
      throw new Error(
        `Payment amount mismatch: expected ${expectedTotalCents} cents, got ${pi.amount ?? 'null'}`,
      );
    }

    return orderId.trim();
  }
}
