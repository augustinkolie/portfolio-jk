import type {
  AdminProjectDto,
  ProjectDetailDto,
  ProjectLinkDto,
  ProjectSummaryDto,
} from '@btp/shared';
import type { Prisma } from '../generated/prisma/client.js';
import { toMediaDto } from '../media/media.mapper.js';
import type { StorageService } from '../storage/storage.service.js';

/**
 * Photo de couverture : la photo marquée COVER, sinon la première de la galerie.
 * L'enum PostgreSQL est trié dans l'ordre de déclaration (COVER, GALLERY, BEFORE, AFTER).
 */
export const summaryInclude = {
  category: { select: { name: true, slug: true } },
  media: { orderBy: [{ kind: 'asc' }, { order: 'asc' }], take: 1 },
} satisfies Prisma.ProjectInclude;

export const fullInclude = {
  category: { select: { id: true, name: true, slug: true } },
  media: { orderBy: { order: 'asc' } },
} satisfies Prisma.ProjectInclude;

type SummaryRow = Prisma.ProjectGetPayload<{ include: typeof summaryInclude }>;
type FullRow = Prisma.ProjectGetPayload<{ include: typeof fullInclude }>;

export function toProjectSummary(p: SummaryRow | FullRow, storage: StorageService): ProjectSummaryDto {
  const cover = p.media.find((m) => m.kind === 'COVER') ?? p.media[0] ?? null;
  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    summary: p.summary,
    location: p.location,
    year: p.year,
    size: p.size,
    duration: p.duration,
    status: p.status,
    featured: p.featured,
    category: { name: p.category.name, slug: p.category.slug },
    cover: cover ? toMediaDto(cover, storage) : null,
  };
}

export function toProjectDetail(
  p: FullRow,
  storage: StorageService,
  neighbours: { previous: ProjectLinkDto | null; next: ProjectLinkDto | null },
): ProjectDetailDto {
  return {
    ...toProjectSummary(p, storage),
    description: p.description,
    client: p.client,
    budget: p.showBudget ? p.budget : null,
    media: p.media.map((m) => toMediaDto(m, storage)),
    previous: neighbours.previous,
    next: neighbours.next,
    updatedAt: p.updatedAt.toISOString(),
  };
}

export function toAdminProject(p: FullRow, storage: StorageService): AdminProjectDto {
  return {
    ...toProjectSummary(p, storage),
    category: p.category,
    description: p.description,
    client: p.client,
    budget: p.budget,
    showBudget: p.showBudget,
    published: p.published,
    order: p.order,
    media: p.media.map((m) => toMediaDto(m, storage)),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}
