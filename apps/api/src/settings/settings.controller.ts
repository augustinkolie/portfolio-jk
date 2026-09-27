import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import type { SiteSettings } from '@btp/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { PublicCache } from '../common/public-cache.js';
import { UpdateSettingsDto } from './dto/settings.dto.js';
import { SettingsService } from './settings.service.js';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get('public')
  @PublicCache()
  get(): Promise<SiteSettings> {
    return this.settings.get();
  }
}

@Controller('admin/settings')
@UseGuards(JwtAuthGuard)
export class AdminSettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get()
  get(): Promise<SiteSettings> {
    return this.settings.get();
  }

  @Put()
  update(@Body() dto: UpdateSettingsDto): Promise<SiteSettings> {
    return this.settings.update(dto);
  }
}
