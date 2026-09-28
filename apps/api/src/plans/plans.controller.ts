import {
  ArgumentsHost,
  BadRequestException,
  Body,
  Catch,
  Controller,
  Delete,
  ExceptionFilter,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  PayloadTooLargeException,
  Post,
  Query,
  UploadedFile,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  type AdminPlanDto,
  type Paginated,
  PDF_MAX_UPLOAD_BYTES,
  type PlanDetailDto,
  type PlanSummaryDto,
} from '@btp/shared';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { PaginationQueryDto } from '../common/pagination.dto.js';
import { PublicCache } from '../common/public-cache.js';
import { CreatePlanDto, UpdatePlanDto } from './dto/plan.dto.js';
import { PlansService } from './plans.service.js';

/** Message clair quand multer refuse un PDF trop lourd. */
@Catch(PayloadTooLargeException)
class PdfTooLargeFilter implements ExceptionFilter {
  catch(_exception: PayloadTooLargeException, host: ArgumentsHost): void {
    host
      .switchToHttp()
      .getResponse<Response>()
      .status(HttpStatus.PAYLOAD_TOO_LARGE)
      .json({
        statusCode: HttpStatus.PAYLOAD_TOO_LARGE,
        error: 'Payload Too Large',
        message: `Le PDF dépasse ${PDF_MAX_UPLOAD_BYTES / 1024 / 1024} Mo. Réduisez-le (impression PDF en qualité « standard ») ou séparez-le.`,
      });
  }
}

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

  /** Champ « pages » facultatif : nombre de pages lu par pdf.js dans l'admin. */
  @Post(':id/document')
  @UseFilters(PdfTooLargeFilter)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: PDF_MAX_UPLOAD_BYTES, files: 1 } }))
  setDocument(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body('pages') pages?: string,
  ): Promise<AdminPlanDto> {
    if (!file) throw new BadRequestException('Aucun PDF reçu. Choisissez un fichier et réessayez.');
    // multer lit le nom du fichier en latin1 : on le relit en UTF-8 pour garder les accents.
    const name = Buffer.from(file.originalname, 'latin1').toString('utf8');
    return this.plans.setDocument(id, file.buffer, name, pages ? Number.parseInt(pages, 10) : undefined);
  }

  @Delete(':id/document')
  removeDocument(@Param('id') id: string): Promise<AdminPlanDto> {
    return this.plans.removeDocument(id);
  }
}
