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
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import { BetterAuthGuard } from '../auth/guards/jwt-auth.guard';

/** Absolute path to the uploads directory on disk. */
const UPLOADS_DIR = join(process.cwd(), 'public', 'uploads');

// Ensure the uploads directory exists at module load time.
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/** Allowed image MIME and extension check. */
const IMAGE_EXT_REGEX = /\.(jpg|jpeg|png|webp|avif|gif)$/i;
const IMAGE_MIME_REGEX = /^image\/(jpeg|png|webp|avif|gif)$/i;

@Controller('api/v1/uploads')
export class UploadController {
  /**
   * Upload a product image.
   *
   * POST /api/v1/uploads
   * Content-Type: multipart/form-data
   * Field: file (image/jpeg|png|webp|avif|gif, max 5 MB)
   *
   * Returns:
   *   { success: true, data: { url: string, filename: string } }
   */
  @Post()
  @UseGuards(BetterAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: UPLOADS_DIR,
        filename: (_req, file, cb) => {
          const ext = extname(file.originalname).toLowerCase() || '.jpg';
          cb(null, `${randomUUID()}${ext}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        if (
          !IMAGE_EXT_REGEX.test(file.originalname) &&
          !IMAGE_MIME_REGEX.test(file.mimetype)
        ) {
          return cb(
            new BadRequestException('Only image files (jpg, png, webp, avif, gif) are allowed'),
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
  async uploadImage(
    @UploadedFile() file: MulterFile,
    @Req() req: Request,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided. Send a multipart/form-data request with field name "file".');
    }

    // Build full URL so the browser can reference it directly.
    const url = `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;

    return {
      success: true,
      data: { url, filename: file.filename },
      message: 'Image uploaded successfully',
    };
  }
}
