/**
 * Cart DTO validation tests.
 */
import { validateAddCartItem, validateUpdateQuantity } from '../dto/cart.dto';

describe('Cart DTO Validators', () => {
  describe('validateAddCartItem', () => {
    it('returns no errors for valid input', () => {
      const errors = validateAddCartItem({
        productId: 'prod-1',
      });
      expect(errors).toHaveLength(0);
    });

    it('accepts valid quantity and selectedOption', () => {
      const errors = validateAddCartItem({
        productId: 'prod-1',
        quantity: 2,
        selectedOption: 'M',
      });
      expect(errors).toHaveLength(0);
    });

    it('errors on missing productId', () => {
      const errors = validateAddCartItem({});
      expect(errors.some((e) => e.field === 'productId')).toBe(true);
    });

    it('errors on empty productId', () => {
      const errors = validateAddCartItem({ productId: '   ' });
      expect(errors.some((e) => e.field === 'productId')).toBe(true);
    });

    it('errors on quantity less than 1', () => {
      const errors = validateAddCartItem({
        productId: 'prod-1',
        quantity: 0,
      });
      expect(errors.some((e) => e.field === 'quantity')).toBe(true);
    });

    it('errors on non-integer quantity', () => {
      const errors = validateAddCartItem({
        productId: 'prod-1',
        quantity: 1.5,
      });
      expect(errors.some((e) => e.field === 'quantity')).toBe(true);
    });

    it('errors on quantity exceeding MAX_CART_ITEM_QUANTITY', () => {
      const errors = validateAddCartItem({
        productId: 'prod-1',
        quantity: 100,
      });
      expect(errors.some((e) => e.field === 'quantity')).toBe(true);
    });

    it('errors on selectedOption exceeding 50 characters', () => {
      const errors = validateAddCartItem({
        productId: 'prod-1',
        selectedOption: 'x'.repeat(51),
      });
      expect(errors.some((e) => e.field === 'selectedOption')).toBe(true);
    });
  });

  describe('validateUpdateQuantity', () => {
    it('returns no errors for valid quantity', () => {
      const errors = validateUpdateQuantity({ quantity: 3 });
      expect(errors).toHaveLength(0);
    });

    it('accepts quantity 0 (removes item)', () => {
      const errors = validateUpdateQuantity({ quantity: 0 });
      expect(errors).toHaveLength(0);
    });

    it('errors on missing quantity', () => {
      const errors = validateUpdateQuantity({});
      expect(errors.some((e) => e.field === 'quantity')).toBe(true);
    });

    it('errors on negative quantity', () => {
      const errors = validateUpdateQuantity({ quantity: -1 });
      expect(errors.some((e) => e.field === 'quantity')).toBe(true);
    });

    it('errors on non-integer quantity', () => {
      const errors = validateUpdateQuantity({ quantity: 2.5 });
      expect(errors.some((e) => e.field === 'quantity')).toBe(true);
    });

    it('errors on quantity exceeding MAX_CART_ITEM_QUANTITY', () => {
      const errors = validateUpdateQuantity({ quantity: 100 });
      expect(errors.some((e) => e.field === 'quantity')).toBe(true);
    });
  });
});
