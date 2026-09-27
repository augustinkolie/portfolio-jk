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
import { Throttle } from '@nestjs/throttler';
import {
  type AdminCourseDto,
  type CourseDetailDto,
  type CourseSummaryDto,
  type EnrollmentDto,
  type Paginated,
  VIDEO_MAX_UPLOAD_BYTES,
} from '@btp/shared';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { PaginationQueryDto } from '../common/pagination.dto.js';
import { PublicCache } from '../common/public-cache.js';
import { CoursesService } from './courses.service.js';
import {
  CreateCourseDto,
  CreateEnrollmentDto,
  EnrollmentsQueryDto,
  UpdateCourseDto,
  UpdateEnrollmentDto,
} from './dto/course.dto.js';
import { EnrollmentsService } from './enrollments.service.js';

/** Message clair quand multer refuse une vidéo trop lourde. */
@Catch(PayloadTooLargeException)
class VideoTooLargeFilter implements ExceptionFilter {
  catch(_exception: PayloadTooLargeException, host: ArgumentsHost): void {
    host
      .switchToHttp()
      .getResponse<Response>()
      .status(HttpStatus.PAYLOAD_TOO_LARGE)
      .json({
        statusCode: HttpStatus.PAYLOAD_TOO_LARGE,
        error: 'Payload Too Large',
        message: `La vidéo dépasse ${VIDEO_MAX_UPLOAD_BYTES / 1024 / 1024} Mo. Exportez-la en 720p ou raccourcissez l’extrait.`,
      });
  }
}

@Controller('courses')
export class CoursesController {
  constructor(private readonly courses: CoursesService) {}

  @Get()
  @PublicCache()
  list(@Query() query: PaginationQueryDto): Promise<Paginated<CourseSummaryDto>> {
    return this.courses.listPublished(query);
  }

  @Get('slugs')
  @PublicCache()
  slugs(): Promise<string[]> {
    return this.courses.publishedSlugs();
  }

  @Get(':slug')
  @PublicCache()
  findOne(@Param('slug') slug: string): Promise<CourseDetailDto> {
    return this.courses.findPublishedBySlug(slug);
  }
}

@Controller('enrollments')
export class EnrollmentsController {
  constructor(private readonly enrollments: EnrollmentsService) {}

  /** 5 demandes par quart d'heure et par adresse IP. */
  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: { limit: 5, ttl: 15 * 60_000 } })
  create(@Body() dto: CreateEnrollmentDto): Promise<void> {
    return this.enrollments.create(dto);
  }
}

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminCoursesController {
  constructor(
    private readonly courses: CoursesService,
    private readonly enrollments: EnrollmentsService,
  ) {}

  @Get('courses')
  list(@Query() query: PaginationQueryDto): Promise<Paginated<AdminCourseDto>> {
    return this.courses.listForAdmin(query);
  }

  @Get('courses/options')
  options(): Promise<{ id: string; title: string }[]> {
    return this.courses.options();
  }

  @Get('courses/:id')
  findOne(@Param('id') id: string): Promise<AdminCourseDto> {
    return this.courses.findForAdmin(id);
  }

  @Post('courses')
  create(@Body() dto: CreateCourseDto): Promise<AdminCourseDto> {
    return this.courses.create(dto);
  }

  @Patch('courses/:id')
  update(@Param('id') id: string, @Body() dto: UpdateCourseDto): Promise<AdminCourseDto> {
    return this.courses.update(id, dto);
  }

  @Delete('courses/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): Promise<void> {
    return this.courses.remove(id);
  }

  @Post('courses/:id/teaser')
  @UseFilters(VideoTooLargeFilter)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: VIDEO_MAX_UPLOAD_BYTES, files: 1 } }))
  setTeaser(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File | undefined,
  ): Promise<AdminCourseDto> {
    if (!file) throw new BadRequestException('Aucune vidéo reçue. Choisissez un fichier et réessayez.');
    return this.courses.setTeaser(id, file.buffer);
  }

  @Delete('courses/:id/teaser')
  removeTeaser(@Param('id') id: string): Promise<AdminCourseDto> {
    return this.courses.removeTeaser(id);
  }

  @Get('enrollments')
  listEnrollments(@Query() query: EnrollmentsQueryDto): Promise<Paginated<EnrollmentDto>> {
    return this.enrollments.list(query);
  }

  @Patch('enrollments/:id')
  updateEnrollment(@Param('id') id: string, @Body() dto: UpdateEnrollmentDto): Promise<EnrollmentDto> {
    return this.enrollments.update(id, dto);
  }

  @Delete('enrollments/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeEnrollment(@Param('id') id: string): Promise<void> {
    return this.enrollments.remove(id);
  }
}
