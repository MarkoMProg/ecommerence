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
} from '@nestjs/common';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { OptionalAuthGuard } from '../auth/guards/optional-auth.guard';
import { CheckoutService } from './checkout.service';
import { validateShippingAddress } from './dto/checkout.dto';
import { CartService } from '../cart/cart.service';
import { StripeService } from './stripe.service';
import { OrderService } from './order.service';

@Controller('api/v1/checkout')
@AllowAnonymous()
@UseGuards(OptionalAuthGuard)
export class CheckoutController {
  constructor(
    private readonly checkoutService: CheckoutService,
    private readonly cartService: CartService,
    private readonly stripeService: StripeService,
    private readonly orderService: OrderService,
  ) {}

  /**
   * Get order summary for cart (CHK-003). Uses user cart when authenticated.
   */
  @Get('summary')
  async getSummary(
    @Req() req: Request,
    @Headers('x-cart-id') cartIdHeader: string | undefined,
    @Query('coupon') couponCode: string | undefined,
  ) {
    const user = (req as any).user as { id: string } | null;
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
    const summary = await this.checkoutService.getOrderSummary(cartId, couponCode?.trim() || null);
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
    @Body() body: { shippingAddress?: unknown; couponCode?: string },
  ) {
    const user = (req as any).user as { id: string } | null;
    let cartId = cartIdHeader?.trim();
    if (user) {
      const userCart = await this.cartService.getOrCreateUserCart(user.id);
      cartId = userCart.id;
    }
    if (!cartId?.trim()) {
      throw new BadRequestException({
        success: false,
        error: { code: 'CART_ID_REQUIRED', message: 'X-Cart-Id header is required for guests' },
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
    );

    let checkoutUrl: string | null = null;
    if (this.stripeService.isConfigured() && order.status === 'pending') {
      checkoutUrl = await this.stripeService.createCheckoutSession(
        order.id,
        order.totalCents,
        'usd',
      );
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
          message: 'Only pending orders can be paid. Order status: ' + order.status,
        },
      });
    }
    if (!this.stripeService.isConfigured()) {
      throw new BadRequestException({
        success: false,
        error: { code: 'STRIPE_NOT_CONFIGURED', message: 'Payment is not available' },
      });
    }
    const checkoutUrl = await this.stripeService.createCheckoutSession(
      order.id,
      order.totalCents,
      'usd',
    );
    if (!checkoutUrl) {
      throw new BadRequestException({
        success: false,
        error: { code: 'STRIPE_NOT_CONFIGURED', message: 'Payment is not available' },
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
        error: { code: 'SESSION_ID_REQUIRED', message: 'session_id is required' },
      });
    }

    const existingOrder = orderId ? await this.orderService.getOrderById(orderId) : null;
    const expectedTotalCents = existingOrder?.totalCents;

    let verifiedOrderId: string;
    try {
      verifiedOrderId = await this.stripeService.verifySession(
        sessionId,
        orderId,
        expectedTotalCents,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Payment verification failed';
      let code = 'PAYMENT_VERIFICATION_FAILED';
      if (msg.includes('Payment not complete')) code = 'PAYMENT_NOT_COMPLETE';
      else if (msg.includes('Session has no orderId') || msg.includes('does not match'))
        code = 'INVALID_SESSION';
      else if (msg.includes('amount mismatch') || msg.includes('Payment amount'))
        code = 'AMOUNT_MISMATCH';
      else if (msg.includes('No such checkout.session')) code = 'SESSION_NOT_FOUND';
      throw new BadRequestException({
        success: false,
        error: { code, message: msg },
      });
    }

    const updated = await this.orderService.markOrderPaidIfPending(verifiedOrderId, {
      stripeSessionId: sessionId,
    });
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
