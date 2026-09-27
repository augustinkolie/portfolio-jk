import { randomUUID } from 'node:crypto';
import { BadRequestException, Injectable, PayloadTooLargeException } from '@nestjs/common';
import {
  type AdminCourseDto,
  type CourseDetailDto,
  type CourseSummaryDto,
  type Paginated,
  VIDEO_ACCEPTED_TYPES,
  VIDEO_MAX_UPLOAD_BYTES,
} from '@btp/shared';
import { fileTypeFromBuffer } from 'file-type';
import { notFound } from '../common/errors.js';
import { paginated, type PaginationQueryDto } from '../common/pagination.dto.js';
import { sanitizeRichText } from '../common/sanitize.js';
import { uniqueSlug } from '../common/slug.js';
import { MediaService } from '../media/media.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { RevalidationService, Tags } from '../revalidation/revalidation.service.js';
import { StorageService } from '../storage/storage.service.js';
import { courseInclude, toAdminCourse, toCourseDetail, toCourseSummary } from './course.mapper.js';
import type { CreateCourseDto, UpdateCourseDto } from './dto/course.dto.js';

const ORDER = [{ order: 'asc' as const }, { createdAt: 'desc' as const }];
const VIDEO_EXTENSIONS: Record<string, string> = { 'video/mp4': 'mp4', 'video/webm': 'webm' };

@Injectable()
export class CoursesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly media: MediaService,
    private readonly revalidation: RevalidationService,
  ) {}

  // ─── Lecture publique ───────────────────────────────────────────────────────

  async listPublished(query: PaginationQueryDto): Promise<Paginated<CourseSummaryDto>> {
    const where = { published: true };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.course.findMany({ where, include: courseInclude, orderBy: ORDER, skip: query.skip, take: query.limit }),
      this.prisma.course.count({ where }),
    ]);
    return paginated(rows.map((c) => toCourseSummary(c, this.storage)), total, query);
  }

  /** Adresses publiées, pour la génération statique et le sitemap. */
  async publishedSlugs(): Promise<string[]> {
    const rows = await this.prisma.course.findMany({ where: { published: true }, select: { slug: true }, orderBy: ORDER });
    return rows.map((r) => r.slug);
  }

  async findPublishedBySlug(slug: string): Promise<CourseDetailDto> {
    const course = await this.prisma.course.findFirst({ where: { slug, published: true }, include: courseInclude });
    if (!course) throw notFound('Formation');
    return toCourseDetail(course, this.storage);
  }

  // ─── Administration ─────────────────────────────────────────────────────────

  async listForAdmin(query: PaginationQueryDto): Promise<Paginated<AdminCourseDto>> {
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.course.findMany({ include: courseInclude, orderBy: ORDER, skip: query.skip, take: query.limit }),
      this.prisma.course.count(),
    ]);
    return paginated(rows.map((c) => toAdminCourse(c, this.storage)), total, query);
  }

  /** Liste courte (id, titre) pour les filtres de l'admin. */
  async options(): Promise<{ id: string; title: string }[]> {
    return this.prisma.course.findMany({ select: { id: true, title: true }, orderBy: ORDER });
  }

  async findForAdmin(id: string): Promise<AdminCourseDto> {
    return toAdminCourse(await this.findFull(id), this.storage);
  }

  async create(dto: CreateCourseDto): Promise<AdminCourseDto> {
    if (dto.published) {
      throw new BadRequestException('Enregistrez d’abord la formation, ajoutez sa photo de couverture, puis publiez-la.');
    }
    const course = await this.prisma.course.create({
      data: { ...dto, slug: await this.freeSlug(dto.slug ?? dto.title), description: sanitizeRichText(dto.description) },
      include: courseInclude,
    });
    return toAdminCourse(course, this.storage);
  }

  async update(id: string, dto: UpdateCourseDto): Promise<AdminCourseDto> {
    const existing = await this.findFull(id);
    if ((dto.published ?? existing.published) && existing.media.length === 0) {
      throw new BadRequestException('Ajoutez une photo de couverture avant de publier cette formation.');
    }
    const slug = dto.slug && dto.slug !== existing.slug ? await this.freeSlug(dto.slug, id) : existing.slug;
    const course = await this.prisma.course.update({
      where: { id },
      data: {
        ...dto,
        slug,
        description: dto.description === undefined ? undefined : sanitizeRichText(dto.description),
      },
      include: courseInclude,
    });
    if (existing.published || course.published) {
      await this.revalidation.revalidate([Tags.courses, Tags.course(existing.slug), Tags.course(course.slug)]);
    }
    return toAdminCourse(course, this.storage);
  }

  async remove(id: string): Promise<void> {
    const existing = await this.findFull(id);
    await this.media.deleteFilesFor({ type: 'course', id });
    await this.storage.deletePrefix(`courses/${id}`); // extrait vidéo et son dossier
    await this.prisma.course.delete({ where: { id } });
    if (existing.published) await this.revalidation.revalidate([Tags.courses, Tags.course(existing.slug)]);
  }

  /**
   * Extrait vidéo : type réel vérifié (MP4 ou WebM), 80 Mo au plus. Aucune conversion :
   * la vidéo est servie telle qu'envoyée et ne se charge qu'au clic sur « lecture ».
   */
  async setTeaser(id: string, file: Buffer): Promise<AdminCourseDto> {
    const existing = await this.findFull(id);
    if (file.length > VIDEO_MAX_UPLOAD_BYTES) {
      throw new PayloadTooLargeException(
        `La vidéo dépasse ${VIDEO_MAX_UPLOAD_BYTES / 1024 / 1024} Mo. Exportez-la en 720p ou raccourcissez l’extrait.`,
      );
    }
    const type = await fileTypeFromBuffer(file);
    const mime = type?.mime === 'video/x-m4v' ? 'video/mp4' : type?.mime;
    if (!mime || !(VIDEO_ACCEPTED_TYPES as readonly string[]).includes(mime)) {
      throw new BadRequestException('Format vidéo non pris en charge. Envoyez un fichier MP4 (H.264) ou WebM.');
    }

    const key = `courses/${id}/extrait-${randomUUID()}.${VIDEO_EXTENSIONS[mime]}`;
    await this.storage.put(key, file, mime);
    const course = await this.prisma.course.update({
      where: { id },
      data: { teaserKey: key, teaserMime: mime, teaserSize: file.length },
      include: courseInclude,
    });
    if (existing.teaserKey) await this.storage.deletePrefix(existing.teaserKey);
    if (course.published) await this.revalidation.revalidate([Tags.courses, Tags.course(course.slug)]);
    return toAdminCourse(course, this.storage);
  }

  async removeTeaser(id: string): Promise<AdminCourseDto> {
    const existing = await this.findFull(id);
    const course = await this.prisma.course.update({
      where: { id },
      data: { teaserKey: null, teaserMime: null, teaserSize: null },
      include: courseInclude,
    });
    if (existing.teaserKey) await this.storage.deletePrefix(existing.teaserKey);
    if (course.published) await this.revalidation.revalidate([Tags.courses, Tags.course(course.slug)]);
    return toAdminCourse(course, this.storage);
  }

  private async findFull(id: string) {
    const course = await this.prisma.course.findUnique({ where: { id }, include: courseInclude });
    if (!course) throw notFound('Formation');
    return course;
  }

  private freeSlug(base: string, exceptId?: string): Promise<string> {
    return uniqueSlug(base, async (slug) => {
      const found = await this.prisma.course.findUnique({ where: { slug }, select: { id: true } });
      return found !== null && found.id !== exceptId;
    });
  }
}
