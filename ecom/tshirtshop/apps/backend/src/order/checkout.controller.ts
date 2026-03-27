import {
  Controller,
  Get,
  Post,
  Body,
  Headers,
  Req,
  Query,
  Param,
  HttpCode,
  HttpStatus,
  BadRequestException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DATABASE_CONNECTION } from '../database/database-connection';
import { user as authUserTable } from '../auth/schema';
import { OptionalAuthGuard } from '../auth/guards/optional-auth.guard';
import { CheckoutService } from './checkout.service';
import { DeliveryService } from './delivery.service';
import { validateShippingAddress } from './dto/checkout.dto';
import { CartService } from '../cart/cart.service';
import { StripeService } from './stripe.service';
import { OrderService } from './order.service';
import { mapStripeError } from './stripe-error.util';

@Controller('api/v1/checkout')
@AllowAnonymous()
@UseGuards(OptionalAuthGuard)
export class CheckoutController {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase,
    private readonly checkoutService: CheckoutService,
    private readonly deliveryService: DeliveryService,
    private readonly cartService: CartService,
    private readonly stripeService: StripeService,
    private readonly orderService: OrderService,
  ) {}

  /**
   * Public: admin-configured free-shipping threshold and active delivery options (no cart required).
   */
  @Get('delivery')
  async getDelivery() {
    await this.deliveryService.ensureDefaults();
    const config = await this.deliveryService.getConfig();
    const options = await this.deliveryService.listActiveOptionsPublic();
    return {
      success: true,
      data: {
        freeShippingThresholdCents: config.freeShippingThresholdCents,
        options,
      },
      message: 'Delivery settings',
    };
  }

  /**
   * Get order summary for cart (CHK-003). Uses user cart when authenticated.
   */
  @Get('summary')
  async getSummary(
    @Req() req: Request,
    @Headers('x-cart-id') cartIdHeader: string | undefined,
    @Query('coupon') couponCode: string | undefined,
    @Query('deliveryOptionId') deliveryOptionId: string | undefined,
  ) {
    const user = req.user;
    let cartId = cartIdHeader?.trim();
    if (user) {
      const userCart = await this.cartService.getOrCreateUserCart(user.id);
      cartId = userCart.id;
    }
    if (!cartId) {
      return {
        success: true,
        data: null,
        message: 'No cart ID provided. Use X-Cart-Id header or log in.',
      };
    }
    const summary = await this.checkoutService.getOrderSummary(
      cartId,
      couponCode?.trim() || null,
      deliveryOptionId?.trim() || null,
    );
    return {
      success: true,
      data: summary,
      message: summary ? 'Summary retrieved' : 'Cart empty or not found',
    };
  }

  /**
   * Create order from cart. Requires X-Cart-Id (or session). Associates order with user when authenticated.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createOrder(
    @Req() req: Request,
    @Headers('x-cart-id') cartIdHeader: string | undefined,
    @Body()
    body: {
      shippingAddress?: unknown;
      couponCode?: string;
      deliveryOptionId?: string;
    },
  ) {
    const user = req.user;
    let cartId = cartIdHeader?.trim();
    if (user) {
      const userCart = await this.cartService.getOrCreateUserCart(user.id);
      cartId = userCart.id;
    }
    if (!cartId?.trim()) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'CART_ID_REQUIRED',
          message: 'X-Cart-Id header is required for guests',
        },
      });
    }

    const errors = validateShippingAddress(body?.shippingAddress);
    if (errors.length > 0) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: errors,
        },
      });
    }

    const shippingAddress = body.shippingAddress as Record<string, string>;
    const couponCode = body.couponCode?.trim() || null;
    const deliveryOptionId = body.deliveryOptionId?.trim() || null;
    const order = await this.checkoutService.createOrderFromCart(
      cartId.trim(),
      {
        fullName: shippingAddress.fullName?.trim(),
        line1: shippingAddress.line1?.trim(),
        line2: shippingAddress.line2?.trim(),
        city: shippingAddress.city?.trim(),
        stateOrProvince: shippingAddress.stateOrProvince?.trim(),
        postalCode: shippingAddress.postalCode?.trim(),
        country: shippingAddress.country?.trim(),
        phone: shippingAddress.phone?.trim(),
      },
      user?.id ?? null,
      couponCode,
      deliveryOptionId,
    );

    // Look up Stripe customer ID so saved payment methods appear at checkout (BILL-001)
    let stripeCustomerId: string | null = null;
    if (user) {
      const [u] = await this.db
        .select({ stripeCustomerId: authUserTable.stripeCustomerId })
        .from(authUserTable)
        .where(eq(authUserTable.id, user.id));
      stripeCustomerId = u?.stripeCustomerId ?? null;
    }

    let clientSecret: string | null = null;
    let customerSessionClientSecret: string | null = null;
    if (this.stripeService.isConfigured() && order.status === 'pending') {
      try {
        const pi = await this.stripeService.createPaymentIntent(
          order.id,
          order.totalCents,
          'usd',
          stripeCustomerId,
        );
        clientSecret = pi?.clientSecret ?? null;
        if (stripeCustomerId) {
          customerSessionClientSecret =
            await this.stripeService.createCustomerSession(stripeCustomerId);
        }
      } catch (err) {
        const mapped = mapStripeError(err);
        if (mapped) {
          throw new BadRequestException({
            success: false,
            error: { code: mapped.code, message: mapped.userMessage },
          });
        }
        const detail =
          err instanceof Error ? err.message : 'Stripe payment intent failed';
        throw new BadRequestException({
          success: false,
          error: {
            code: 'STRIPE_SESSION_FAILED',
            message: detail,
          },
        });
      }
    }

    return {
      success: true,
      data: { order, clientSecret, customerSessionClientSecret },
      message: clientSecret
        ? 'Order created. Complete payment with Stripe Elements.'
        : 'Order created successfully.',
    };
  }

  /**
   * Notify that user returned from Stripe without completing payment (cancel_url).
   * Enqueues payment.failed job to send email to registered users.
   * Call when landing on /checkout?canceled=1&orderId=xxx.
   */
  @Post('payment-canceled')
  @HttpCode(HttpStatus.OK)
  async paymentCanceled(@Body() body: { orderId?: string }) {
    const orderId = body?.orderId?.trim();
    if (!orderId) {
      return { success: true, message: 'No orderId provided' };
    }
    await this.orderService.enqueuePaymentFailedNotification(orderId);
    return { success: true, message: 'Notified' };
  }

  /**
   * Create Stripe PaymentIntent for an existing pending order.
   * Used when user wants to complete payment on a pending order.
   */
  @Post(':orderId/payment-session')
  @HttpCode(HttpStatus.OK)
  async getPaymentSessionForOrder(@Param('orderId') orderId: string) {
    const id = orderId?.trim();
    if (!id) {
      throw new BadRequestException({
        success: false,
        error: { code: 'ORDER_ID_REQUIRED', message: 'orderId is required' },
      });
    }
    const order = await this.orderService.getOrderById(id);
    if (!order) {
      throw new NotFoundException({
        success: false,
        error: { code: 'ORDER_NOT_FOUND', message: 'Order not found' },
      });
    }
    if (order.status !== 'pending') {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'ORDER_NOT_PENDING',
          message:
            'Only pending orders can be paid. Order status: ' + order.status,
        },
      });
    }
    if (!this.stripeService.isConfigured()) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'STRIPE_NOT_CONFIGURED',
          message: 'Payment is not available',
        },
      });
    }
    // Look up Stripe customer for this order's user if available
    let orderCustomerId: string | null = null;
    if (order.userId) {
      const [u] = await this.db
        .select({ stripeCustomerId: authUserTable.stripeCustomerId })
        .from(authUserTable)
        .where(eq(authUserTable.id, order.userId));
      orderCustomerId = u?.stripeCustomerId ?? null;
    }

    let pi: { clientSecret: string; paymentIntentId: string } | null;
    let customerSessionClientSecret: string | null = null;
    try {
      pi = await this.stripeService.createPaymentIntent(
        order.id,
        order.totalCents,
        'usd',
        orderCustomerId,
      );
      if (orderCustomerId) {
        customerSessionClientSecret =
          await this.stripeService.createCustomerSession(orderCustomerId);
      }
    } catch (err) {
      const mapped = mapStripeError(err);
      if (mapped) {
        throw new BadRequestException({
          success: false,
          error: { code: mapped.code, message: mapped.userMessage },
        });
      }
      throw err;
    }
    if (!pi) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'STRIPE_NOT_CONFIGURED',
          message: 'Payment is not available',
        },
      });
    }
    return {
      success: true,
      data: { clientSecret: pi.clientSecret, customerSessionClientSecret },
      message: 'Payment session created',
    };
  }

  /**
   * Verify Stripe payment and mark order as paid (PAY-001).
   * Call after Stripe Elements confirms payment with payment_intent.
   */
  @Post('verify-payment')
  @HttpCode(HttpStatus.OK)
  async verifyPayment(
    @Body() body: { payment_intent?: string; session_id?: string; orderId?: string },
  ) {
    const paymentIntentId = body.payment_intent?.trim() || body.session_id?.trim();
    const orderId = body.orderId?.trim();
    if (!paymentIntentId) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'SESSION_ID_REQUIRED',
          message: 'payment_intent is required',
        },
      });
    }

    const existingOrder = orderId
      ? await this.orderService.getOrderById(orderId)
      : null;
    const expectedTotalCents = existingOrder?.totalCents;

    let verifiedOrderId: string;
    try {
      verifiedOrderId = await this.stripeService.verifyPaymentIntent(
        paymentIntentId,
        orderId,
        expectedTotalCents,
      );
    } catch (err) {
      const mapped = mapStripeError(err);
      if (mapped) {
        throw new BadRequestException({
          success: false,
          error: { code: mapped.code, message: mapped.userMessage },
        });
      }
      const msg =
        err instanceof Error ? err.message : 'Payment verification failed';
      let code = 'PAYMENT_VERIFICATION_FAILED';
      if (msg.includes('Payment not complete')) code = 'PAYMENT_NOT_COMPLETE';
      else if (
        msg.includes('has no orderId') ||
        msg.includes('does not match')
      )
        code = 'INVALID_SESSION';
      else if (
        msg.includes('amount mismatch') ||
        msg.includes('Payment amount')
      )
        code = 'AMOUNT_MISMATCH';
      else if (msg.includes('No such payment_intent'))
        code = 'SESSION_NOT_FOUND';
      throw new BadRequestException({
        success: false,
        error: { code, message: msg },
      });
    }

    const updated = await this.orderService.markOrderPaidIfPending(
      verifiedOrderId,
      {
        stripeSessionId: paymentIntentId,
      },
    );
    if (!updated) {
      throw new BadRequestException({
        success: false,
        error: { code: 'ORDER_NOT_FOUND', message: 'Order not found' },
      });
    }

    let message = 'Payment verified.';
    if (updated.status === 'paid') {
      message = 'Payment verified. Order marked as paid.';
    } else if (updated.status === 'oversold') {
      message =
        'Payment received but inventory could not be allocated. Your order is on hold for review; a refund will be processed automatically when possible.';
    } else if (updated.status === 'refunded') {
      message =
        'Payment could not be fulfilled due to inventory. Your payment has been refunded.';
    }

    return {
      success: true,
      data: updated,
      message,
    };
  }
}
