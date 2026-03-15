import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { Request } from 'express';
import type { MulterFile } from '../../common/multer-file.types';
import { UploadController } from '../upload.controller';
import { BetterAuthGuard } from '../../auth/guards/jwt-auth.guard';

jest.mock('@thallesp/nestjs-better-auth', () => ({
  AllowAnonymous: () => () => {},
}));

const mockBetterAuthGuard = { canActivate: jest.fn().mockReturnValue(true) };

/** Build a minimal fake Multer file object for testing. */
function mockFile(filename = 'test.jpg'): MulterFile {
  return {
    fieldname: 'file',
    originalname: filename,
    encoding: '7bit',
    mimetype: 'image/jpeg',
    filename,
    path: `/fake/uploads/${filename}`,
    size: 1024,
    destination: '/fake/uploads',
    buffer: Buffer.from(''),
    stream: null as any,
  };
}

/** Build a minimal fake Express Request with protocol + get(host). */
function mockReq(host = 'localhost:3000', protocol = 'http'): Request {
  return {
    protocol,
    get: jest.fn((header: string) => (header === 'host' ? host : undefined)),
  } as unknown as Request;
}

describe('UploadController', () => {
  let controller: UploadController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UploadController],
    })
      .overrideGuard(BetterAuthGuard)
      .useValue(mockBetterAuthGuard)
      .compile();

    controller = module.get<UploadController>(UploadController);
  });

  describe('POST /api/v1/uploads', () => {
    it('returns success:true with a hosted url when file is provided', () => {
      const result = controller.uploadImage(mockFile('abc123.jpg'), mockReq());
      expect(result.success).toBe(true);
      expect(result.data.url).toBe('http://localhost:3000/uploads/abc123.jpg');
      expect(result.message).toBe('Image uploaded successfully');
    });

    it('includes the filename in the response data', () => {
      const result = controller.uploadImage(
        mockFile('product-hero.png'),
        mockReq(),
      );
      expect(result.data.filename).toBe('product-hero.png');
    });

    it('uses the request protocol to build the url (https)', () => {
      const result = controller.uploadImage(
        mockFile('img.webp'),
        mockReq('shop.example.com', 'https'),
      );
      expect(result.data.url).toBe('https://shop.example.com/uploads/img.webp');
    });

    it('uses the request host to build the url (non-localhost)', () => {
      const result = controller.uploadImage(
        mockFile('banner.avif'),
        mockReq('cdn.mystore.com', 'https'),
      );
      expect(result.data.url).toContain('cdn.mystore.com');
    });

    it('url always starts with /uploads/ path segment', () => {
      const result = controller.uploadImage(mockFile('x.gif'), mockReq());
      const url = new URL(result.data.url);
      expect(url.pathname).toMatch(/^\/uploads\//);
    });

    it('throws BadRequestException when no file is provided (null)', () => {
      expect(() =>
        controller.uploadImage(null as unknown as MulterFile, mockReq()),
      ).toThrow(BadRequestException);
    });

    it('throws BadRequestException when no file is provided (undefined)', () => {
      expect(() =>
        controller.uploadImage(undefined as unknown as MulterFile, mockReq()),
      ).toThrow(BadRequestException);
    });

    it('BadRequestException message mentions the "file" field name', () => {
      expect(() =>
        controller.uploadImage(null as unknown as MulterFile, mockReq()),
      ).toThrow(/file/i);
    });
  });
});
