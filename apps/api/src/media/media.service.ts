import { randomUUID } from 'node:crypto';
import { BadRequestException, Injectable } from '@nestjs/common';
import type { MediaDto, MediaKind } from '@btp/shared';
import { notFound } from '../common/errors.js';
import type { Media, Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { RevalidationService } from '../revalidation/revalidation.service.js';
import { StorageService } from '../storage/storage.service.js';
import type { UpdateMediaDto, UploadMediaDto } from './dto/media.dto.js';
import { processImage } from './image-processor.js';
import { type StoredVariants, toMediaDto } from './media.mapper.js';

const CONTENT_TYPES = { avif: 'image/avif', webp: 'image/webp' } as const;

/** Élément auquel une photo est rattachée. Sans propriétaire : photo de profil. */
export type OwnerType = 'project' | 'course' | 'plan';
export interface MediaOwner {
  type: OwnerType;
  id: string;
}

const OWNER_FIELD = { project: 'projectId', course: 'courseId', plan: 'planId' } as const;
const OWNER_LABEL = { project: 'Projet', course: 'Formation', plan: 'Plan' } as const;

function ownerWhere(owner: MediaOwner): Prisma.MediaWhereInput {
  return { [OWNER_FIELD[owner.type]]: owner.id };
}

export function ownerOf(m: Pick<Media, 'projectId' | 'courseId' | 'planId'>): MediaOwner | null {
  if (m.projectId) return { type: 'project', id: m.projectId };
  if (m.courseId) return { type: 'course', id: m.courseId };
  if (m.planId) return { type: 'plan', id: m.planId };
  return null;
}

@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly revalidation: RevalidationService,
  ) {}

  async upload(file: Buffer, dto: UploadMediaDto): Promise<MediaDto> {
    const owner = this.ownerFromDto(dto);
    if (owner) await this.assertOwnerExists(owner);

    // Les plans de conception sont marqués d'un filigrane au nom de l'entreprise.
    const watermark = owner?.type === 'plan' ? await this.companyName() : undefined;
    const image = await processImage(file, { watermark });
    const id = randomUUID();
    const prefix = `media/${id}`;
    const variants: StoredVariants = { avif: [], webp: [] };

    try {
      for (const v of image.variants) {
        const key = `${prefix}/${v.width}.${v.format}`;
        await this.storage.put(key, v.body, CONTENT_TYPES[v.format]);
        variants[v.format].push({ width: v.width, key });
      }

      const kind = dto.kind ?? 'GALLERY';
      const media = await this.prisma.$transaction(async (tx) => {
        if (owner && kind === 'COVER') await this.demoteCovers(tx, owner);
        const last = owner
          ? await tx.media.aggregate({ where: ownerWhere(owner), _max: { order: true } })
          : null;
        return tx.media.create({
          data: {
            id,
            ...(owner ? { [OWNER_FIELD[owner.type]]: owner.id } : {}),
            alt: dto.alt.trim(),
            kind,
            order: (last?._max.order ?? -1) + 1,
            width: image.width,
            height: image.height,
            blurData: image.blurData,
            variants: variants as unknown as Prisma.InputJsonValue,
          },
        });
      });

      await this.revalidation.revalidateOwner(owner);
      return toMediaDto(media, this.storage);
    } catch (error) {
      // Aucun fichier orphelin si l'enregistrement échoue.
      await this.storage.deletePrefix(prefix);
      throw error;
    }
  }

  async update(id: string, dto: UpdateMediaDto): Promise<MediaDto> {
    const existing = await this.findOrFail(id);
    const owner = ownerOf(existing);
    const media = await this.prisma.$transaction(async (tx) => {
      if (dto.kind === 'COVER' && owner) await this.demoteCovers(tx, owner);
      return tx.media.update({
        where: { id },
        data: { alt: dto.alt?.trim(), kind: dto.kind, order: dto.order },
      });
    });
    await this.revalidation.revalidateOwner(owner);
    return toMediaDto(media, this.storage);
  }

  async remove(id: string): Promise<void> {
    const media = await this.findOrFail(id);
    await this.prisma.media.delete({ where: { id } });
    await this.storage.deletePrefix(`media/${id}`);
    await this.revalidation.revalidateOwner(ownerOf(media));
  }

  /** La position dans `ids` devient l'ordre d'affichage. Toutes les photos doivent appartenir à `owner`. */
  async reorder(owner: MediaOwner, ids: string[]): Promise<MediaDto[]> {
    await this.assertOwnerExists(owner);
    const owned = await this.prisma.media.count({ where: { ...ownerWhere(owner), id: { in: ids } } });
    if (owned !== ids.length) {
      throw new BadRequestException('Certaines photos n’appartiennent pas à cet élément. Rechargez la page.');
    }
    await this.prisma.$transaction(
      ids.map((id, order) => this.prisma.media.update({ where: { id }, data: { order } })),
    );
    await this.revalidation.revalidateOwner(owner);
    return this.listFor(owner);
  }

  async listFor(owner: MediaOwner): Promise<MediaDto[]> {
    const media = await this.prisma.media.findMany({ where: ownerWhere(owner), orderBy: { order: 'asc' } });
    return media.map((m) => toMediaDto(m, this.storage));
  }

  /** Supprime les fichiers d'un élément ; les lignes partent en cascade avec lui. */
  async deleteFilesFor(owner: MediaOwner): Promise<void> {
    const media = await this.prisma.media.findMany({ where: ownerWhere(owner), select: { id: true } });
    for (const { id } of media) await this.storage.deletePrefix(`media/${id}`);
  }

  private ownerFromDto(dto: UploadMediaDto): MediaOwner | null {
    const owners: MediaOwner[] = [];
    if (dto.projectId) owners.push({ type: 'project', id: dto.projectId });
    if (dto.courseId) owners.push({ type: 'course', id: dto.courseId });
    if (dto.planId) owners.push({ type: 'plan', id: dto.planId });
    if (owners.length > 1) {
      throw new BadRequestException('Une photo ne peut appartenir qu’à un seul élément.');
    }
    return owners[0] ?? null;
  }

  private async companyName(): Promise<string> {
    const row = await this.prisma.setting.findUnique({ where: { key: 'company' } });
    const name = (row?.value as { name?: unknown } | null)?.name;
    return typeof name === 'string' && name.trim() ? name.trim() : 'Jérôme Kolié';
  }

  private async demoteCovers(tx: Prisma.TransactionClient, owner: MediaOwner): Promise<void> {
    const kind: MediaKind = 'GALLERY';
    await tx.media.updateMany({ where: { ...ownerWhere(owner), kind: 'COVER' }, data: { kind } });
  }

  private async findOrFail(id: string) {
    const media = await this.prisma.media.findUnique({ where: { id } });
    if (!media) throw notFound('Photo');
    return media;
  }

  private async assertOwnerExists(owner: MediaOwner): Promise<void> {
    const where = { where: { id: owner.id } };
    const count =
      owner.type === 'project'
        ? await this.prisma.project.count(where)
        : owner.type === 'course'
          ? await this.prisma.course.count(where)
          : await this.prisma.plan.count(where);
    if (count === 0) throw notFound(OWNER_LABEL[owner.type]);
  }
}
