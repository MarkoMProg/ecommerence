import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

/**
 * Stripe Checkout integration (PAY-001).
 * Only active when STRIPE_SECRET_KEY is set.
 */
@Injectable()
export class StripeService {
  private readonly stripe: Stripe | null = null;
  private readonly uiUrl: string;

  constructor(private readonly configService: ConfigService) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY')?.trim();
    this.uiUrl = this.configService.get<string>('UI_URL')?.trim() ?? 'http://localhost:3001';
    if (secretKey?.startsWith('sk_')) {
      this.stripe = new Stripe(secretKey);
    }
  }

  isConfigured(): boolean {
    return this.stripe !== null;
  }

  /**
   * Create Stripe Checkout Session for an order.
   * Returns checkout URL or null if Stripe not configured.
   */
  async createCheckoutSession(
    orderId: string,
    totalCents: number,
    currency: string = 'usd',
  ): Promise<string | null> {
    if (!this.stripe) return null;

    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency,
            unit_amount: totalCents,
            product_data: {
              name: `Order ${orderId}`,
              description: 'T-shirt shop order',
            },
          },
          quantity: 1,
        },
      ],
      metadata: { orderId },
      success_url: `${this.uiUrl}/checkout/confirmation?orderId=${orderId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${this.uiUrl}/checkout`,
    });

    return session.url;
  }

  /**
   * Handle Stripe webhook event (PAY-002). Verifies signature and processes checkout.session.completed.
   * Returns orderId if payment completed, null for other events.
   */
  handleWebhookEvent(rawBody: Buffer, signature: string): string | null {
    if (!this.stripe) return null;

    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET')?.trim();
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is required for webhook verification');
    }

    const event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.payment_status === 'paid' && session.metadata?.orderId) {
        return session.metadata.orderId.trim();
      }
    }

    return null;
  }

  /**
   * Verify Stripe session and return orderId if payment is complete (PAY-002: amount validation).
   * Throws if session not found, not paid, metadata.orderId mismatch, or amount mismatch.
   */
  async verifySession(
    sessionId: string,
    expectedOrderId?: string,
    expectedTotalCents?: number,
  ): Promise<string> {
    if (!this.stripe) {
      throw new Error('Stripe is not configured');
    }

    const session = await this.stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== 'paid') {
      throw new Error(`Payment not complete: ${session.payment_status}`);
    }

    const orderId = session.metadata?.orderId;
    if (!orderId?.trim()) {
      throw new Error('Session has no orderId in metadata');
    }
    if (expectedOrderId && orderId.trim() !== expectedOrderId.trim()) {
      throw new Error('Session orderId does not match');
    }

    if (expectedTotalCents != null && session.amount_total !== expectedTotalCents) {
      throw new Error(
        `Payment amount mismatch: expected ${expectedTotalCents} cents, got ${session.amount_total ?? 'null'}`,
      );
    }

    return orderId.trim();
  }
}
