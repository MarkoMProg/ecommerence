import {
  Controller,
  Post,
  Get,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { BetterAuthGuard } from './guards/jwt-auth.guard';
import { validateRegister, validateLogin } from './dto/auth.dto';

@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Req() req: Request) {
    const errors = validateRegister(req.body);
    if (errors.length > 0) {
      throw new BadRequestException({ message: 'Validation failed', errors });
    }

    const { name, email, password } = req.body;
    const headers = this.toWebHeaders(req);
    const result = await this.authService.register({
      name,
      email,
      password,
      headers,
    });

    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
      },
      message:
        'Account created. Please check your email to verify your address.',
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Req() req: Request) {
    const errors = validateLogin(req.body);
    if (errors.length > 0) {
      throw new BadRequestException({ message: 'Validation failed', errors });
    }

    const { email, password } = req.body;
    const headers = this.toWebHeaders(req);
    const result = await this.authService.login({ email, password, headers });

    if ('twoFactorRequired' in result) {
      return { twoFactorRequired: true };
    }

    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
      },
    };
  }

  @Get('me')
  @UseGuards(BetterAuthGuard)
  getMe(@Req() req: Request) {
    return { user: (req as any).user };
  }

  @Post('revoke-all')
  @UseGuards(BetterAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async revokeAll(@Req() req: Request) {
    const headers = this.toWebHeaders(req);
    await this.authService.revokeAllSessions(headers);
  }

  @Get('sessions')
  @UseGuards(BetterAuthGuard)
  async listSessions(@Req() req: Request) {
    const headers = this.toWebHeaders(req);
    return this.authService.listSessions(headers);
  }

  private toWebHeaders(req: Request): Headers {
    const webHeaders = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (typeof value === 'string') {
        webHeaders.set(key, value);
      } else if (Array.isArray(value)) {
        webHeaders.set(key, value.join(', '));
      }
    }
    return webHeaders;
  }
}
