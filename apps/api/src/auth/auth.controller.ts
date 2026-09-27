import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { AuthResponse } from '@btp/shared';
import type { Request, Response } from 'express';
import { AppConfig } from '../config/app-config.js';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { clearRefreshCookie, readRefreshCookie, setRefreshCookie } from './refresh-cookie.js';
import { TokensService } from './tokens.service.js';

@Controller('auth')
@Throttle({ default: { limit: 10, ttl: 60_000 } })
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly tokens: TokensService,
    private readonly config: AppConfig,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    const { response, refreshToken } = await this.auth.login(dto.email, dto.password);
    this.setCookie(res, refreshToken);
    return response;
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    try {
      const { response, refreshToken } = await this.auth.refresh(readRefreshCookie(req));
      this.setCookie(res, refreshToken);
      return response;
    } catch (error) {
      clearRefreshCookie(res, this.config.isProduction);
      throw error;
    }
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<void> {
    await this.auth.logout(readRefreshCookie(req));
    clearRefreshCookie(res, this.config.isProduction);
  }

  private setCookie(res: Response, refreshToken: string): void {
    setRefreshCookie(res, refreshToken, this.tokens.refreshTokenTtlMs, this.config.isProduction);
  }
}
