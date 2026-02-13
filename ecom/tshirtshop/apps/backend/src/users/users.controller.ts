import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { BetterAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { Request } from 'express';

@Controller('users')
export class UsersController {
  @Get('session')
  getSession() {
    return {};
  }

  @Get('profile')
  @UseGuards(BetterAuthGuard)
  getProfile(@Req() req: Request) {
    return { user: (req as any).user };
  }
}
