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
  Query,
  UseGuards,
} from '@nestjs/common';
import type {
  AdminProjectDto,
  Paginated,
  ProjectDetailDto,
  ProjectSummaryDto,
} from '@btp/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { PublicCache } from '../common/public-cache.js';
import {
  AdminProjectsQueryDto,
  CreateProjectDto,
  PublicProjectsQueryDto,
  UpdateProjectDto,
} from './dto/project.dto.js';
import { ProjectsService } from './projects.service.js';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Get()
  @PublicCache()
  list(@Query() query: PublicProjectsQueryDto): Promise<Paginated<ProjectSummaryDto>> {
    return this.projects.listPublished(query);
  }

  /** Années disponibles pour le filtre de /realisations. */
  @Get('years')
  @PublicCache()
  years(): Promise<number[]> {
    return this.projects.publishedYears();
  }

  /** Slugs publiés, pour la génération statique des pages projet. */
  @Get('slugs')
  @PublicCache()
  slugs(): Promise<string[]> {
    return this.projects.publishedSlugs();
  }

  @Get(':slug')
  @PublicCache()
  findOne(@Param('slug') slug: string): Promise<ProjectDetailDto> {
    return this.projects.findPublishedBySlug(slug);
  }
}

@Controller('admin/projects')
@UseGuards(JwtAuthGuard)
export class AdminProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Get()
  list(@Query() query: AdminProjectsQueryDto): Promise<Paginated<AdminProjectDto>> {
    return this.projects.listForAdmin(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<AdminProjectDto> {
    return this.projects.findForAdmin(id);
  }

  @Post()
  create(@Body() dto: CreateProjectDto): Promise<AdminProjectDto> {
    return this.projects.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProjectDto): Promise<AdminProjectDto> {
    return this.projects.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): Promise<void> {
    return this.projects.remove(id);
  }
}
