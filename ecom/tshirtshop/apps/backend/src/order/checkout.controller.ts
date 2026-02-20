import {
  Controller,
  Get,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { CheckoutService } from './checkout.service';
import { validateShippingAddress } from './dto/checkout.dto';

@Controller('api/v1/checkout')
@AllowAnonymous()
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  /**
   * Get order summary for cart (CHK-003). Returns subtotal, shipping, total.
   * X-Cart-Id header required.
   */
  @Get('summary')
  async getSummary(@Headers('x-cart-id') cartId: string | undefined) {
    if (!cartId?.trim()) {
      return {
        success: true,
        data: null,
        message: 'No cart ID provided. Use X-Cart-Id header.',
      };
    }
    const summary = await this.checkoutService.getOrderSummary(cartId.trim());
    return {
      success: true,
      data: summary,
      message: summary ? 'Summary retrieved' : 'Cart empty or not found',
    };
  }

  /**
   * Create order from cart. Requires X-Cart-Id header and shipping address in body.
   * Returns created order (status: pending). Payment integration (PAY-001) to follow.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createOrder(
    @Headers('x-cart-id') cartId: string | undefined,
    @Body() body: { shippingAddress?: unknown },
  ) {
    if (!cartId?.trim()) {
      throw new BadRequestException({
        success: false,
        error: { code: 'CART_ID_REQUIRED', message: 'X-Cart-Id header is required' },
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
      null, // TODO: get userId from session when authenticated
    );

    return {
      success: true,
      data: order,
      message: 'Order created successfully. Payment integration coming soon.',
    };
  }
}
