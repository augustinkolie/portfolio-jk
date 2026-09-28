import { Injectable, Logger } from '@nestjs/common';
import {
  type ContactMessageDto,
  type DashboardDto,
  normalizePhone,
  type NotificationItemDto,
  type NotificationsDto,
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

const NOTIFICATION_ITEMS = 8;

/** Début du message sur une ligne, coupé proprement. */
function excerpt(text: string, max = 80): string {
  const line = text.replace(/\s+/g, ' ').trim();
  return line.length <= max ? line : `${line.slice(0, max - 1).trimEnd()}…`;
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

  /** Cloche de l'admin : messages non lus et inscriptions nouvelles, les plus récents d'abord. */
  async notifications(): Promise<NotificationsDto> {
    const [messages, enrollments, latestMessages, latestEnrollments] = await this.prisma.$transaction([
      this.prisma.contactMessage.count({ where: { status: 'NEW' } }),
      this.prisma.enrollment.count({ where: { status: 'NEW' } }),
      this.prisma.contactMessage.findMany({
        where: { status: 'NEW' },
        orderBy: { createdAt: 'desc' },
        take: NOTIFICATION_ITEMS,
      }),
      this.prisma.enrollment.findMany({
        where: { status: 'NEW' },
        orderBy: { createdAt: 'desc' },
        take: NOTIFICATION_ITEMS,
        include: { course: { select: { title: true } } },
      }),
    ]);
    const items: NotificationItemDto[] = [
      ...latestMessages.map((m) => ({
        type: 'message' as const,
        id: m.id,
        title: m.name,
        detail: m.projectType ?? excerpt(m.message),
        createdAt: m.createdAt.toISOString(),
      })),
      ...latestEnrollments.map((e) => ({
        type: 'enrollment' as const,
        id: e.id,
        title: e.name,
        detail: `Inscription : ${e.course.title}`,
        createdAt: e.createdAt.toISOString(),
      })),
    ]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, NOTIFICATION_ITEMS);
    return { total: messages + enrollments, messages, enrollments, items };
  }

  private async findOrFail(id: string): Promise<void> {
    if ((await this.prisma.contactMessage.count({ where: { id } })) === 0) throw notFound('Message');
  }
}
