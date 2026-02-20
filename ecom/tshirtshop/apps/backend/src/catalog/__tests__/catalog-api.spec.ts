import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ProductsController } from '../products.controller';
import { CategoriesController } from '../categories.controller';
import { CatalogService } from '../catalog.service';

jest.mock('@thallesp/nestjs-better-auth', () => ({
  AllowAnonymous: () => () => {},
}));

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
    images: [{ id: 'img-1', productId: 'prod-1', imageUrl: 'https://example.com/1.jpg', isPrimary: true }],
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
});
