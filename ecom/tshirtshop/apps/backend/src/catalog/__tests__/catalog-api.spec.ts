import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ProductsController } from '../products.controller';
import { CategoriesController } from '../categories.controller';
import { CatalogService } from '../catalog.service';
import { BetterAuthGuard } from '../../auth/guards/jwt-auth.guard';

jest.mock('@thallesp/nestjs-better-auth', () => ({
  AllowAnonymous: () => () => {},
}));

const mockBetterAuthGuard = { canActivate: jest.fn().mockReturnValue(true) };

describe('Catalog API (Controller Integration)', () => {
  let productsController: ProductsController;
  let categoriesController: CategoriesController;
  let catalogService: CatalogService;

  const mockProduct = {
    id: 'prod-1',
    name: 'Test Tee',
    description: 'A test',
    priceCents: 2999,
    stockQuantity: 10,
    categoryId: 'cat-1',
    brand: 'TestBrand',
    images: [{ id: 'img-1', productId: 'prod-1', imageUrl: 'https://example.com/1.jpg', altText: null, isPrimary: true }],
    category: { id: 'cat-1', name: 'T-Shirts', slug: 't-shirts' },
  };

  const mockCategory = { id: 'cat-1', name: 'T-Shirts', slug: 't-shirts', parentCategoryId: null, createdAt: new Date() };

  beforeEach(async () => {
    const mockCatalogService = {
      listProducts: jest.fn().mockResolvedValue({
        data: [mockProduct],
        pagination: { page: 1, limit: 20, total: 1 },
      }),
      getProductById: jest.fn().mockResolvedValue(mockProduct),
      listCategories: jest.fn().mockResolvedValue([mockCategory]),
      getCategoryById: jest.fn().mockResolvedValue(mockCategory),
      getDistinctBrands: jest.fn().mockResolvedValue(['TestBrand']),
      getSearchSuggestions: jest.fn().mockResolvedValue({
        products: ['Test Tee'],
        categories: [{ name: 'T-Shirts', slug: 't-shirts' }],
        brands: ['TestBrand'],
      }),
      createProduct: jest.fn().mockResolvedValue(mockProduct),
      updateProduct: jest.fn().mockResolvedValue(mockProduct),
      deleteProduct: jest.fn().mockResolvedValue(true),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController, CategoriesController],
      providers: [
        {
          provide: CatalogService,
          useValue: mockCatalogService,
        },
      ],
    })
      .overrideGuard(BetterAuthGuard)
      .useValue(mockBetterAuthGuard)
      .compile();

    productsController = moduleFixture.get<ProductsController>(ProductsController);
    categoriesController = moduleFixture.get<CategoriesController>(CategoriesController);
    catalogService = moduleFixture.get<CatalogService>(CatalogService);
  });

  describe('ProductsController.list', () => {
    it('should return products with pagination shape', async () => {
      const result = await productsController.list();

      expect(result.success).toBe(true);
      expect(result.data).toBeInstanceOf(Array);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('Test Tee');
      expect(result.pagination).toEqual({ page: 1, limit: 20, total: 1 });
    });

    it('should pass query params to listProducts', async () => {
      await productsController.list(
        '1',
        '10',
        't-shirts',
        'dragon',
        'TestBrand',
        '10',
        '50',
        'price-asc',
      );

      expect(catalogService.listProducts).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 't-shirts',
          q: 'dragon',
          brand: 'TestBrand',
          minPrice: 10,
          maxPrice: 50,
          sort: 'price-asc',
        }),
      );
    });
  });

  describe('ProductsController.getSuggestions', () => {
    it('should return search suggestions shape', async () => {
      const result = await productsController.getSuggestions('drag', '10');

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('products');
      expect(result.data).toHaveProperty('categories');
      expect(result.data).toHaveProperty('brands');
    });
  });

  describe('ProductsController.getBrands', () => {
    it('should return distinct brands', async () => {
      const result = await productsController.getBrands();
      expect(result.success).toBe(true);
      expect(result.data).toEqual(['TestBrand']);
    });
  });

  describe('ProductsController.getById', () => {
    it('should return product when found', async () => {
      const result = await productsController.getById('prod-1');
      expect(result.success).toBe(true);
      expect(result.data!.id).toBe('prod-1');
      expect(result.data!.name).toBe('Test Tee');
    });

    it('should throw NotFoundException when product not found', async () => {
      (catalogService.getProductById as jest.Mock).mockResolvedValueOnce(null);
      await expect(productsController.getById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('CategoriesController.list', () => {
    it('should return categories', async () => {
      const result = await categoriesController.list();
      expect(result.success).toBe(true);
      expect(result.data).toBeInstanceOf(Array);
      expect(result.data[0].slug).toBe('t-shirts');
    });
  });

  describe('CategoriesController.getById', () => {
    it('should return category when found', async () => {
      const result = await categoriesController.getById('cat-1');
      expect(result.success).toBe(true);
      expect(result.data!.slug).toBe('t-shirts');
    });

    it('should throw NotFoundException when category not found', async () => {
      (catalogService.getCategoryById as jest.Mock).mockResolvedValueOnce(null);
      await expect(categoriesController.getById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── ProductsController.create ────────────────────────────────────────────

  describe('ProductsController.create', () => {
    const validBody = {
      name: 'New Tee',
      description: 'A brand new tee shirt with cool design',
      priceCents: 3500,
      stockQuantity: 20,
      categoryId: 'cat-1',
      brand: 'Darkloom',
    };

    beforeEach(() => {
      (catalogService.createProduct as jest.Mock).mockResolvedValue({
        ...mockProduct,
        id: 'prod-new',
        name: 'New Tee',
        priceCents: 3500,
        stockQuantity: 20,
      });
    });

    it('creates product and returns success:true with created product', async () => {
      const result = await productsController.create(validBody);
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('id', 'prod-new');
      expect(result.message).toBe('Product created successfully');
    });

    it('passes all core fields to catalogService.createProduct', async () => {
      await productsController.create(validBody);
      expect(catalogService.createProduct).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'New Tee',
          description: 'A brand new tee shirt with cool design',
          priceCents: 3500,
          stockQuantity: 20,
          categoryId: 'cat-1',
          brand: 'Darkloom',
        }),
      );
    });

    it('passes optional shipping/dimension fields through', async () => {
      await productsController.create({
        ...validBody,
        weightMetric: '200g',
        weightImperial: '7oz',
        dimensionMetric: '30×20×2 cm',
        dimensionImperial: '12×8×0.8"',
      });
      expect(catalogService.createProduct).toHaveBeenCalledWith(
        expect.objectContaining({
          weightMetric: '200g',
          weightImperial: '7oz',
          dimensionMetric: '30×20×2 cm',
          dimensionImperial: '12×8×0.8"',
        }),
      );
    });

    it('passes images array to service', async () => {
      const images = [
        { url: 'https://example.com/1.jpg' },
        { url: 'https://example.com/2.jpg' },
      ];
      await productsController.create({ ...validBody, images });
      expect(catalogService.createProduct).toHaveBeenCalledWith(
        expect.objectContaining({ images }),
      );
    });

    it('throws BadRequestException when name is missing', async () => {
      const { name: _n, ...body } = validBody;
      await expect(
        productsController.create(body as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when description is missing', async () => {
      const { description: _d, ...body } = validBody;
      await expect(
        productsController.create(body as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when priceCents is missing', async () => {
      const { priceCents: _p, ...body } = validBody;
      await expect(
        productsController.create(body as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when priceCents is negative', async () => {
      await expect(
        productsController.create({ ...validBody, priceCents: -1 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when categoryId is missing', async () => {
      const { categoryId: _c, ...body } = validBody;
      await expect(
        productsController.create(body as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when brand is missing', async () => {
      const { brand: _b, ...body } = validBody;
      await expect(
        productsController.create(body as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException with VALIDATION_ERROR code', async () => {
      await expect(
        productsController.create({} as any),
      ).rejects.toMatchObject({
        response: expect.objectContaining({
          error: expect.objectContaining({ code: 'VALIDATION_ERROR' }),
        }),
      });
    });

    it('throws BadRequestException when images entry has no url', async () => {
      await expect(
        productsController.create({ ...validBody, images: [{ altText: 'hi' }] as any }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── ProductsController.update ────────────────────────────────────────────

  describe('ProductsController.update', () => {
    beforeEach(() => {
      (catalogService.updateProduct as jest.Mock).mockResolvedValue({
        ...mockProduct,
        name: 'Updated Tee',
        priceCents: 5000,
      });
    });

    it('updates product and returns success:true', async () => {
      const result = await productsController.update('prod-1', { name: 'Updated Tee', priceCents: 5000 });
      expect(result.success).toBe(true);
      expect(result.data.name).toBe('Updated Tee');
      expect(result.message).toBe('Product updated successfully');
    });

    it('passes only provided fields to service', async () => {
      await productsController.update('prod-1', { stockQuantity: 99 });
      expect(catalogService.updateProduct).toHaveBeenCalledWith(
        'prod-1',
        expect.objectContaining({ stockQuantity: 99 }),
      );
    });

    it('throws NotFoundException when product does not exist', async () => {
      (catalogService.updateProduct as jest.Mock).mockResolvedValueOnce(null);
      await expect(
        productsController.update('nonexistent', { name: 'Ghost' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when name is empty string', async () => {
      await expect(
        productsController.update('prod-1', { name: '' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when priceCents is negative', async () => {
      await expect(
        productsController.update('prod-1', { priceCents: -100 }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── ProductsController.delete ────────────────────────────────────────────

  describe('ProductsController.delete', () => {
    beforeEach(() => {
      (catalogService.deleteProduct as jest.Mock).mockResolvedValue(true);
    });

    it('deletes product and returns success:true', async () => {
      const result = await productsController.delete('prod-1');
      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
      expect(result.message).toBe('Product deleted successfully');
    });

    it('throws NotFoundException when product does not exist', async () => {
      (catalogService.deleteProduct as jest.Mock).mockResolvedValueOnce(false);
      await expect(productsController.delete('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});

