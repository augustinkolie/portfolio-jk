import { Injectable, Logger } from '@nestjs/common';
import {
  type ContactMessageDto,
  type DashboardDto,
  normalizePhone,
  type Paginated,
} from '@btp/shared';
import { notFound } from '../common/errors.js';
import { paginated } from '../common/pagination.dto.js';
import type { ContactMessage } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  CreateContactMessageDto,
  MessagesQueryDto,
  UpdateMessageDto,
} from './dto/message.dto.js';

function toDto(m: ContactMessage): ContactMessageDto {
  return { ...m, createdAt: m.createdAt.toISOString() };
}

@Injectable()
export class MessagesService {
  private readonly logger = new Logger(MessagesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateContactMessageDto): Promise<void> {
    // Robot détecté : on répond comme si tout allait bien, sans rien enregistrer.
    if (dto.website) {
      this.logger.log('Message ignoré : champ piège rempli.');
      return;
    }
    const { website: _honeypot, ...data } = dto;
    await this.prisma.contactMessage.create({
      data: { ...data, phone: normalizePhone(dto.phone) },
    });
  }

  async list(query: MessagesQueryDto): Promise<Paginated<ContactMessageDto>> {
    const where = { status: query.status };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.contactMessage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.contactMessage.count({ where }),
    ]);
    return paginated(rows.map(toDto), total, query);
  }

  /** Ouvrir un message nouveau le marque comme lu. */
  async open(id: string): Promise<ContactMessageDto> {
    const message = await this.prisma.contactMessage.findUnique({ where: { id } });
    if (!message) throw notFound('Message');
    if (message.status !== 'NEW') return toDto(message);
    return toDto(
      await this.prisma.contactMessage.update({ where: { id }, data: { status: 'READ' } }),
    );
  }

  async update(id: string, dto: UpdateMessageDto): Promise<ContactMessageDto> {
    await this.findOrFail(id);
    return toDto(await this.prisma.contactMessage.update({ where: { id }, data: dto }));
  }

  async remove(id: string): Promise<void> {
    await this.findOrFail(id);
    await this.prisma.contactMessage.delete({ where: { id } });
  }

  async dashboard(): Promise<DashboardDto> {
    const [published, drafts, unread, latest, pendingEnrollments] = await this.prisma.$transaction([
      this.prisma.project.count({ where: { published: true } }),
      this.prisma.project.count({ where: { published: false } }),
      this.prisma.contactMessage.count({ where: { status: 'NEW' } }),
      this.prisma.contactMessage.findMany({
        where: { status: 'NEW' },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      this.prisma.enrollment.count({ where: { status: 'NEW' } }),
    ]);
    return {
      projects: { published, drafts },
      messages: { unread, latest: latest.map(toDto) },
      enrollments: { pending: pendingEnrollments },
    };
  }

  private async findOrFail(id: string): Promise<void> {
    if ((await this.prisma.contactMessage.count({ where: { id } })) === 0) throw notFound('Message');
  }
}
