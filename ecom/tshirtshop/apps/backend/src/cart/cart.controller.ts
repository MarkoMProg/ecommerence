import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Headers,
  Param,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { CartService } from './cart.service';
import { validateAddCartItem, validateUpdateQuantity } from './dto/cart.dto';

@Controller('api/v1/cart')
@AllowAnonymous()
export class CartController {
  constructor(private readonly cartService: CartService) {}

  /** Get cart by ID. X-Cart-Id header required for guest carts. */
  @Get()
  async getCart(@Headers('x-cart-id') cartId?: string) {
    if (!cartId?.trim()) {
      return {
        success: true,
        data: null,
        message: 'No cart ID provided. Use X-Cart-Id header.',
      };
    }
    const cart = await this.cartService.getCartById(cartId.trim());
    if (!cart) {
      return {
        success: true,
        data: null,
        message: 'Cart not found or expired.',
      };
    }
    return {
      success: true,
      data: cart,
      message: 'Cart retrieved successfully',
    };
  }

  /** Add item to cart. Creates cart if X-Cart-Id missing or invalid. Returns cart with new X-Cart-Id if created. */
  @Post('items')
  @HttpCode(HttpStatus.OK)
  async addItem(
    @Headers('x-cart-id') cartIdHeader: string | undefined,
    @Body() body: { productId?: string; quantity?: number },
  ) {
    const errors = validateAddCartItem(body);
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

    const productId = (body.productId as string).trim();
    const quantity = body.quantity != null ? Math.max(1, Math.floor(body.quantity)) : 1;

    const { cart, created } = await this.cartService.getOrCreateCartAndAddItem(
      cartIdHeader?.trim(),
      productId,
      quantity,
    );

    const response: { success: boolean; data: typeof cart; message: string; cartId?: string } = {
      success: true,
      data: cart,
      message: 'Item added to cart',
    };
    if (created) {
      response.cartId = cart.id;
    }
    return response;
  }

  /** Remove item from cart by productId. X-Cart-Id header required. */
  @Delete('items/:productId')
  @HttpCode(HttpStatus.OK)
  async removeItem(
    @Headers('x-cart-id') cartId: string | undefined,
    @Param('productId') productId: string,
  ) {
    if (!cartId?.trim()) {
      throw new BadRequestException({
        success: false,
        error: { code: 'CART_ID_REQUIRED', message: 'X-Cart-Id header is required' },
      });
    }
    const cart = await this.cartService.removeItem(cartId.trim(), productId.trim());
    return {
      success: true,
      data: cart,
      message: 'Item removed from cart',
    };
  }

  /** Update item quantity. X-Cart-Id header required. Quantity 0 removes the item. */
  @Patch('items/:productId')
  @HttpCode(HttpStatus.OK)
  async updateQuantity(
    @Headers('x-cart-id') cartId: string | undefined,
    @Param('productId') productId: string,
    @Body() body: { quantity?: number },
  ) {
    if (!cartId?.trim()) {
      throw new BadRequestException({
        success: false,
        error: { code: 'CART_ID_REQUIRED', message: 'X-Cart-Id header is required' },
      });
    }
    const errors = validateUpdateQuantity(body);
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
    const quantity = body.quantity != null ? Math.max(0, Math.floor(body.quantity)) : 0;
    const cart = await this.cartService.updateItemQuantity(
      cartId.trim(),
      productId.trim(),
      quantity,
    );
    return {
      success: true,
      data: cart,
      message: quantity === 0 ? 'Item removed from cart' : 'Quantity updated',
    };
  }
}
