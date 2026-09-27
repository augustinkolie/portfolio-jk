import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import type { ExpertiseDetailDto, ExpertiseDto } from '@btp/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { PublicCache } from '../common/public-cache.js';
import { ReorderDto } from '../common/reorder.dto.js';
import { CreateExpertiseDto, UpdateExpertiseDto } from './dto/expertise.dto.js';
import { ExpertisesService } from './expertises.service.js';

@Controller('expertises')
export class ExpertisesController {
  constructor(private readonly expertises: ExpertisesService) {}

  @Get()
  @PublicCache()
  list(): Promise<ExpertiseDto[]> {
    return this.expertises.list();
  }

  @Get(':slug')
  @PublicCache()
  findOne(@Param('slug') slug: string): Promise<ExpertiseDetailDto> {
    return this.expertises.findBySlug(slug);
  }
}

@Controller('admin/expertises')
@UseGuards(JwtAuthGuard)
export class AdminExpertisesController {
  constructor(private readonly expertises: ExpertisesService) {}

  @Get()
  list(): Promise<ExpertiseDto[]> {
    return this.expertises.list();
  }

  @Post()
  create(@Body() dto: CreateExpertiseDto): Promise<ExpertiseDto> {
    return this.expertises.create(dto);
  }

  @Put('order')
  reorder(@Body() dto: ReorderDto): Promise<ExpertiseDto[]> {
    return this.expertises.reorder(dto.ids);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateExpertiseDto): Promise<ExpertiseDto> {
    return this.expertises.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): Promise<void> {
    return this.expertises.remove(id);
  }
}
