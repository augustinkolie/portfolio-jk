import { randomUUID } from 'node:crypto';
import { BadRequestException, Injectable, PayloadTooLargeException } from '@nestjs/common';
import {
  type AdminPlanDto,
  type Paginated,
  PDF_MAX_UPLOAD_BYTES,
  type PlanDetailDto,
  type PlanSummaryDto,
} from '@btp/shared';
import { fileTypeFromBuffer } from 'file-type';
import { notFound } from '../common/errors.js';
import { paginated, type PaginationQueryDto } from '../common/pagination.dto.js';
import { sanitizeRichText } from '../common/sanitize.js';
import { uniqueSlug } from '../common/slug.js';
import type { Prisma } from '../generated/prisma/client.js';
import { toMediaDto } from '../media/media.mapper.js';
import { MediaService } from '../media/media.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { RevalidationService, Tags } from '../revalidation/revalidation.service.js';
import { StorageService } from '../storage/storage.service.js';
import type { CreatePlanDto, UpdatePlanDto } from './dto/plan.dto.js';

const include = { media: { orderBy: { order: 'asc' } } } satisfies Prisma.PlanInclude;
type PlanRow = Prisma.PlanGetPayload<{ include: typeof include }>;
const ORDER = [{ order: 'asc' as const }, { createdAt: 'desc' as const }];

@Injectable()
export class PlansService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly media: MediaService,
    private readonly revalidation: RevalidationService,
  ) {}

  async listPublished(query: PaginationQueryDto): Promise<Paginated<PlanSummaryDto>> {
    const where = { published: true };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.plan.findMany({ where, include, orderBy: ORDER, skip: query.skip, take: query.limit }),
      this.prisma.plan.count({ where }),
    ]);
    return paginated(rows.map((p) => this.toSummary(p)), total, query);
  }

  /** Adresses publiées, pour la génération statique et le sitemap. */
  async publishedSlugs(): Promise<string[]> {
    const rows = await this.prisma.plan.findMany({ where: { published: true }, select: { slug: true }, orderBy: ORDER });
    return rows.map((r) => r.slug);
  }

  async findPublishedBySlug(slug: string): Promise<PlanDetailDto> {
    const plan = await this.prisma.plan.findFirst({ where: { slug, published: true }, include });
    if (!plan) throw notFound('Plan');
    return this.toDetail(plan);
  }

  async listForAdmin(query: PaginationQueryDto): Promise<Paginated<AdminPlanDto>> {
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.plan.findMany({ include, orderBy: ORDER, skip: query.skip, take: query.limit }),
      this.prisma.plan.count(),
    ]);
    return paginated(rows.map((p) => this.toAdmin(p)), total, query);
  }

  async findForAdmin(id: string): Promise<AdminPlanDto> {
    return this.toAdmin(await this.findFull(id));
  }

  async create(dto: CreatePlanDto): Promise<AdminPlanDto> {
    if (dto.published) {
      throw new BadRequestException('Enregistrez d’abord le plan, ajoutez ses images, puis publiez-le.');
    }
    const plan = await this.prisma.plan.create({
      data: { ...dto, slug: await this.freeSlug(dto.slug ?? dto.title), description: sanitizeRichText(dto.description) },
      include,
    });
    return this.toAdmin(plan);
  }

  async update(id: string, dto: UpdatePlanDto): Promise<AdminPlanDto> {
    const existing = await this.findFull(id);
    if ((dto.published ?? existing.published) && existing.media.length === 0) {
      throw new BadRequestException('Ajoutez au moins une image du plan avant de le publier.');
    }
    const slug = dto.slug && dto.slug !== existing.slug ? await this.freeSlug(dto.slug, id) : existing.slug;
    const plan = await this.prisma.plan.update({
      where: { id },
      data: {
        ...dto,
        slug,
        description: dto.description === undefined ? undefined : sanitizeRichText(dto.description),
      },
      include,
    });
    if (existing.published || plan.published) {
      await this.revalidation.revalidate([Tags.plans, Tags.plan(existing.slug), Tags.plan(plan.slug)]);
    }
    return this.toAdmin(plan);
  }

  async remove(id: string): Promise<void> {
    const existing = await this.findFull(id);
    await this.media.deleteFilesFor({ type: 'plan', id });
    await this.storage.deletePrefix(`plans/${id}`); // dossier PDF
    await this.prisma.plan.delete({ where: { id } });
    if (existing.published) await this.revalidation.revalidate([Tags.plans, Tags.plan(existing.slug)]);
  }

  /**
   * Dossier PDF du plan : type réel vérifié (pas seulement l'extension), 30 Mo au plus.
   * Le nombre de pages est lu par l'admin (pdf.js) lors de la création de l'aperçu.
   */
  async setDocument(id: string, file: Buffer, originalName: string, pages?: number): Promise<AdminPlanDto> {
    const existing = await this.findFull(id);
    if (file.length > PDF_MAX_UPLOAD_BYTES) {
      throw new PayloadTooLargeException(
        `Le PDF dépasse ${PDF_MAX_UPLOAD_BYTES / 1024 / 1024} Mo. Réduisez-le (impression PDF en qualité « standard ») ou séparez-le.`,
      );
    }
    const type = await fileTypeFromBuffer(file);
    if (type?.mime !== 'application/pdf') {
      throw new BadRequestException(
        'Ce fichier n’est pas un PDF. Pour un fichier Word, Excel ou AutoCAD, exportez-le d’abord en PDF.',
      );
    }
    const key = `plans/${id}/plan-${randomUUID()}.pdf`;
    await this.storage.put(key, file, 'application/pdf');
    const plan = await this.prisma.plan.update({
      where: { id },
      data: {
        documentKey: key,
        documentName: cleanFileName(originalName),
        documentSize: file.length,
        documentPages: pages && pages > 0 && pages < 10_000 ? Math.round(pages) : null,
      },
      include,
    });
    if (existing.documentKey) await this.storage.deletePrefix(existing.documentKey);
    if (plan.published) await this.revalidation.revalidate([Tags.plans, Tags.plan(plan.slug)]);
    return this.toAdmin(plan);
  }

  async removeDocument(id: string): Promise<AdminPlanDto> {
    const existing = await this.findFull(id);
    const plan = await this.prisma.plan.update({
      where: { id },
      data: { documentKey: null, documentName: null, documentSize: null, documentPages: null },
      include,
    });
    if (existing.documentKey) await this.storage.deletePrefix(existing.documentKey);
    if (plan.published) await this.revalidation.revalidate([Tags.plans, Tags.plan(plan.slug)]);
    return this.toAdmin(plan);
  }

  private toSummary(p: PlanRow): PlanSummaryDto {
    const cover = p.media.find((m) => m.kind === 'COVER') ?? p.media[0] ?? null;
    return {
      id: p.id,
      title: p.title,
      slug: p.slug,
      planType: p.planType,
      levels: p.levels,
      surface: p.surface,
      bedrooms: p.bedrooms,
      summary: p.summary,
      cover: cover ? toMediaDto(cover, this.storage) : null,
      hasDocument: p.documentKey !== null,
    };
  }

  private toDetail(p: PlanRow): PlanDetailDto {
    return {
      ...this.toSummary(p),
      description: p.description,
      document: p.documentKey
        ? {
            url: this.storage.publicUrl(p.documentKey),
            name: p.documentName ?? 'plan.pdf',
            size: p.documentSize ?? 0,
            pages: p.documentPages,
          }
        : null,
      media: p.media.map((m) => toMediaDto(m, this.storage)),
      updatedAt: p.updatedAt.toISOString(),
    };
  }

  private toAdmin(p: PlanRow): AdminPlanDto {
    return { ...this.toDetail(p), published: p.published, order: p.order, createdAt: p.createdAt.toISOString() };
  }

  private async findFull(id: string) {
    const plan = await this.prisma.plan.findUnique({ where: { id }, include });
    if (!plan) throw notFound('Plan');
    return plan;
  }

  private freeSlug(base: string, exceptId?: string): Promise<string> {
    return uniqueSlug(base, async (slug) => {
      const found = await this.prisma.plan.findUnique({ where: { slug }, select: { id: true } });
      return found !== null && found.id !== exceptId;
    });
  }
}

/** Nom affiché du fichier : sans chemin, sans caractères de contrôle, 120 caractères au plus. */
function cleanFileName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? 'plan.pdf';
  const clean = base.replace(/[\u0000-\u001f<>:"|?*]/g, '').trim().slice(0, 120);
  return clean.toLowerCase().endsWith('.pdf') ? clean : `${clean || 'plan'}.pdf`;
}
