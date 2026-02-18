import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { CatalogService } from './catalog.service';

@Controller('api/v1/categories')
@AllowAnonymous()
export class CategoriesController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get()
  async list() {
    const categories = await this.catalogService.listCategories();
    return {
      success: true,
      data: categories,
      message: 'Categories retrieved successfully',
    };
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const category = await this.catalogService.getCategoryById(id);
    if (!category) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Category not found' },
      });
    }
    return {
      success: true,
      data: category,
      message: 'Category retrieved successfully',
    };
  }
}
