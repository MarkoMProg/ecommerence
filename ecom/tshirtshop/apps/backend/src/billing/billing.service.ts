import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import Stripe from 'stripe';
import { DATABASE_CONNECTION } from '../database/database-connection';
import { user as userTable } from '../auth/schema';

/** Shape returned to clients — no raw card data, only Stripe-safe metadata. */
export interface PaymentMethodDto {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
  /** Funding type: credit, debit, prepaid, unknown */
  funding: string;
}

@Injectable()
export class BillingService {
  private readonly stripe: Stripe | null = null;
  private readonly uiUrl: string;

  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase,
    private readonly configService: ConfigService,
  ) {
    const key = configService.get<string>('STRIPE_SECRET_KEY')?.trim();
    this.uiUrl = configService.get<string>('UI_URL')?.trim() ?? 'http://localhost:3001';
    if (key?.startsWith('sk_')) {
      this.stripe = new Stripe(key);
    }
  }

  isConfigured(): boolean {
    return this.stripe !== null;
  }

  private requireStripe(): Stripe {
    if (!this.stripe) {
      throw new BadRequestException({
        success: false,
        error: { code: 'STRIPE_NOT_CONFIGURED', message: 'Payment is not available' },
      });
    }
    return this.stripe;
  }

  // ─── Customer management ────────────────────────────────────────────────────

  private async getStoredCustomerId(userId: string): Promise<string | null> {
    const [u] = await this.db
      .select({ stripeCustomerId: userTable.stripeCustomerId })
      .from(userTable)
      .where(eq(userTable.id, userId));
    return u?.stripeCustomerId ?? null;
  }

  /**
   * Idempotently get or create a Stripe Customer for the user.
   * Persists the customer ID to the DB on first creation.
   * Safe to call multiple times — never creates duplicates.
   */
  async getOrCreateCustomer(userId: string, email: string, name: string): Promise<string> {
    const stripe = this.requireStripe();
    const stored = await this.getStoredCustomerId(userId);

    if (stored) {
      // Verify it still exists in Stripe (handles deleted customer edge case)
      try {
        const customer = await stripe.customers.retrieve(stored);
        if (!customer.deleted) return stored;
      } catch {
        // Customer not found in Stripe — will create a new one below
      }
    }

    // Create new Stripe customer
    const customer = await stripe.customers.create({
      email,
      name: name || email,
      metadata: { userId },
    });

    // Persist customer ID to DB
    await this.db
      .update(userTable)
      .set({ stripeCustomerId: customer.id })
      .where(eq(userTable.id, userId));

    return customer.id;
  }

  // ─── Payment methods ─────────────────────────────────────────────────────

  /** List all card payment methods attached to the user's Stripe customer. */
  async listPaymentMethods(userId: string): Promise<PaymentMethodDto[]> {
    const stripe = this.requireStripe();
    const customerId = await this.getStoredCustomerId(userId);
    if (!customerId) return [];

    const [pmsResult, customerResult] = await Promise.all([
      stripe.paymentMethods.list({ customer: customerId, type: 'card', limit: 20 }),
      stripe.customers.retrieve(customerId),
    ]);

    const customer = customerResult as Stripe.Customer;
    const defaultPmId =
      typeof customer.invoice_settings?.default_payment_method === 'string'
        ? customer.invoice_settings.default_payment_method
        : null;

    return pmsResult.data.map((pm): PaymentMethodDto => ({
      id: pm.id,
      brand: pm.card?.brand ?? 'unknown',
      last4: pm.card?.last4 ?? '****',
      expMonth: pm.card?.exp_month ?? 0,
      expYear: pm.card?.exp_year ?? 0,
      funding: pm.card?.funding ?? 'unknown',
      isDefault: pm.id === defaultPmId,
    }));
  }

  /**
   * Create a Stripe Checkout Session in setup mode.
   * Redirects the user to Stripe's hosted page to securely add a card.
   * On success, Stripe auto-attaches the PM to the customer and redirects back.
   */
  async createSetupSession(userId: string, email: string, name: string): Promise<string> {
    const stripe = this.requireStripe();
    const customerId = await this.getOrCreateCustomer(userId, email, name);

    const session = await stripe.checkout.sessions.create({
      mode: 'setup',
      customer: customerId,
      payment_method_types: ['card'],
      success_url: `${this.uiUrl}/account?pm_added=1`,
      cancel_url: `${this.uiUrl}/account`,
    });

    if (!session.url) {
      throw new Error('Failed to create Stripe setup session — no URL returned');
    }
    return session.url;
  }

  /**
   * Detach a payment method from the user's customer.
   * Strict ownership check: verifies PM is attached to this user's customer.
   * If the detached PM was the default, Stripe clears it automatically.
   */
  async detachPaymentMethod(userId: string, pmId: string): Promise<void> {
    const stripe = this.requireStripe();
    const customerId = await this.getStoredCustomerId(userId);
    if (!customerId) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NO_CUSTOMER', message: 'No payment methods found' },
      });
    }

    // Ownership check — retrieve PM and verify it belongs to this customer
    let pm: Stripe.PaymentMethod;
    try {
      pm = await stripe.paymentMethods.retrieve(pmId);
    } catch {
      throw new NotFoundException({
        success: false,
        error: { code: 'PM_NOT_FOUND', message: 'Payment method not found' },
      });
    }

    if (pm.customer !== customerId) {
      throw new ForbiddenException({
        success: false,
        error: { code: 'PM_NOT_YOURS', message: 'Payment method does not belong to this account' },
      });
    }

    await stripe.paymentMethods.detach(pmId);
  }

  /**
   * Set a payment method as the default for the user's Stripe customer.
   * Strict ownership check before updating.
   */
  async setDefaultPaymentMethod(userId: string, pmId: string): Promise<void> {
    const stripe = this.requireStripe();
    const customerId = await this.getStoredCustomerId(userId);
    if (!customerId) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NO_CUSTOMER', message: 'No payment methods found' },
      });
    }

    // Ownership check
    let pm: Stripe.PaymentMethod;
    try {
      pm = await stripe.paymentMethods.retrieve(pmId);
    } catch {
      throw new NotFoundException({
        success: false,
        error: { code: 'PM_NOT_FOUND', message: 'Payment method not found' },
      });
    }

    if (pm.customer !== customerId) {
      throw new ForbiddenException({
        success: false,
        error: { code: 'PM_NOT_YOURS', message: 'Payment method does not belong to this account' },
      });
    }

    await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: pmId },
    });
  }

  /**
   * Return the user's stored Stripe customer ID (if any) for use by other services.
   * Does NOT create a customer — safe to call without side effects.
   */
  async getCustomerIdForUser(userId: string): Promise<string | null> {
    return this.getStoredCustomerId(userId);
  }
}
