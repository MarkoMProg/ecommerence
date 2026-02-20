import {
  Controller,
  Get,
  Post,
  Body,
  Headers,
  Req,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { OptionalAuthGuard } from '../auth/guards/optional-auth.guard';
import { CheckoutService } from './checkout.service';
import { validateShippingAddress } from './dto/checkout.dto';
import { CartService } from '../cart/cart.service';

@Controller('api/v1/checkout')
@AllowAnonymous()
@UseGuards(OptionalAuthGuard)
export class CheckoutController {
  constructor(
    private readonly checkoutService: CheckoutService,
    private readonly cartService: CartService,
  ) {}

  /**
   * Get order summary for cart (CHK-003). Uses user cart when authenticated.
   */
  @Get('summary')
  async getSummary(
    @Req() req: Request,
    @Headers('x-cart-id') cartIdHeader: string | undefined,
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
    const summary = await this.checkoutService.getOrderSummary(cartId);
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
    @Body() body: { shippingAddress?: unknown },
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
    );

    return {
      success: true,
      data: order,
      message: 'Order created successfully. Payment integration coming soon.',
    };
  }
}
