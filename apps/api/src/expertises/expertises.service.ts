import { BadRequestException, Injectable } from '@nestjs/common';
import type { ExpertiseDetailDto, ExpertiseDto } from '@btp/shared';
import { notFound } from '../common/errors.js';
import { uniqueSlug } from '../common/slug.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { summaryInclude, toProjectSummary } from '../projects/project.mapper.js';
import {
  PROJECT_ORDER,
  RevalidationService,
  Tags,
} from '../revalidation/revalidation.service.js';
import { StorageService } from '../storage/storage.service.js';
import type { CreateExpertiseDto, UpdateExpertiseDto } from './dto/expertise.dto.js';

const include = { category: { select: { id: true, name: true, slug: true } } } as const;
const PROJECTS_PER_EXPERTISE = 24;

@Injectable()
export class ExpertisesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly revalidation: RevalidationService,
  ) {}

  list(): Promise<ExpertiseDto[]> {
    return this.prisma.expertise.findMany({ orderBy: { order: 'asc' }, include });
  }

  async findBySlug(slug: string): Promise<ExpertiseDetailDto> {
    const expertise = await this.prisma.expertise.findUnique({ where: { slug }, include });
    if (!expertise) throw notFound('Domaine d’intervention');

    const projects = expertise.categoryId
      ? await this.prisma.project.findMany({
          where: { published: true, categoryId: expertise.categoryId },
          include: summaryInclude,
          orderBy: PROJECT_ORDER,
          take: PROJECTS_PER_EXPERTISE,
        })
      : [];
    return { ...expertise, projects: projects.map((p) => toProjectSummary(p, this.storage)) };
  }

  async create(dto: CreateExpertiseDto): Promise<ExpertiseDto> {
    await this.assertCategory(dto.categoryId);
    const last = await this.prisma.expertise.aggregate({ _max: { order: true } });
    const expertise = await this.prisma.expertise.create({
      data: {
        name: dto.name,
        description: dto.description,
        categoryId: dto.categoryId ?? null,
        slug: await uniqueSlug(dto.name, async (s) => (await this.prisma.expertise.count({ where: { slug: s } })) > 0),
        order: (last._max.order ?? -1) + 1,
      },
      include,
    });
    await this.changed();
    return expertise;
  }

  async update(id: string, dto: UpdateExpertiseDto): Promise<ExpertiseDto> {
    await this.findOrFail(id);
    await this.assertCategory(dto.categoryId);
    const expertise = await this.prisma.expertise.update({ where: { id }, data: dto, include });
    await this.changed();
    return expertise;
  }

  async remove(id: string): Promise<void> {
    await this.findOrFail(id);
    await this.prisma.expertise.delete({ where: { id } });
    await this.changed();
  }

  async reorder(ids: string[]): Promise<ExpertiseDto[]> {
    await this.prisma.$transaction(
      ids.map((id, order) => this.prisma.expertise.update({ where: { id }, data: { order } })),
    );
    await this.changed();
    return this.list();
  }

  private async changed(): Promise<void> {
    await this.revalidation.revalidate([Tags.expertises]);
  }

  private async findOrFail(id: string): Promise<void> {
    if ((await this.prisma.expertise.count({ where: { id } })) === 0) {
      throw notFound('Domaine d’intervention');
    }
  }

  private async assertCategory(categoryId: string | null | undefined): Promise<void> {
    if (!categoryId) return;
    if ((await this.prisma.category.count({ where: { id: categoryId } })) === 0) {
      throw new BadRequestException('La catégorie choisie n’existe plus. Rechargez la page.');
    }
  }
}
