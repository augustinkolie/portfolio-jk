import { BadRequestException, Injectable } from '@nestjs/common';
import type {
  AdminProjectDto,
  Paginated,
  ProjectDetailDto,
  ProjectLinkDto,
  ProjectSummaryDto,
} from '@btp/shared';
import { notFound } from '../common/errors.js';
import { paginated } from '../common/pagination.dto.js';
import { sanitizeRichText } from '../common/sanitize.js';
import { uniqueSlug } from '../common/slug.js';
import type { Prisma } from '../generated/prisma/client.js';
import { MediaService } from '../media/media.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { PROJECT_ORDER, RevalidationService } from '../revalidation/revalidation.service.js';
import { StorageService } from '../storage/storage.service.js';
import type {
  AdminProjectsQueryDto,
  CreateProjectDto,
  PublicProjectsQueryDto,
  UpdateProjectDto,
} from './dto/project.dto.js';
import {
  fullInclude,
  summaryInclude,
  toAdminProject,
  toProjectDetail,
  toProjectSummary,
} from './project.mapper.js';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly media: MediaService,
    private readonly revalidation: RevalidationService,
  ) {}

  // ─── Lecture publique (projets publiés uniquement) ──────────────────────────

  async listPublished(query: PublicProjectsQueryDto): Promise<Paginated<ProjectSummaryDto>> {
    const where: Prisma.ProjectWhereInput = {
      published: true,
      category: query.category ? { slug: query.category } : undefined,
      year: query.year,
      featured: query.featured,
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.project.findMany({
        where,
        include: summaryInclude,
        orderBy: PROJECT_ORDER,
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.project.count({ where }),
    ]);
    return paginated(
      rows.map((p) => toProjectSummary(p, this.storage)),
      total,
      query,
    );
  }

  async publishedYears(): Promise<number[]> {
    const rows = await this.prisma.project.findMany({
      where: { published: true },
      distinct: ['year'],
      select: { year: true },
      orderBy: { year: 'desc' },
    });
    return rows.map((r) => r.year);
  }

  publishedSlugs(): Promise<string[]> {
    return this.revalidation.publishedSlugsInOrder();
  }

  async findPublishedBySlug(slug: string): Promise<ProjectDetailDto> {
    const project = await this.prisma.project.findFirst({
      where: { slug, published: true },
      include: fullInclude,
    });
    if (!project) throw notFound('Projet');

    const order = await this.prisma.project.findMany({
      where: { published: true },
      orderBy: PROJECT_ORDER,
      select: { slug: true, title: true },
    });
    const i = order.findIndex((p) => p.slug === slug);
    const link = (p: ProjectLinkDto | undefined): ProjectLinkDto | null =>
      p ? { slug: p.slug, title: p.title } : null;

    return toProjectDetail(project, this.storage, {
      previous: link(order[i - 1]),
      next: link(order[i + 1]),
    });
  }

  // ─── Administration ─────────────────────────────────────────────────────────

  async listForAdmin(query: AdminProjectsQueryDto): Promise<Paginated<AdminProjectDto>> {
    const contains = query.q ? { contains: query.q, mode: 'insensitive' as const } : undefined;
    const where: Prisma.ProjectWhereInput = {
      published: query.published,
      categoryId: query.categoryId,
      OR: contains
        ? [{ title: contains }, { location: contains }, { client: contains }]
        : undefined,
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.project.findMany({
        where,
        include: fullInclude,
        orderBy: PROJECT_ORDER,
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.project.count({ where }),
    ]);
    return paginated(
      rows.map((p) => toAdminProject(p, this.storage)),
      total,
      query,
    );
  }

  async findForAdmin(id: string): Promise<AdminProjectDto> {
    return toAdminProject(await this.findFull(id), this.storage);
  }

  async create(dto: CreateProjectDto): Promise<AdminProjectDto> {
    await this.assertCategoryExists(dto.categoryId);
    if (dto.published) {
      throw new BadRequestException(
        'Enregistrez d’abord le projet en brouillon et ajoutez ses photos, puis publiez-le.',
      );
    }
    const slug = await this.freeSlug(dto.slug ?? dto.title);
    const project = await this.prisma.project.create({
      data: { ...dto, slug, description: sanitizeRichText(dto.description) },
      include: fullInclude,
    });
    return toAdminProject(project, this.storage);
  }

  async update(id: string, dto: UpdateProjectDto): Promise<AdminProjectDto> {
    const existing = await this.findFull(id);
    if (dto.categoryId) await this.assertCategoryExists(dto.categoryId);

    const willBePublished = dto.published ?? existing.published;
    if (willBePublished && existing.media.length === 0) {
      throw new BadRequestException('Ajoutez au moins une photo avant de publier ce projet.');
    }

    // Le slug ne change que sur demande explicite : les liens déjà partagés restent valides.
    const slug =
      dto.slug && dto.slug !== existing.slug ? await this.freeSlug(dto.slug, id) : existing.slug;

    const before = await this.revalidation.publishedSlugsInOrder();
    const project = await this.prisma.project.update({
      where: { id },
      data: {
        ...dto,
        slug,
        description: dto.description === undefined ? undefined : sanitizeRichText(dto.description),
      },
      include: fullInclude,
    });

    if (existing.published || project.published) {
      const after = await this.revalidation.publishedSlugsInOrder();
      await this.revalidation.revalidate(
        this.revalidation.projectTags([existing.slug, project.slug], before, after),
      );
    }
    return toAdminProject(project, this.storage);
  }

  async remove(id: string): Promise<void> {
    const existing = await this.findFull(id);
    const before = await this.revalidation.publishedSlugsInOrder();
    await this.media.deleteFilesFor({ type: 'project', id });
    await this.prisma.project.delete({ where: { id } });
    if (existing.published) {
      const after = await this.revalidation.publishedSlugsInOrder();
      await this.revalidation.revalidate(
        this.revalidation.projectTags([existing.slug], before, after),
      );
    }
  }

  private async findFull(id: string) {
    const project = await this.prisma.project.findUnique({ where: { id }, include: fullInclude });
    if (!project) throw notFound('Projet');
    return project;
  }

  private freeSlug(base: string, exceptId?: string): Promise<string> {
    return uniqueSlug(base, async (slug) => {
      const found = await this.prisma.project.findUnique({ where: { slug }, select: { id: true } });
      return found !== null && found.id !== exceptId;
    });
  }

  private async assertCategoryExists(categoryId: string): Promise<void> {
    const count = await this.prisma.category.count({ where: { id: categoryId } });
    if (count === 0) throw new BadRequestException('La catégorie choisie n’existe plus. Rechargez la page.');
  }
}
