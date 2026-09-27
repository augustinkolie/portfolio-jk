import type { ImageSource, MediaDto } from '@btp/shared';
import type { Media } from '../generated/prisma/client.js';
import type { StorageService } from '../storage/storage.service.js';

/** Forme stockée dans la colonne JSON `variants` : des clés de stockage, jamais des URLs. */
export interface StoredVariants {
  avif: { width: number; key: string }[];
  webp: { width: number; key: string }[];
}

function isStoredVariants(value: unknown): value is StoredVariants {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return Array.isArray(v.avif) && Array.isArray(v.webp);
}

export function toMediaDto(media: Media, storage: StorageService): MediaDto {
  const variants = isStoredVariants(media.variants) ? media.variants : { avif: [], webp: [] };
  const toSources = (list: StoredVariants['avif']): ImageSource[] =>
    list.map(({ width, key }) => ({ width, url: storage.publicUrl(key) }));

  return {
    id: media.id,
    alt: media.alt,
    kind: media.kind,
    order: media.order,
    width: media.width,
    height: media.height,
    blurData: media.blurData,
    sources: { avif: toSources(variants.avif), webp: toSources(variants.webp) },
  };
}
