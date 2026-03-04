import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AuthExtModule } from '../auth/auth-ext.module';
import { ReviewsController } from './reviews.controller';
import { ReviewService } from './review.service';

@Module({
  imports: [DatabaseModule, AuthExtModule],
  controllers: [ReviewsController],
  providers: [ReviewService],
  exports: [ReviewService],
})
export class ReviewModule {}
