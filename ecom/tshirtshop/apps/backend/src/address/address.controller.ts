import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import type { Request } from 'express';
import { BetterAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AddressService } from './address.service';
import { validateAddressDto } from './dto/address.dto';
import type { CreateAddressDto, UpdateAddressDto } from './dto/address.dto';

@Controller('api/v1/addresses')
@UseGuards(BetterAuthGuard)
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  /** List all saved addresses for the current user. */
  @Get()
  async listAddresses(@Req() req: Request) {
    const user = (req as any).user;
    const addresses = await this.addressService.listAddresses(user.id);
    return { success: true, data: addresses };
  }

  /** Create a new saved address. */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createAddress(@Req() req: Request, @Body() body: unknown) {
    const errors = validateAddressDto(body, false);
    if (errors.length > 0) {
      throw new BadRequestException({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Validation failed', details: errors },
      });
    }
    const user = (req as any).user;
    const address = await this.addressService.createAddress(user.id, body as CreateAddressDto);
    return { success: true, data: address };
  }

  /** Update an existing address (partial update). */
  @Patch(':id')
  async updateAddress(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const errors = validateAddressDto(body, true);
    if (errors.length > 0) {
      throw new BadRequestException({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Validation failed', details: errors },
      });
    }
    const user = (req as any).user;
    const address = await this.addressService.updateAddress(user.id, id.trim(), body as UpdateAddressDto);
    if (!address) {
      throw new NotFoundException({
        success: false,
        error: { code: 'ADDRESS_NOT_FOUND', message: 'Address not found' },
      });
    }
    return { success: true, data: address };
  }

  /** Delete a saved address. Handles default fallback automatically. */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteAddress(@Req() req: Request, @Param('id') id: string) {
    const user = (req as any).user;
    const ok = await this.addressService.deleteAddress(user.id, id.trim());
    if (!ok) {
      throw new NotFoundException({
        success: false,
        error: { code: 'ADDRESS_NOT_FOUND', message: 'Address not found' },
      });
    }
    return { success: true, data: null };
  }

  /** Set an address as the default shipping address for the current user. */
  @Patch(':id/set-default-shipping')
  async setDefaultShipping(@Req() req: Request, @Param('id') id: string) {
    const user = (req as any).user;
    const address = await this.addressService.setDefaultShipping(user.id, id.trim());
    if (!address) {
      throw new NotFoundException({
        success: false,
        error: { code: 'ADDRESS_NOT_FOUND', message: 'Address not found' },
      });
    }
    return { success: true, data: address };
  }

  /** Set an address as the default billing address for the current user. */
  @Patch(':id/set-default-billing')
  async setDefaultBilling(@Req() req: Request, @Param('id') id: string) {
    const user = (req as any).user;
    const address = await this.addressService.setDefaultBilling(user.id, id.trim());
    if (!address) {
      throw new NotFoundException({
        success: false,
        error: { code: 'ADDRESS_NOT_FOUND', message: 'Address not found' },
      });
    }
    return { success: true, data: address };
  }
}
