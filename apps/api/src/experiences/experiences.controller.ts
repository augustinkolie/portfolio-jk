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
import type { ExperienceDto } from '@btp/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { PublicCache } from '../common/public-cache.js';
import { ReorderDto } from '../common/reorder.dto.js';
import { CreateExperienceDto, UpdateExperienceDto } from './dto/experience.dto.js';
import { ExperiencesService } from './experiences.service.js';

@Controller('experiences')
export class ExperiencesController {
  constructor(private readonly experiences: ExperiencesService) {}

  @Get()
  @PublicCache()
  list(): Promise<ExperienceDto[]> {
    return this.experiences.list();
  }
}

@Controller('admin/experiences')
@UseGuards(JwtAuthGuard)
export class AdminExperiencesController {
  constructor(private readonly experiences: ExperiencesService) {}

  @Get()
  list(): Promise<ExperienceDto[]> {
    return this.experiences.list();
  }

  @Post()
  create(@Body() dto: CreateExperienceDto): Promise<ExperienceDto> {
    return this.experiences.create(dto);
  }

  @Put('order')
  reorder(@Body() dto: ReorderDto): Promise<ExperienceDto[]> {
    return this.experiences.reorder(dto.ids);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateExperienceDto): Promise<ExperienceDto> {
    return this.experiences.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): Promise<void> {
    return this.experiences.remove(id);
  }
}
