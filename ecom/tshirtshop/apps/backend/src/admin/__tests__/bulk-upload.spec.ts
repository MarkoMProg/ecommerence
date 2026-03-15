import { BulkUploadService } from '../../catalog/bulk-upload.service';

describe('BulkUploadService', () => {
  let service: BulkUploadService;

  beforeEach(() => {
    service = new BulkUploadService();
  });

  // ─── CSV Parsing ──────────────────────────────────────────────────────────

  describe('parseCSV', () => {
    it('should parse a valid CSV with required fields', () => {
      const csv = [
        'name,description,priceCents,categoryId,brand',
        'Test Tee,A cool tee,2999,cat-1,BrandX',
      ].join('\n');

      const entries = service.parseCSV(csv);
      expect(entries).toHaveLength(1);
      expect(entries[0].name).toBe('Test Tee');
      expect(entries[0].description).toBe('A cool tee');
      expect(entries[0].priceCents).toBe(2999);
      expect(entries[0].categoryId).toBe('cat-1');
      expect(entries[0].brand).toBe('BrandX');
    });

    it('should parse optional fields', () => {
      const csv = [
        'name,description,priceCents,categoryId,brand,stockQuantity,weightMetric',
        'Hoodie,Warm hoodie,4999,cat-2,BrandY,50,400g',
      ].join('\n');

      const entries = service.parseCSV(csv);
      expect(entries[0].stockQuantity).toBe(50);
      expect(entries[0].weightMetric).toBe('400g');
    });

    it('should parse pipe-separated imageUrls', () => {
      const csv = [
        'name,description,priceCents,categoryId,brand,imageUrls',
        'Tee,Desc,1999,cat-1,B,https://a.com/1.jpg|https://a.com/2.jpg',
      ].join('\n');

      const entries = service.parseCSV(csv);
      expect(entries[0].images).toEqual([
        { url: 'https://a.com/1.jpg' },
        { url: 'https://a.com/2.jpg' },
      ]);
    });

    it('should handle quoted fields with commas', () => {
      const csv = [
        'name,description,priceCents,categoryId,brand',
        '"Fancy Tee","A cool, comfortable tee",2999,cat-1,BrandX',
      ].join('\n');

      const entries = service.parseCSV(csv);
      expect(entries[0].description).toBe('A cool, comfortable tee');
    });

    it('should handle escaped quotes in quoted fields', () => {
      const csv = [
        'name,description,priceCents,categoryId,brand',
        '"Tee","She said ""wow""",2999,cat-1,B',
      ].join('\n');

      const entries = service.parseCSV(csv);
      expect(entries[0].description).toBe('She said "wow"');
    });

    it('should skip empty lines', () => {
      const csv = [
        'name,description,priceCents,categoryId,brand',
        'Tee1,D1,1999,cat-1,B',
        '',
        'Tee2,D2,2999,cat-1,B',
        '   ',
      ].join('\n');

      const entries = service.parseCSV(csv);
      expect(entries).toHaveLength(2);
    });

    it('should handle \\r\\n line endings', () => {
      const csv =
        'name,description,priceCents,categoryId,brand\r\nTee,Desc,999,c,B\r\n';
      const entries = service.parseCSV(csv);
      expect(entries).toHaveLength(1);
      expect(entries[0].name).toBe('Tee');
    });

    it('should return empty array for headers-only CSV', () => {
      const csv = 'name,description,priceCents,categoryId,brand\n';
      const entries = service.parseCSV(csv);
      expect(entries).toHaveLength(0);
    });

    it('should return empty array for empty content', () => {
      expect(service.parseCSV('')).toHaveLength(0);
    });

    it('should parse multiple rows', () => {
      const csv = [
        'name,description,priceCents,categoryId,brand',
        'Tee1,Desc1,1999,cat-1,B1',
        'Tee2,Desc2,2999,cat-2,B2',
        'Tee3,Desc3,3999,cat-3,B3',
      ].join('\n');

      const entries = service.parseCSV(csv);
      expect(entries).toHaveLength(3);
      expect(entries[2].name).toBe('Tee3');
      expect(entries[2].priceCents).toBe(3999);
    });

    it('should handle case-insensitive headers', () => {
      const csv = [
        'Name,Description,PriceCents,CategoryId,Brand,StockQuantity',
        'Tee,Desc,999,cat-1,B,10',
      ].join('\n');

      const entries = service.parseCSV(csv);
      expect(entries[0].name).toBe('Tee');
      expect(entries[0].stockQuantity).toBe(10);
    });
  });

  // ─── JSON Parsing ─────────────────────────────────────────────────────────

  describe('parseJSON', () => {
    it('should parse a valid JSON array', () => {
      const json = JSON.stringify([
        {
          name: 'Tee',
          description: 'Desc',
          priceCents: 2999,
          categoryId: 'cat-1',
          brand: 'B',
          stockQuantity: 10,
        },
      ]);

      const entries = service.parseJSON(json);
      expect(entries).toHaveLength(1);
      expect(entries[0].name).toBe('Tee');
      expect(entries[0].stockQuantity).toBe(10);
    });

    it('should parse images array of objects', () => {
      const json = JSON.stringify([
        {
          name: 'Tee',
          description: 'D',
          priceCents: 999,
          categoryId: 'c',
          brand: 'B',
          images: [{ url: 'https://a.com/1.jpg' }],
        },
      ]);

      const entries = service.parseJSON(json);
      expect(entries[0].images).toEqual([{ url: 'https://a.com/1.jpg' }]);
    });

    it('should parse images as string array', () => {
      const json = JSON.stringify([
        {
          name: 'Tee',
          description: 'D',
          priceCents: 999,
          categoryId: 'c',
          brand: 'B',
          images: ['https://a.com/1.jpg', 'https://a.com/2.jpg'],
        },
      ]);

      const entries = service.parseJSON(json);
      expect(entries[0].images).toEqual([
        { url: 'https://a.com/1.jpg' },
        { url: 'https://a.com/2.jpg' },
      ]);
    });

    it('should fallback to imageUrls field', () => {
      const json = JSON.stringify([
        {
          name: 'Tee',
          description: 'D',
          priceCents: 999,
          categoryId: 'c',
          brand: 'B',
          imageUrls: ['https://a.com/1.jpg'],
        },
      ]);

      const entries = service.parseJSON(json);
      expect(entries[0].images).toEqual([{ url: 'https://a.com/1.jpg' }]);
    });

    it('should throw on non-array JSON', () => {
      expect(() => service.parseJSON('{"name":"Tee"}')).toThrow(
        'JSON must be an array of product objects',
      );
    });

    it('should throw on invalid JSON', () => {
      expect(() => service.parseJSON('not json')).toThrow();
    });

    it('should handle missing optional fields', () => {
      const json = JSON.stringify([
        {
          name: 'Tee',
          description: 'D',
          priceCents: 999,
          categoryId: 'c',
          brand: 'B',
        },
      ]);

      const entries = service.parseJSON(json);
      expect(entries[0].stockQuantity).toBeUndefined();
      expect(entries[0].weightMetric).toBeUndefined();
      expect(entries[0].images).toBeUndefined();
    });
  });

  // ─── Format Detection ────────────────────────────────────────────────────

  describe('detectFormat', () => {
    it('should detect .json files', () => {
      expect(service.detectFormat('products.json', '[]')).toBe('json');
    });

    it('should detect .csv files', () => {
      expect(service.detectFormat('products.csv', 'name,desc')).toBe('csv');
    });

    it('should fallback to JSON for content starting with [', () => {
      expect(service.detectFormat('file.txt', '[{"name":"T"}]')).toBe('json');
    });

    it('should fallback to CSV for other content', () => {
      expect(service.detectFormat('file.txt', 'name,desc\nT,D')).toBe('csv');
    });
  });

  // ─── Validation ───────────────────────────────────────────────────────────

  describe('validateEntry', () => {
    const validEntry = {
      name: 'Test Tee',
      description: 'A great tee',
      priceCents: 2999,
      categoryId: 'cat-1',
      brand: 'BrandX',
    };

    it('should return null for valid entry', () => {
      expect(service.validateEntry(validEntry)).toBeNull();
    });

    it('should return error for missing name', () => {
      const error = service.validateEntry({ ...validEntry, name: '' });
      expect(error).toContain('name');
    });

    it('should return error for missing description', () => {
      const error = service.validateEntry({ ...validEntry, description: '' });
      expect(error).toContain('description');
    });

    it('should return error for negative price', () => {
      const error = service.validateEntry({ ...validEntry, priceCents: -1 });
      expect(error).toContain('priceCents');
    });

    it('should return error for missing categoryId', () => {
      const error = service.validateEntry({ ...validEntry, categoryId: '' });
      expect(error).toContain('categoryId');
    });

    it('should return error for missing brand', () => {
      const error = service.validateEntry({ ...validEntry, brand: '' });
      expect(error).toContain('brand');
    });

    it('should accept valid entry with images', () => {
      const error = service.validateEntry({
        ...validEntry,
        images: [{ url: 'https://example.com/1.jpg' }],
      });
      expect(error).toBeNull();
    });
  });
});
