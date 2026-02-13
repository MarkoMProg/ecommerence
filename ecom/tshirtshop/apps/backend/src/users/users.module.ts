import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { AuthExtModule } from '../auth/auth-ext.module';

@Module({
  imports: [AuthExtModule],
  controllers: [UsersController],
})
export class UsersModule {}
