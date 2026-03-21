import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { Request } from 'express';
import * as fs from 'fs';
import type { MulterFile } from '../../common/multer-file.types';
import { UploadController } from '../upload.controller';
import { BetterAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CatalogService } from '../../catalog/catalog.service';

jest.mock('fs', () => ({
  ...jest.requireActual<typeof import('fs')>('fs'),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
}));

jest.mock('@thallesp/nestjs-better-auth', () => ({
  AllowAnonymous: () => () => {},
}));

const mockBetterAuthGuard = { canActivate: jest.fn().mockReturnValue(true) };

const mockCatalogService = {
  getCategoryById: jest.fn().mockResolvedValue({
    id: '1',
    name: 'T-Shirts',
    slug: 't-shirts',
    parentCategoryId: null,
    createdAt: new Date(),
  }),
};

/** Build a minimal fake Multer file object for testing (memory storage). */
function mockFile(filename = 'test.jpg'): MulterFile {
  return {
    fieldname: 'file',
    originalname: filename,
    encoding: '7bit',
    mimetype: 'image/jpeg',
    filename: 'ignored',
    path: '',
    destination: '',
    size: 4,
    buffer: Buffer.from('data'),
    stream: null as never,
  };
}

/** Build a minimal fake Express Request with protocol + get(host) + body. */
function mockReq(
  host = 'localhost:3000',
  protocol = 'http',
  body: Record<string, string> = {
    categoryId: '1',
    productName: 'Test Product',
  },
): Request {
  return {
    protocol,
    get: jest.fn((header: string) => (header === 'host' ? host : undefined)),
    body,
  } as unknown as Request;
}

describe('UploadController', () => {
  let controller: UploadController;

  beforeEach(async () => {
    mockCatalogService.getCategoryById.mockResolvedValue({
      id: '1',
      name: 'T-Shirts',
      slug: 't-shirts',
      parentCategoryId: null,
      createdAt: new Date(),
    });

    (fs.mkdirSync as jest.Mock).mockImplementation(() => undefined);
    (fs.writeFileSync as jest.Mock).mockImplementation(() => undefined);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UploadController],
      providers: [{ provide: CatalogService, useValue: mockCatalogService }],
    })
      .overrideGuard(BetterAuthGuard)
      .useValue(mockBetterAuthGuard)
      .compile();

    controller = module.get<UploadController>(UploadController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/uploads', () => {
    it('returns success:true with a hosted url under /uploads/products/...', async () => {
      const result = await controller.uploadImage(mockFile('abc123.jpg'), mockReq());
      expect(result.success).toBe(true);
      expect(result.data.url).toMatch(
        /^http:\/\/localhost:3000\/uploads\/products\/tshirts\/Test%20Product\/[0-9a-f-]+\.jpg$/,
      );
      expect(result.message).toBe('Image uploaded successfully');
    });

    it('includes the filename in the response data', async () => {
      const result = await controller.uploadImage(
        mockFile('product-hero.png'),
        mockReq(),
      );
      expect(result.data.filename).toMatch(/^[0-9a-f-]+\.png$/);
    });

    it('uses the request protocol to build the url (https)', async () => {
      const result = await controller.uploadImage(
        mockFile('img.webp'),
        mockReq('shop.example.com', 'https'),
      );
      expect(result.data.url).toMatch(
        /^https:\/\/shop\.example\.com\/uploads\/products\/tshirts\/Test%20Product\/[0-9a-f-]+\.webp$/,
      );
    });

    it('uses category slug folder when not a legacy id', async () => {
      mockCatalogService.getCategoryById.mockResolvedValueOnce({
        id: '99',
        name: 'New Cat',
        slug: 'new-cat',
        parentCategoryId: null,
        createdAt: new Date(),
      });
      const result = await controller.uploadImage(
        mockFile('x.gif'),
        mockReq('localhost:3000', 'http', {
          categoryId: '99',
          productName: 'My Item',
        }),
      );
      expect(result.data.url).toContain('/uploads/products/new-cat/My%20Item/');
    });

    it('url pathname always starts with /uploads/products/', async () => {
      const result = await controller.uploadImage(mockFile('x.gif'), mockReq());
      const url = new URL(result.data.url);
      expect(url.pathname.startsWith('/uploads/products/')).toBe(true);
    });

    it('throws BadRequestException when no file is provided (null)', async () => {
      await expect(
        controller.uploadImage(null as unknown as MulterFile, mockReq()),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws when categoryId is missing', async () => {
      await expect(
        controller.uploadImage(
          mockFile(),
          mockReq('localhost:3000', 'http', { productName: 'X' }),
        ),
      ).rejects.toThrow(/categoryId/i);
    });

    it('throws when productName is missing or empty after sanitize', async () => {
      await expect(
        controller.uploadImage(
          mockFile(),
          mockReq('localhost:3000', 'http', { categoryId: '1', productName: '  ' }),
        ),
      ).rejects.toThrow(/productName/i);
    });

    it('BadRequestException message mentions the "file" field name when file absent', async () => {
      await expect(
        controller.uploadImage(null as unknown as MulterFile, mockReq()),
      ).rejects.toThrow(/file/i);
    });
  });
});
