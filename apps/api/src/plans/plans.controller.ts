import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import type { AdminPlanDto, Paginated, PlanDetailDto, PlanSummaryDto } from '@btp/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { PaginationQueryDto } from '../common/pagination.dto.js';
import { PublicCache } from '../common/public-cache.js';
import { CreatePlanDto, UpdatePlanDto } from './dto/plan.dto.js';
import { PlansService } from './plans.service.js';

@Controller('plans')
export class PlansController {
  constructor(private readonly plans: PlansService) {}

  @Get()
  @PublicCache()
  list(@Query() query: PaginationQueryDto): Promise<Paginated<PlanSummaryDto>> {
    return this.plans.listPublished(query);
  }

  @Get('slugs')
  @PublicCache()
  slugs(): Promise<string[]> {
    return this.plans.publishedSlugs();
  }

  @Get(':slug')
  @PublicCache()
  findOne(@Param('slug') slug: string): Promise<PlanDetailDto> {
    return this.plans.findPublishedBySlug(slug);
  }
}

@Controller('admin/plans')
@UseGuards(JwtAuthGuard)
export class AdminPlansController {
  constructor(private readonly plans: PlansService) {}

  @Get()
  list(@Query() query: PaginationQueryDto): Promise<Paginated<AdminPlanDto>> {
    return this.plans.listForAdmin(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<AdminPlanDto> {
    return this.plans.findForAdmin(id);
  }

  @Post()
  create(@Body() dto: CreatePlanDto): Promise<AdminPlanDto> {
    return this.plans.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePlanDto): Promise<AdminPlanDto> {
    return this.plans.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): Promise<void> {
    return this.plans.remove(id);
  }
}
