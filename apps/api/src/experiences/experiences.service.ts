import { Injectable } from '@nestjs/common';
import type { ExperienceDto } from '@btp/shared';
import { notFound } from '../common/errors.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { RevalidationService, Tags } from '../revalidation/revalidation.service.js';
import type { CreateExperienceDto, UpdateExperienceDto } from './dto/experience.dto.js';

@Injectable()
export class ExperiencesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly revalidation: RevalidationService,
  ) {}

  list(): Promise<ExperienceDto[]> {
    return this.prisma.experience.findMany({ orderBy: { order: 'asc' } });
  }

  async create(dto: CreateExperienceDto): Promise<ExperienceDto> {
    const last = await this.prisma.experience.aggregate({ _max: { order: true } });
    const experience = await this.prisma.experience.create({
      data: { ...dto, order: (last._max.order ?? -1) + 1 },
    });
    await this.changed();
    return experience;
  }

  async update(id: string, dto: UpdateExperienceDto): Promise<ExperienceDto> {
    await this.findOrFail(id);
    const experience = await this.prisma.experience.update({ where: { id }, data: dto });
    await this.changed();
    return experience;
  }

  async remove(id: string): Promise<void> {
    await this.findOrFail(id);
    await this.prisma.experience.delete({ where: { id } });
    await this.changed();
  }

  async reorder(ids: string[]): Promise<ExperienceDto[]> {
    await this.prisma.$transaction(
      ids.map((id, order) => this.prisma.experience.update({ where: { id }, data: { order } })),
    );
    await this.changed();
    return this.list();
  }

  private async changed(): Promise<void> {
    await this.revalidation.revalidate([Tags.experiences]);
  }

  private async findOrFail(id: string): Promise<void> {
    if ((await this.prisma.experience.count({ where: { id } })) === 0) throw notFound('Expérience');
  }
}
