import { Test, TestingModule } from '@nestjs/testing';
import { DATABASE_CONNECTION } from '../../database/database-connection';
import { CatalogService } from '../catalog.service';

/** Creates a thenable chain for drizzle-style mocks */
function thenable<T>(value: T): { then: (fn: (v: T) => void) => void; from: () => any; where: () => any; orderBy: () => any; limit: () => any; offset: () => any } {
  const chain: any = {
    from: () => chain,
    where: () => chain,
    orderBy: () => chain,
    limit: () => chain,
    offset: () => chain,
    values: () => ({ then: (fn: any) => fn(), catch: () => {} }),
    set: () => ({ where: () => ({ then: (fn: any) => fn(), catch: () => {} }) }),
    then: (resolve: (v: T) => void) => resolve(value),
    catch: () => {},
  };
  return chain;
}

describe('CatalogService', () => {
  let service: CatalogService;
  let mockDb: any;

  const mockCategory = {
    id: 'cat-1',
    name: 'T-Shirts',
    slug: 't-shirts',
    parentCategoryId: null,
    createdAt: new Date(),
  };

  const mockProduct = {
    id: 'prod-1',
    name: 'Test Tee',
    description: 'A test t-shirt',
    priceCents: 2999,
    stockQuantity: 10,
    categoryId: 'cat-1',
    brand: 'TestBrand',
    weightMetric: null,
    weightImperial: null,
    dimensionMetric: null,
    dimensionImperial: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockImage = {
    id: 'img-1',
    productId: 'prod-1',
    imageUrl: 'https://example.com/img.jpg',
    isPrimary: true,
  };

  beforeEach(async () => {
    mockDb = {
      select: jest.fn(() => thenable([])),
      selectDistinct: jest.fn(() => thenable([])),
      insert: jest.fn(() => ({ values: jest.fn(() => ({ then: (fn: any) => fn(), catch: () => {} })) })),
      update: jest.fn(() => ({ set: jest.fn(() => ({ where: jest.fn(() => ({ then: (fn: any) => fn(), catch: () => {} })) })) })),
      delete: jest.fn(() => ({ where: jest.fn(() => ({ then: (fn: any) => fn(), catch: () => {} })) })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CatalogService,
        {
          provide: DATABASE_CONNECTION,
          useValue: mockDb,
        },
      ],
    }).compile();

    service = module.get<CatalogService>(CatalogService);
  });

  describe('listCategories', () => {
    it('should return categories from db', async () => {
      (mockDb.select as jest.Mock).mockReturnValue(
        thenable([mockCategory]),
      );
      const result = await service.listCategories();
      expect(result).toEqual([mockCategory]);
      expect(mockDb.select).toHaveBeenCalled();
    });

    it('should return empty array when no categories', async () => {
      (mockDb.select as jest.Mock).mockReturnValue(thenable([]));
      const result = await service.listCategories();
      expect(result).toEqual([]);
    });
  });

  describe('getSearchSuggestions', () => {
    it('should return empty when q is shorter than 2 chars', async () => {
      const result = await service.getSearchSuggestions('a', 10);
      expect(result).toEqual({
        products: [],
        categories: [],
        brands: [],
      });
      expect(mockDb.select).not.toHaveBeenCalled();
      expect(mockDb.selectDistinct).not.toHaveBeenCalled();
    });

    it('should return empty when q is empty string', async () => {
      const result = await service.getSearchSuggestions('  ', 10);
      expect(result).toEqual({
        products: [],
        categories: [],
        brands: [],
      });
    });

    it('should return products, categories, brands when db has matches', async () => {
      (mockDb.selectDistinct as jest.Mock)
        .mockReturnValueOnce(thenable([{ name: 'Dragon Tee' }]))
        .mockReturnValueOnce(thenable([{ brand: 'Darkloom' }]));
      (mockDb.select as jest.Mock).mockReturnValueOnce(
        thenable([{ name: 'T-Shirts', slug: 't-shirts' }]),
      );

      const result = await service.getSearchSuggestions('drag', 10);
      expect(result.products).toContain('Dragon Tee');
      expect(result.categories).toEqual([{ name: 'T-Shirts', slug: 't-shirts' }]);
      expect(result.brands).toContain('Darkloom');
    });
  });

  describe('getDistinctBrands', () => {
    it('should return distinct brands from db', async () => {
      (mockDb.selectDistinct as jest.Mock).mockReturnValue(
        thenable([{ brand: 'A' }, { brand: 'B' }]),
      );
      const result = await service.getDistinctBrands();
      expect(result).toEqual(['A', 'B']);
    });
  });

  describe('getCategoryBySlug', () => {
    it('should return category when found', async () => {
      (mockDb.select as jest.Mock).mockReturnValue(
        thenable([mockCategory]),
      );
      const result = await service.getCategoryBySlug('t-shirts');
      expect(result).toEqual(mockCategory);
    });

    it('should return null when not found', async () => {
      (mockDb.select as jest.Mock).mockReturnValue(thenable([]));
      const result = await service.getCategoryBySlug('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('getProductById', () => {
    it('should return product with images and category when found', async () => {
      (mockDb.select as jest.Mock)
        .mockReturnValueOnce(thenable([mockProduct]))
        .mockReturnValueOnce(thenable([mockImage]))
        .mockReturnValueOnce(thenable([mockCategory]));
      const result = await service.getProductById('prod-1');
      expect(result).not.toBeNull();
      expect(result!.id).toBe('prod-1');
      expect(result!.name).toBe('Test Tee');
      expect(result!.images).toEqual([mockImage]);
      expect(result!.category).toEqual(mockCategory);
    });

    it('should return null when product not found', async () => {
      (mockDb.select as jest.Mock).mockReturnValueOnce(thenable([]));
      const result = await service.getProductById('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('deleteProduct', () => {
    it('should return true when product exists and is deleted', async () => {
      (mockDb.select as jest.Mock).mockReturnValueOnce(thenable([mockProduct]));
      const result = await service.deleteProduct('prod-1');
      expect(result).toBe(true);
      expect(mockDb.delete).toHaveBeenCalled();
    });

    it('should return false when product does not exist', async () => {
      (mockDb.select as jest.Mock).mockReturnValueOnce(thenable([]));
      const result = await service.deleteProduct('nonexistent');
      expect(result).toBe(false);
      expect(mockDb.delete).not.toHaveBeenCalled();
    });
  });
});
