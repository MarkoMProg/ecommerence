import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { BetterAuthCoreModule } from '../auth/better-auth-core.module';
import { AddressService } from './address.service';
import { AddressController } from './address.controller';

@Module({
  imports: [DatabaseModule, BetterAuthCoreModule],
  providers: [AddressService],
  controllers: [AddressController],
  exports: [AddressService],
})
export class AddressModule {}
