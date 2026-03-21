import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { BetterAuthCoreModule } from '../auth/better-auth-core.module';
import { CatalogModule } from '../catalog/catalog.module';

@Module({
  imports: [BetterAuthCoreModule, CatalogModule],
  controllers: [UploadController],
})
export class UploadModule {}
