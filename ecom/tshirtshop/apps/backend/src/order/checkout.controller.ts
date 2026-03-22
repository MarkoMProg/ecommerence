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

    let checkoutUrl: string | null = null;
    if (this.stripeService.isConfigured() && order.status === 'pending') {
      try {
        checkoutUrl = await this.stripeService.createCheckoutSession(
          order.id,
          order.totalCents,
          'usd',
          stripeCustomerId,
        );
      } catch (err) {
        const mapped = mapStripeError(err);
        if (mapped) {
          throw new BadRequestException({
            success: false,
            error: { code: mapped.code, message: mapped.userMessage },
          });
        }
        const detail =
          err instanceof Error ? err.message : 'Stripe Checkout session failed';
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
      data: { order, checkoutUrl },
      message: checkoutUrl
        ? 'Order created. Redirect to Stripe Checkout.'
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
   * Create Stripe Checkout URL for an existing pending order.
   * Used when user returns from Stripe without paying and wants to complete payment.
   */
  @Post(':orderId/payment-url')
  @HttpCode(HttpStatus.OK)
  async getPaymentUrlForOrder(@Param('orderId') orderId: string) {
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

    let checkoutUrl: string | null;
    try {
      checkoutUrl = await this.stripeService.createCheckoutSession(
        order.id,
        order.totalCents,
        'usd',
        orderCustomerId,
      );
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
    if (!checkoutUrl) {
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
      data: { checkoutUrl },
      message: 'Checkout URL created',
    };
  }

  /**
   * Verify Stripe payment and mark order as paid (PAY-001).
   * Call after user returns from Stripe Checkout with session_id.
   */
  @Post('verify-payment')
  @HttpCode(HttpStatus.OK)
  async verifyPayment(@Body() body: { session_id?: string; orderId?: string }) {
    const sessionId = body.session_id?.trim();
    const orderId = body.orderId?.trim();
    if (!sessionId) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'SESSION_ID_REQUIRED',
          message: 'session_id is required',
        },
      });
    }

    const existingOrder = orderId
      ? await this.orderService.getOrderById(orderId)
      : null;
    const expectedTotalCents = existingOrder?.totalCents;

    let verifiedOrderId: string;
    try {
      verifiedOrderId = await this.stripeService.verifySession(
        sessionId,
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
        msg.includes('Session has no orderId') ||
        msg.includes('does not match')
      )
        code = 'INVALID_SESSION';
      else if (
        msg.includes('amount mismatch') ||
        msg.includes('Payment amount')
      )
        code = 'AMOUNT_MISMATCH';
      else if (msg.includes('No such checkout.session'))
        code = 'SESSION_NOT_FOUND';
      throw new BadRequestException({
        success: false,
        error: { code, message: msg },
      });
    }

    const updated = await this.orderService.markOrderPaidIfPending(
      verifiedOrderId,
      {
        stripeSessionId: sessionId,
      },
    );
    if (!updated) {
      throw new BadRequestException({
        success: false,
        error: { code: 'ORDER_NOT_FOUND', message: 'Order not found' },
      });
    }

    return {
      success: true,
      data: updated,
      message: 'Payment verified. Order marked as paid.',
    };
  }
}
