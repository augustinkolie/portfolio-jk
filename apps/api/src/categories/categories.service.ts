import { ConflictException, Injectable } from '@nestjs/common';
import type { CategoryDto } from '@btp/shared';
import { notFound } from '../common/errors.js';
import { uniqueSlug } from '../common/slug.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { RevalidationService, Tags } from '../revalidation/revalidation.service.js';
import type { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto.js';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly revalidation: RevalidationService,
  ) {}

  async list(): Promise<CategoryDto[]> {
    const rows = await this.prisma.category.findMany({
      orderBy: { order: 'asc' },
      include: { _count: { select: { projects: { where: { published: true } } } } },
    });
    return rows.map(({ _count, ...c }) => ({ ...c, projectCount: _count.projects }));
  }

  async create(dto: CreateCategoryDto): Promise<CategoryDto> {
    const last = await this.prisma.category.aggregate({ _max: { order: true } });
    const category = await this.prisma.category.create({
      data: {
        name: dto.name,
        slug: await this.freeSlug(dto.name),
        order: (last._max.order ?? -1) + 1,
      },
    });
    await this.changed();
    return { ...category, projectCount: 0 };
  }

  /** Le slug reste inchangé au renommage : les liens filtrés (?categorie=…) restent valides. */
  async update(id: string, dto: UpdateCategoryDto): Promise<CategoryDto> {
    await this.findOrFail(id);
    await this.prisma.category.update({ where: { id }, data: { name: dto.name } });
    await this.changed();
    return this.findDto(id);
  }

  async remove(id: string): Promise<void> {
    await this.findOrFail(id);
    const used = await this.prisma.project.count({ where: { categoryId: id } });
    if (used > 0) {
      throw new ConflictException(
        `Cette catégorie contient ${used} projet${used > 1 ? 's' : ''}. Déplacez-les dans une autre catégorie avant de la supprimer.`,
      );
    }
    await this.prisma.category.delete({ where: { id } });
    await this.changed();
  }

  async reorder(ids: string[]): Promise<CategoryDto[]> {
    await this.prisma.$transaction(
      ids.map((id, order) => this.prisma.category.update({ where: { id }, data: { order } })),
    );
    await this.changed();
    return this.list();
  }

  private async changed(): Promise<void> {
    await this.revalidation.revalidate([Tags.categories, Tags.projects, Tags.expertises]);
  }

  private async findDto(id: string): Promise<CategoryDto> {
    const found = (await this.list()).find((c) => c.id === id);
    if (!found) throw notFound('Catégorie');
    return found;
  }

  private async findOrFail(id: string): Promise<void> {
    if ((await this.prisma.category.count({ where: { id } })) === 0) throw notFound('Catégorie');
  }

  private freeSlug(name: string): Promise<string> {
    return uniqueSlug(name, async (slug) => (await this.prisma.category.count({ where: { slug } })) > 0);
  }
}
