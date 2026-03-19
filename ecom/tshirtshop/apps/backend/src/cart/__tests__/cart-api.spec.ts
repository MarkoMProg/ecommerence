/**
 * Cart API (Controller) tests.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { CartController } from '../cart.controller';
import { CartService } from '../cart.service';
import type { CartWithItems } from '../cart.service';
import { OptionalAuthGuard } from '../../auth/guards/optional-auth.guard';

jest.mock('@thallesp/nestjs-better-auth', () => ({
  AllowAnonymous: () => () => {},
}));

const mockOptionalAuthGuard = { canActivate: jest.fn().mockReturnValue(true) };

const mockCart: CartWithItems = {
  id: 'cart-1',
  userId: null,
  items: [
    {
      id: 'item-1',
      productId: 'prod-1',
      slug: 'test-tee',
      quantity: 2,
      productName: 'Test Tee',
      priceCents: 2999,
      imageUrl: null,
      selectedOption: 'M',
      stockQuantity: 10,
    },
  ],
  itemCount: 2,
  totalCents: 5998,
};

describe('Cart API (Controller)', () => {
  let cartController: CartController;
  let cartService: CartService;

  beforeEach(async () => {
    const mockCartService = {
      getCartById: jest.fn().mockResolvedValue(mockCart),
      getOrCreateUserCart: jest.fn().mockResolvedValue(mockCart),
      getOrCreateCartAndAddItem: jest.fn().mockResolvedValue({
        cart: mockCart,
        created: false,
      }),
      mergeGuestCartIntoUser: jest.fn().mockResolvedValue(mockCart),
      addItem: jest.fn().mockResolvedValue(mockCart),
      removeItem: jest.fn().mockResolvedValue(mockCart),
      updateItemQuantity: jest.fn().mockResolvedValue(mockCart),
      getCartRecommendations: jest.fn().mockResolvedValue([]),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [CartController],
      providers: [
        {
          provide: CartService,
          useValue: mockCartService,
        },
      ],
    })
      .overrideGuard(OptionalAuthGuard)
      .useValue(mockOptionalAuthGuard)
      .compile();

    cartController = moduleFixture.get<CartController>(CartController);
    cartService = moduleFixture.get<CartService>(CartService);
  });

  describe('getCart', () => {
    it('returns cart for guest with X-Cart-Id', async () => {
      const req = { user: null } as any;
      const result = await cartController.getCart(req, 'cart-1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCart);
      expect(cartService.getCartById).toHaveBeenCalledWith('cart-1');
    });

    it('returns null when guest has no cart ID', async () => {
      const req = { user: null } as any;
      const result = await cartController.getCart(req, undefined);

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
      expect(result.message).toContain('No cart ID');
    });

    it('returns user cart when authenticated', async () => {
      const req = { user: { id: 'user-1' } } as any;
      const result = await cartController.getCart(req, undefined);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCart);
      expect(cartService.getOrCreateUserCart).toHaveBeenCalledWith('user-1');
    });
  });

  describe('addItem', () => {
    it('adds item for guest with valid body', async () => {
      const req = { user: null } as any;
      const result = await cartController.addItem(req, 'cart-1', {
        productId: 'prod-1',
        quantity: 1,
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCart);
      expect(cartService.getOrCreateCartAndAddItem).toHaveBeenCalledWith(
        'cart-1',
        'prod-1',
        1,
        null,
      );
    });

    it('throws BadRequestException when productId is missing', async () => {
      const req = { user: null } as any;
      await expect(
        cartController.addItem(req, 'cart-1', { quantity: 1 } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('adds item for authenticated user', async () => {
      const req = { user: { id: 'user-1' } } as any;
      const result = await cartController.addItem(req, undefined, {
        productId: 'prod-1',
        quantity: 2,
        selectedOption: 'L',
      });

      expect(result.success).toBe(true);
      expect(cartService.addItem).toHaveBeenCalledWith(
        mockCart.id,
        'prod-1',
        2,
        'L',
      );
    });
  });

  describe('removeItem', () => {
    it('removes item for guest with X-Cart-Id', async () => {
      const req = { user: null } as any;
      const result = await cartController.removeItem(req, 'cart-1', 'item-1');

      expect(result.success).toBe(true);
      expect(cartService.removeItem).toHaveBeenCalledWith('cart-1', 'item-1');
    });

    it('throws BadRequestException when guest has no cart ID', async () => {
      const req = { user: null } as any;
      await expect(
        cartController.removeItem(req, undefined, 'item-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateQuantity', () => {
    it('updates quantity for guest with X-Cart-Id', async () => {
      const req = { user: null } as any;
      const result = await cartController.updateQuantity(
        req,
        'cart-1',
        'item-1',
        { quantity: 5 },
      );

      expect(result.success).toBe(true);
      expect(cartService.updateItemQuantity).toHaveBeenCalledWith(
        'cart-1',
        'item-1',
        5,
      );
    });

    it('throws BadRequestException when quantity is invalid', async () => {
      const req = { user: null } as any;
      await expect(
        cartController.updateQuantity(req, 'cart-1', 'item-1', {
          quantity: -1,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getRecommendations', () => {
    it('returns recommendations when cart has items', async () => {
      const req = { user: null } as any;
      const mockRecs = [{ id: 'prod-2', name: 'Related Tee' }];
      (cartService.getCartRecommendations as jest.Mock).mockResolvedValue(
        mockRecs,
      );

      const result = await cartController.getRecommendations(
        req,
        'cart-1',
        '6',
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockRecs);
      expect(cartService.getCartRecommendations).toHaveBeenCalledWith(
        'cart-1',
        6,
      );
    });

    it('returns empty array when no cart', async () => {
      const req = { user: null } as any;
      (cartService.getCartById as jest.Mock).mockResolvedValue(null);

      const result = await cartController.getRecommendations(
        req,
        undefined,
        undefined,
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });
  });
});
