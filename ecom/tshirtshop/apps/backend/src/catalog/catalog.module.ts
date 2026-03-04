import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AuthExtModule } from '../auth/auth-ext.module';
import { ReviewModule } from '../review/review.module';
import { CatalogService } from './catalog.service';
import { ProductsController } from './products.controller';
import { CategoriesController } from './categories.controller';

@Module({
  imports: [DatabaseModule, AuthExtModule, ReviewModule],
  controllers: [ProductsController, CategoriesController],
  providers: [CatalogService],
  exports: [CatalogService],
})
export class CatalogModule {}
