import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { type EnrollmentDto, normalizePhone, type Paginated } from '@btp/shared';
import { notFound } from '../common/errors.js';
import { paginated } from '../common/pagination.dto.js';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateEnrollmentDto, EnrollmentsQueryDto, UpdateEnrollmentDto } from './dto/course.dto.js';

const include = { course: { select: { id: true, title: true, slug: true } } } satisfies Prisma.EnrollmentInclude;
type Row = Prisma.EnrollmentGetPayload<{ include: typeof include }>;

function toDto(e: Row): EnrollmentDto {
  return {
    id: e.id,
    course: e.course,
    name: e.name,
    phone: e.phone,
    email: e.email,
    message: e.message,
    status: e.status,
    createdAt: e.createdAt.toISOString(),
  };
}

@Injectable()
export class EnrollmentsService {
  private readonly logger = new Logger(EnrollmentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateEnrollmentDto): Promise<void> {
    // Robot détecté : réponse identique à un succès, rien n'est enregistré.
    if (dto.website) {
      this.logger.log('Inscription ignorée : champ piège rempli.');
      return;
    }
    const course = await this.prisma.course.findFirst({ where: { id: dto.courseId, published: true }, select: { id: true } });
    if (!course) throw new BadRequestException('Cette formation n’est plus proposée. Rechargez la page.');
    await this.prisma.enrollment.create({
      data: {
        courseId: dto.courseId,
        name: dto.name,
        phone: normalizePhone(dto.phone),
        email: dto.email ?? null,
        message: dto.message ?? null,
      },
    });
  }

  async list(query: EnrollmentsQueryDto): Promise<Paginated<EnrollmentDto>> {
    const where: Prisma.EnrollmentWhereInput = { status: query.status, courseId: query.courseId };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.enrollment.findMany({ where, include, orderBy: { createdAt: 'desc' }, skip: query.skip, take: query.limit }),
      this.prisma.enrollment.count({ where }),
    ]);
    return paginated(rows.map(toDto), total, query);
  }

  async update(id: string, dto: UpdateEnrollmentDto): Promise<EnrollmentDto> {
    await this.findOrFail(id);
    return toDto(await this.prisma.enrollment.update({ where: { id }, data: dto, include }));
  }

  async remove(id: string): Promise<void> {
    await this.findOrFail(id);
    await this.prisma.enrollment.delete({ where: { id } });
  }

  private async findOrFail(id: string): Promise<void> {
    if ((await this.prisma.enrollment.count({ where: { id } })) === 0) throw notFound('Inscription');
  }
}
