import { Body, Controller, Get, Patch, Res, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { AdminUser, AuthResponse } from '@btp/shared';
import type { Response } from 'express';
import { AppConfig } from '../config/app-config.js';
import { toAdminUser, UsersService } from '../users/users.service.js';
import { AuthService } from './auth.service.js';
import { CurrentUserId } from './current-user-id.decorator.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { setRefreshCookie } from './refresh-cookie.js';
import { sessionExpired, TokensService } from './tokens.service.js';

@Controller('admin/account')
@UseGuards(JwtAuthGuard)
export class AccountController {
  constructor(
    private readonly auth: AuthService,
    private readonly users: UsersService,
    private readonly tokens: TokensService,
    private readonly config: AppConfig,
  ) {}

  @Get()
  async me(@CurrentUserId() userId: string): Promise<AdminUser> {
    const user = await this.users.findById(userId);
    if (!user) throw sessionExpired();
    return toAdminUser(user);
  }

  @Patch('password')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async changePassword(
    @CurrentUserId() userId: string,
    @Body() dto: ChangePasswordDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    const { response, refreshToken } = await this.auth.changePassword(
      userId,
      dto.currentPassword,
      dto.newPassword,
    );
    setRefreshCookie(res, refreshToken, this.tokens.refreshTokenTtlMs, this.config.isProduction);
    return response;
  }
}
