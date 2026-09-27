import {
  ArgumentsHost,
  BadRequestException,
  Body,
  Catch,
  Controller,
  Delete,
  ExceptionFilter,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  PayloadTooLargeException,
  Post,
  Put,
  UploadedFile,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { IMAGE_MAX_UPLOAD_BYTES, type MediaDto } from '@btp/shared';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { ReorderDto } from '../common/reorder.dto.js';
import { UpdateMediaDto, UploadMediaDto } from './dto/media.dto.js';
import { MediaService } from './media.service.js';

/** Remplace le message anglais de multer (« File too large ») par une consigne claire. */
@Catch(PayloadTooLargeException)
class FileTooLargeFilter implements ExceptionFilter {
  catch(_exception: PayloadTooLargeException, host: ArgumentsHost): void {
    host
      .switchToHttp()
      .getResponse<Response>()
      .status(HttpStatus.PAYLOAD_TOO_LARGE)
      .json({
        statusCode: HttpStatus.PAYLOAD_TOO_LARGE,
        error: 'Payload Too Large',
        message: `La photo dépasse ${IMAGE_MAX_UPLOAD_BYTES / 1024 / 1024} Mo. Réduisez-la avant de l'envoyer.`,
      });
  }
}

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class MediaController {
  constructor(private readonly media: MediaService) {}

  @Post('media')
  @UseFilters(FileTooLargeFilter)
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: IMAGE_MAX_UPLOAD_BYTES, files: 1 } }),
  )
  upload(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: UploadMediaDto,
  ): Promise<MediaDto> {
    if (!file) throw new BadRequestException('Aucune photo reçue. Choisissez un fichier et réessayez.');
    return this.media.upload(file.buffer, dto);
  }

  @Patch('media/:id')
  update(@Param('id') id: string, @Body() dto: UpdateMediaDto): Promise<MediaDto> {
    return this.media.update(id, dto);
  }

  @Delete('media/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): Promise<void> {
    return this.media.remove(id);
  }

  @Put('projects/:id/media/order')
  reorderProject(@Param('id') id: string, @Body() dto: ReorderDto): Promise<MediaDto[]> {
    return this.media.reorder({ type: 'project', id }, dto.ids);
  }

  @Put('courses/:id/media/order')
  reorderCourse(@Param('id') id: string, @Body() dto: ReorderDto): Promise<MediaDto[]> {
    return this.media.reorder({ type: 'course', id }, dto.ids);
  }

  @Put('plans/:id/media/order')
  reorderPlan(@Param('id') id: string, @Body() dto: ReorderDto): Promise<MediaDto[]> {
    return this.media.reorder({ type: 'plan', id }, dto.ids);
  }
}
