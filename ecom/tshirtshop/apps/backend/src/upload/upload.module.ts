import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { BetterAuthCoreModule } from '../auth/better-auth-core.module';

@Module({
  imports: [BetterAuthCoreModule],
  controllers: [UploadController],
})
export class UploadModule {}
