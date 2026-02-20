import {
  validateCreateProduct,
  validateUpdateProduct,
} from '../dto/catalog.dto';

describe('Catalog DTO Validators', () => {
  const validCreateBody = {
    name: 'Test Product',
    description: 'A test product',
    priceCents: 2999,
    categoryId: 'cat-1',
    brand: 'TestBrand',
  };

  describe('validateCreateProduct', () => {
    it('should return no errors for valid input', () => {
      const errors = validateCreateProduct(validCreateBody);
      expect(errors).toHaveLength(0);
    });

    it('should error on missing name', () => {
      const errors = validateCreateProduct({
        ...validCreateBody,
        name: undefined,
      });
      expect(errors.some((e) => e.field === 'name')).toBe(true);
    });

    it('should error on empty name', () => {
      const errors = validateCreateProduct({
        ...validCreateBody,
        name: '   ',
      });
      expect(errors.some((e) => e.field === 'name')).toBe(true);
    });

    it('should error on name exceeding 255 characters', () => {
      const errors = validateCreateProduct({
        ...validCreateBody,
        name: 'x'.repeat(256),
      });
      expect(errors.some((e) => e.field === 'name')).toBe(true);
    });

    it('should error on missing description', () => {
      const errors = validateCreateProduct({
        ...validCreateBody,
        description: undefined,
      });
      expect(errors.some((e) => e.field === 'description')).toBe(true);
    });

    it('should error on missing priceCents', () => {
      const errors = validateCreateProduct({
        ...validCreateBody,
        priceCents: undefined,
      });
      expect(errors.some((e) => e.field === 'priceCents')).toBe(true);
    });

    it('should error on negative priceCents', () => {
      const errors = validateCreateProduct({
        ...validCreateBody,
        priceCents: -100,
      });
      expect(errors.some((e) => e.field === 'priceCents')).toBe(true);
    });

    it('should error on invalid priceCents type', () => {
      const errors = validateCreateProduct({
        ...validCreateBody,
        priceCents: '99' as unknown as number,
      });
      expect(errors.some((e) => e.field === 'priceCents')).toBe(true);
    });

    it('should error on missing categoryId', () => {
      const errors = validateCreateProduct({
        ...validCreateBody,
        categoryId: undefined,
      });
      expect(errors.some((e) => e.field === 'categoryId')).toBe(true);
    });

    it('should error on empty categoryId', () => {
      const errors = validateCreateProduct({
        ...validCreateBody,
        categoryId: '   ',
      });
      expect(errors.some((e) => e.field === 'categoryId')).toBe(true);
    });

    it('should error on missing brand', () => {
      const errors = validateCreateProduct({
        ...validCreateBody,
        brand: undefined,
      });
      expect(errors.some((e) => e.field === 'brand')).toBe(true);
    });

    it('should error on negative stockQuantity', () => {
      const errors = validateCreateProduct({
        ...validCreateBody,
        stockQuantity: -1,
      });
      expect(errors.some((e) => e.field === 'stockQuantity')).toBe(true);
    });

    it('should error on invalid imageUrls (not array)', () => {
      const errors = validateCreateProduct({
        ...validCreateBody,
        imageUrls: 'not-array' as unknown as string[],
      });
      expect(errors.some((e) => e.field === 'imageUrls')).toBe(true);
    });

    it('should error on imageUrls with non-string elements', () => {
      const errors = validateCreateProduct({
        ...validCreateBody,
        imageUrls: ['url1', 123 as unknown as string],
      });
      expect(errors.some((e) => e.field === 'imageUrls')).toBe(true);
    });

    it('should accept valid optional fields', () => {
      const errors = validateCreateProduct({
        ...validCreateBody,
        stockQuantity: 10,
        imageUrls: ['https://example.com/img.png'],
      });
      expect(errors).toHaveLength(0);
    });
  });

  describe('validateUpdateProduct', () => {
    it('should return no errors for empty body (all optional)', () => {
      const errors = validateUpdateProduct({});
      expect(errors).toHaveLength(0);
    });

    it('should error on empty name when name provided', () => {
      const errors = validateUpdateProduct({ name: '   ' });
      expect(errors.some((e) => e.field === 'name')).toBe(true);
    });

    it('should error on name exceeding 255 characters', () => {
      const errors = validateUpdateProduct({ name: 'x'.repeat(256) });
      expect(errors.some((e) => e.field === 'name')).toBe(true);
    });

    it('should error on invalid description type', () => {
      const errors = validateUpdateProduct({
        description: 123 as unknown as string,
      });
      expect(errors.some((e) => e.field === 'description')).toBe(true);
    });

    it('should error on negative priceCents', () => {
      const errors = validateUpdateProduct({ priceCents: -1 });
      expect(errors.some((e) => e.field === 'priceCents')).toBe(true);
    });

    it('should error on negative stockQuantity', () => {
      const errors = validateUpdateProduct({ stockQuantity: -5 });
      expect(errors.some((e) => e.field === 'stockQuantity')).toBe(true);
    });

    it('should error on empty categoryId when provided', () => {
      const errors = validateUpdateProduct({ categoryId: '   ' });
      expect(errors.some((e) => e.field === 'categoryId')).toBe(true);
    });

    it('should error on empty brand when provided', () => {
      const errors = validateUpdateProduct({ brand: '   ' });
      expect(errors.some((e) => e.field === 'brand')).toBe(true);
    });

    it('should accept valid partial updates', () => {
      const errors = validateUpdateProduct({
        name: 'Updated Name',
        priceCents: 3999,
      });
      expect(errors).toHaveLength(0);
    });
  });
});
