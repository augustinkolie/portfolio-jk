import type { AdminCourseDto, CourseDetailDto, CourseSummaryDto } from '@btp/shared';
import type { Prisma } from '../generated/prisma/client.js';
import { toMediaDto } from '../media/media.mapper.js';
import type { StorageService } from '../storage/storage.service.js';

export const courseInclude = {
  media: { orderBy: { order: 'asc' } },
  _count: { select: { enrollments: true } },
} satisfies Prisma.CourseInclude;

type CourseRow = Prisma.CourseGetPayload<{ include: typeof courseInclude }>;

export function toCourseSummary(c: CourseRow, storage: StorageService): CourseSummaryDto {
  const cover = c.media.find((m) => m.kind === 'COVER') ?? c.media[0] ?? null;
  return {
    id: c.id,
    title: c.title,
    slug: c.slug,
    software: c.software,
    level: c.level,
    format: c.format,
    summary: c.summary,
    duration: c.duration,
    price: c.price,
    nextSession: c.nextSession,
    cover: cover ? toMediaDto(cover, storage) : null,
    hasTeaser: c.teaserKey !== null,
  };
}

export function toCourseDetail(c: CourseRow, storage: StorageService): CourseDetailDto {
  return {
    ...toCourseSummary(c, storage),
    description: c.description,
    location: c.location,
    teaser:
      c.teaserKey && c.teaserMime
        ? { url: storage.publicUrl(c.teaserKey), mime: c.teaserMime, size: c.teaserSize ?? 0 }
        : null,
    media: c.media.map((m) => toMediaDto(m, storage)),
    updatedAt: c.updatedAt.toISOString(),
  };
}

export function toAdminCourse(c: CourseRow, storage: StorageService): AdminCourseDto {
  return {
    ...toCourseDetail(c, storage),
    published: c.published,
    order: c.order,
    enrollmentCount: c._count.enrollments,
    createdAt: c.createdAt.toISOString(),
  };
}
