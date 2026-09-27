import { BadRequestException, Injectable } from '@nestjs/common';
import { normalizePhone, type SiteSettings, type SiteSettingsInput } from '@btp/shared';
import type { Prisma } from '../generated/prisma/client.js';
import { toMediaDto } from '../media/media.mapper.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { RevalidationService, Tags } from '../revalidation/revalidation.service.js';
import { StorageService } from '../storage/storage.service.js';
import type { UpdateSettingsDto } from './dto/settings.dto.js';

type SectionKey = keyof SiteSettingsInput;
const SECTIONS: SectionKey[] = ['company', 'keyFigures', 'contact', 'social', 'profile'];

/** Valeurs affichées tant que l'administrateur n'a rien saisi. */
export const DEFAULT_SETTINGS: SiteSettingsInput = {
  company: { name: 'Jérôme Kolié', tagline: '', description: '' },
  keyFigures: [],
  contact: { phone: '', whatsapp: '', email: '', address: '', hours: '', mapUrl: '' },
  social: { facebook: '', linkedin: '', instagram: '', youtube: '' },
  profile: { role: '', bio: '', photoId: null },
};

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly revalidation: RevalidationService,
  ) {}

  async get(): Promise<SiteSettings> {
    const rows = await this.prisma.setting.findMany({ where: { key: { in: SECTIONS } } });
    const stored = Object.fromEntries(rows.map((r) => [r.key, r.value])) as Partial<SiteSettingsInput>;
    const profile = { ...DEFAULT_SETTINGS.profile, ...stored.profile };
    const photo = profile.photoId
      ? await this.prisma.media.findUnique({ where: { id: profile.photoId } })
      : null;

    return {
      company: { ...DEFAULT_SETTINGS.company, ...stored.company },
      keyFigures: stored.keyFigures ?? DEFAULT_SETTINGS.keyFigures,
      contact: { ...DEFAULT_SETTINGS.contact, ...stored.contact },
      social: { ...DEFAULT_SETTINGS.social, ...stored.social },
      profile: { ...profile, photo: photo ? toMediaDto(photo, this.storage) : null },
    };
  }

  async update(dto: UpdateSettingsDto): Promise<SiteSettings> {
    const photoId = dto.profile.photoId || null;
    if (photoId && (await this.prisma.media.count({ where: { id: photoId } })) === 0) {
      throw new BadRequestException('La photo de profil n’existe plus. Envoyez-la à nouveau.');
    }

    const settings: SiteSettingsInput = {
      company: { ...dto.company },
      keyFigures: dto.keyFigures.map((f) => ({ ...f })),
      contact: {
        ...dto.contact,
        phone: dto.contact.phone && normalizePhone(dto.contact.phone),
        whatsapp: dto.contact.whatsapp && normalizePhone(dto.contact.whatsapp),
      },
      social: { ...dto.social },
      profile: { role: dto.profile.role, bio: dto.profile.bio, photoId },
    };
    await this.prisma.$transaction(
      SECTIONS.map((key) => {
        const value = settings[key] as unknown as Prisma.InputJsonValue;
        return this.prisma.setting.upsert({
          where: { key },
          create: { key, value },
          update: { value },
        });
      }),
    );
    await this.revalidation.revalidate([Tags.settings]);
    return this.get();
  }
}
