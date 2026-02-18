import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { CatalogService } from './catalog.service';
import { ProductsController } from './products.controller';
import { CategoriesController } from './categories.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [ProductsController, CategoriesController],
  providers: [CatalogService],
  exports: [CatalogService],
})
export class CatalogModule {}
