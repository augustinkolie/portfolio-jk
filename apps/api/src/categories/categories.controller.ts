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
import type { CategoryDto } from '@btp/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { PublicCache } from '../common/public-cache.js';
import { ReorderDto } from '../common/reorder.dto.js';
import { CategoriesService } from './categories.service.js';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto.js';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  @PublicCache()
  list(): Promise<CategoryDto[]> {
    return this.categories.list();
  }
}

@Controller('admin/categories')
@UseGuards(JwtAuthGuard)
export class AdminCategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  list(): Promise<CategoryDto[]> {
    return this.categories.list();
  }

  @Post()
  create(@Body() dto: CreateCategoryDto): Promise<CategoryDto> {
    return this.categories.create(dto);
  }

  @Put('order')
  reorder(@Body() dto: ReorderDto): Promise<CategoryDto[]> {
    return this.categories.reorder(dto.ids);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto): Promise<CategoryDto> {
    return this.categories.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): Promise<void> {
    return this.categories.remove(id);
  }
}
