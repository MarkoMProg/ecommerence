import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Param,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Request } from 'express';
import { BetterAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BillingService } from './billing.service';

@Controller('api/v1/billing')
@UseGuards(BetterAuthGuard)
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  /**
   * List saved card payment methods for the current user.
   * Returns empty array if Stripe is not configured or user has no saved methods.
   */
  @Get('payment-methods')
  async listPaymentMethods(@Req() req: Request) {
    const user = req.user!;
    if (!this.billingService.isConfigured()) {
      return { success: true, data: [], configured: false };
    }
    const methods = await this.billingService.listPaymentMethods(user.id);
    return { success: true, data: methods, configured: true };
  }

  /**
   * Create a Stripe Checkout setup session.
   * Returns a redirect URL — the frontend navigates to it.
   * Stripe handles card capture securely, then redirects back to /account?pm_added=1.
   */
  @Post('setup-session')
  @HttpCode(HttpStatus.OK)
  async createSetupSession(@Req() req: Request) {
    const user = req.user!;
    const url = await this.billingService.createSetupSession(
      user.id,
      user.email,
      user.name ?? user.email,
    );
    return { success: true, data: { url } };
  }

  /**
   * Detach (remove) a saved payment method.
   * Strict ownership check — users can only remove their own methods.
   */
  @Delete('payment-methods/:pmId')
  @HttpCode(HttpStatus.OK)
  async detachPaymentMethod(@Req() req: Request, @Param('pmId') pmId: string) {
    const user = req.user!;
    await this.billingService.detachPaymentMethod(user.id, pmId.trim());
    return { success: true, data: null };
  }

  /**
   * Set a payment method as the default for this account.
   * Strict ownership check before updating Stripe customer.
   */
  @Patch('payment-methods/:pmId/set-default')
  @HttpCode(HttpStatus.OK)
  async setDefaultPaymentMethod(
    @Req() req: Request,
    @Param('pmId') pmId: string,
  ) {
    const user = req.user!;
    await this.billingService.setDefaultPaymentMethod(user.id, pmId.trim());
    return { success: true, data: null };
  }
}
