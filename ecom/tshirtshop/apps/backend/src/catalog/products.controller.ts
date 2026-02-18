import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { CatalogService } from './catalog.service';
import {
  validateCreateProduct,
  validateUpdateProduct,
  type CreateProductBody,
  type UpdateProductBody,
} from './dto/catalog.dto';

@Controller('api/v1/products')
@AllowAnonymous()
export class ProductsController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get()
  async list(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('category') category?: string,
    @Query('q') q?: string,
  ) {
    const result = await this.catalogService.listProducts({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      category,
      q: q?.trim() || undefined,
    });
    return {
      success: true,
      data: result.data,
      pagination: result.pagination,
      message: 'Products retrieved successfully',
    };
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const product = await this.catalogService.getProductById(id);
    if (!product) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Product not found' },
      });
    }
    return {
      success: true,
      data: product,
      message: 'Product retrieved successfully',
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: CreateProductBody) {
    const errors = validateCreateProduct(body);
    if (errors.length > 0) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: errors,
        },
      });
    }
    const product = await this.catalogService.createProduct({
      name: body.name,
      description: body.description,
      priceCents: body.priceCents,
      stockQuantity: body.stockQuantity,
      categoryId: body.categoryId,
      brand: body.brand,
      weightMetric: body.weightMetric,
      weightImperial: body.weightImperial,
      dimensionMetric: body.dimensionMetric,
      dimensionImperial: body.dimensionImperial,
      imageUrls: body.imageUrls,
    });
    return {
      success: true,
      data: product,
      message: 'Product created successfully',
    };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: UpdateProductBody) {
    const errors = validateUpdateProduct(body);
    if (errors.length > 0) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: errors,
        },
      });
    }
    const product = await this.catalogService.updateProduct(id, body);
    if (!product) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Product not found' },
      });
    }
    return {
      success: true,
      data: product,
      message: 'Product updated successfully',
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id') id: string) {
    const deleted = await this.catalogService.deleteProduct(id);
    if (!deleted) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Product not found' },
      });
    }
    return {
      success: true,
      data: null,
      message: 'Product deleted successfully',
    };
  }
}
