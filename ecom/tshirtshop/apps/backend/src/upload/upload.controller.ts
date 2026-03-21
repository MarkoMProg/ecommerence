import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Req,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import type { MulterFile } from '../common/multer-file.types';
import { memoryStorage } from 'multer';
import { extname, join, relative, resolve } from 'path';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import { BetterAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CatalogService } from '../catalog/catalog.service';

/** Absolute path to the uploads directory on disk. */
const UPLOADS_DIR = join(process.cwd(), 'public', 'uploads');

// Ensure the uploads directory exists at module load time.
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/** Allowed image MIME and extension check. */
const IMAGE_EXT_REGEX = /\.(jpg|jpeg|png|webp|avif|gif)$/i;
const IMAGE_MIME_REGEX = /^image\/(jpeg|png|webp|avif|gif)$/i;

/**
 * Folder names under public/uploads/products/ that match the bulk-import layout
 * (see generate-products-bulk-import.mjs). Other categories use DB slug.
 */
const LEGACY_CATEGORY_FOLDER: Record<string, string> = {
  '1': 'tshirts',
  '4': 'misc',
  '5': 'Posters',
};

function sanitizeProductFolderName(raw: string): string {
  let s = raw.replace(/\s+/g, ' ').trim();
  s = s.replace(/[<>:"/\\|?*\x00-\x1f]/g, '');
  s = s.replace(/\s+/g, ' ').trim();
  s = s.replace(/^\.+|\.+$/g, '').trim();
  if (s.length > 120) s = s.slice(0, 120).trim();
  return s;
}

function categoryFolderSegment(categoryId: string, slug: string): string {
  return LEGACY_CATEGORY_FOLDER[categoryId] ?? slug;
}

function assertUnderProductsUploads(targetDir: string): void {
  const productsBase = resolve(UPLOADS_DIR, 'products');
  const resolved = resolve(targetDir);
  const rel = relative(productsBase, resolved);
  const parts = rel.split(/[/\\]/);
  if (rel.startsWith('..') || parts.includes('..')) {
    throw new BadRequestException(
      'Invalid upload path — product folder must stay under uploads/products.',
    );
  }
}

function buildUploadsUrlPath(absoluteFilePath: string): string {
  const rel = relative(UPLOADS_DIR, absoluteFilePath).replace(/\\/g, '/');
  const segments = rel.split('/').filter(Boolean);
  return segments.map((s) => encodeURIComponent(s)).join('/');
}

@Controller('api/v1/uploads')
export class UploadController {
  constructor(private readonly catalogService: CatalogService) {}

  /**
   * Upload a product image.
   *
   * POST /api/v1/uploads
   * Content-Type: multipart/form-data
   * Fields: file (image), categoryId, productName
   * Files are stored under public/uploads/products/<category folder>/<product name>/.
   *
   * Returns:
   *   { success: true, data: { url: string, filename: string } }
   */
  @Post()
  @UseGuards(BetterAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      fileFilter: (_req, file, cb) => {
        if (
          !IMAGE_EXT_REGEX.test(file.originalname) &&
          !IMAGE_MIME_REGEX.test(file.mimetype)
        ) {
          return cb(
            new BadRequestException(
              'Only image files (jpg, png, webp, avif, gif) are allowed',
            ),
            false,
          );
        }
        cb(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB
      },
    }),
  )
  async uploadImage(@UploadedFile() file: MulterFile, @Req() req: Request) {
    if (!file) {
      throw new BadRequestException(
        'No file provided. Send a multipart/form-data request with field name "file".',
      );
    }

    const body = req.body as Record<string, string | undefined>;
    const categoryId = typeof body?.categoryId === 'string' ? body.categoryId.trim() : '';
    const productNameRaw =
      typeof body?.productName === 'string' ? body.productName : '';

    if (!categoryId) {
      throw new BadRequestException(
        'Field "categoryId" is required (multipart text field alongside "file").',
      );
    }
    const productFolder = sanitizeProductFolderName(productNameRaw);
    if (!productFolder) {
      throw new BadRequestException(
        'Field "productName" is required and must contain at least one valid character after sanitization.',
      );
    }

    const category = await this.catalogService.getCategoryById(categoryId);
    if (!category) {
      throw new BadRequestException(`Unknown category id "${categoryId}".`);
    }

    const catSeg = categoryFolderSegment(category.id, category.slug);
    const destDir = join(UPLOADS_DIR, 'products', catSeg, productFolder);
    assertUnderProductsUploads(destDir);

    const ext = extname(file.originalname).toLowerCase() || '.jpg';
    const filename = `${randomUUID()}${ext}`;
    const absolutePath = join(destDir, filename);

    if (!file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('Empty image file.');
    }

    fs.mkdirSync(destDir, { recursive: true });
    fs.writeFileSync(absolutePath, file.buffer);

    const pathAfterUploads = buildUploadsUrlPath(absolutePath);
    const url = `${req.protocol}://${req.get('host')}/uploads/${pathAfterUploads}`;

    return {
      success: true,
      data: { url, filename },
      message: 'Image uploaded successfully',
    };
  }
}
