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
   * Verify Stripe session and return orderId if payment is complete.
   * Throws if session not found, not paid, or metadata.orderId mismatch.
   */
  async verifySession(sessionId: string, expectedOrderId?: string): Promise<string> {
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

    return orderId.trim();
  }
}
