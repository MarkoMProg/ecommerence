import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Headers,
  Param,
  Query,
  Req,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { OptionalAuthGuard } from '../auth/guards/optional-auth.guard';
import { CartService } from './cart.service';
import { validateAddCartItem, validateUpdateQuantity } from './dto/cart.dto';

@Controller('api/v1/cart')
@AllowAnonymous()
@UseGuards(OptionalAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  /** Get product recommendations based on cart items (CART-REC). Same auth as getCart. */
  @Get('recommendations')
  async getRecommendations(
    @Req() req: Request,
    @Headers('x-cart-id') cartIdHeader?: string,
    @Query('limit') limitParam?: string,
  ) {
    const user = req.user;
    const guestCartId = cartIdHeader?.trim();
    const limit = limitParam
      ? Math.min(12, Math.max(1, parseInt(limitParam, 10) || 6))
      : 6;

    let cartId: string | null = null;
    if (user) {
      const userCart = await this.cartService.getOrCreateUserCart(user.id);
      cartId = userCart.id;
    } else if (guestCartId) {
      const cart = await this.cartService.getCartById(guestCartId);
      if (cart) cartId = cart.id;
    }

    if (!cartId) {
      return {
        success: true,
        data: [],
        message: 'No cart. Add items to see recommendations.',
      };
    }

    const recommendations = await this.cartService.getCartRecommendations(
      cartId,
      limit,
    );
    return {
      success: true,
      data: recommendations,
      message: 'Recommendations retrieved successfully',
    };
  }

  /** Get cart. Uses user cart when authenticated; merges guest cart on first request after login. */
  @Get()
  async getCart(
    @Req() req: Request,
    @Headers('x-cart-id') cartIdHeader?: string,
  ) {
    const user = req.user;
    const guestCartId = cartIdHeader?.trim();

    if (user) {
      let merged = false;
      let cart;
      if (guestCartId) {
        const guestCart = await this.cartService.getCartById(guestCartId);
        if (guestCart && !guestCart.userId) {
          cart = await this.cartService.mergeGuestCartIntoUser(
            guestCartId,
            user.id,
          );
          merged = true;
        } else {
          cart = await this.cartService.getOrCreateUserCart(user.id);
        }
      } else {
        cart = await this.cartService.getOrCreateUserCart(user.id);
      }
      return {
        success: true,
        data: cart,
        message: 'Cart retrieved successfully',
        merged,
      };
    }

    if (!guestCartId) {
      return {
        success: true,
        data: null,
        message: 'No cart ID provided. Use X-Cart-Id header.',
      };
    }
    const cart = await this.cartService.getCartById(guestCartId);
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

  /** Add item to cart. Uses user cart when authenticated; merges guest cart if present. */
  @Post('items')
  @HttpCode(HttpStatus.OK)
  async addItem(
    @Req() req: Request,
    @Headers('x-cart-id') cartIdHeader: string | undefined,
    @Body()
    body: { productId?: string; quantity?: number; selectedOption?: string },
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
    const quantity =
      body.quantity != null ? Math.max(1, Math.floor(body.quantity)) : 1;
    const selectedOption =
      typeof body.selectedOption === 'string' && body.selectedOption.trim()
        ? body.selectedOption.trim()
        : null;
    const user = req.user;
    const guestCartId = cartIdHeader?.trim();

    let cart;
    let created = false;

    if (user) {
      let userCart = await this.cartService.getOrCreateUserCart(user.id);
      if (guestCartId) {
        const guestCart = await this.cartService.getCartById(guestCartId);
        if (guestCart && !guestCart.userId) {
          userCart = await this.cartService.mergeGuestCartIntoUser(
            guestCartId,
            user.id,
          );
        }
      }
      cart = await this.cartService.addItem(
        userCart.id,
        productId,
        quantity,
        selectedOption,
      );
    } else {
      const result = await this.cartService.getOrCreateCartAndAddItem(
        guestCartId,
        productId,
        quantity,
        selectedOption,
      );
      cart = result.cart;
      created = result.created;
    }

    const response: {
      success: boolean;
      data: typeof cart;
      message: string;
      cartId?: string;
    } = {
      success: true,
      data: cart,
      message: 'Item added to cart',
    };
    if (created) {
      response.cartId = cart.id;
    }
    return response;
  }

  /** Remove item from cart by cart item ID. X-Cart-Id required for guests; session for auth. */
  @Delete('items/:itemId')
  @HttpCode(HttpStatus.OK)
  async removeItem(
    @Req() req: Request,
    @Headers('x-cart-id') cartIdHeader: string | undefined,
    @Param('itemId') itemId: string,
  ) {
    const user = req.user;
    let cartId = cartIdHeader?.trim();
    if (user) {
      const userCart = await this.cartService.getOrCreateUserCart(user.id);
      cartId = userCart.id;
    }
    if (!cartId) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'CART_ID_REQUIRED',
          message: 'X-Cart-Id header is required for guests',
        },
      });
    }
    const cart = await this.cartService.removeItem(cartId, itemId.trim());
    return {
      success: true,
      data: cart,
      message: 'Item removed from cart',
    };
  }

  /** Update item quantity by cart item ID. X-Cart-Id required for guests; session for auth. Quantity 0 removes. */
  @Patch('items/:itemId')
  @HttpCode(HttpStatus.OK)
  async updateQuantity(
    @Req() req: Request,
    @Headers('x-cart-id') cartIdHeader: string | undefined,
    @Param('itemId') itemId: string,
    @Body() body: { quantity?: number },
  ) {
    const user = req.user;
    let cartId = cartIdHeader?.trim();
    if (user) {
      const userCart = await this.cartService.getOrCreateUserCart(user.id);
      cartId = userCart.id;
    }
    if (!cartId) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'CART_ID_REQUIRED',
          message: 'X-Cart-Id header is required for guests',
        },
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
    const quantity =
      body.quantity != null ? Math.max(0, Math.floor(body.quantity)) : 0;
    const cart = await this.cartService.updateItemQuantity(
      cartId,
      itemId.trim(),
      quantity,
    );
    return {
      success: true,
      data: cart,
      message: quantity === 0 ? 'Item removed from cart' : 'Quantity updated',
    };
  }
}
