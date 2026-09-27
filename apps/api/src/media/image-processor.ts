import { IMAGE_ACCEPTED_TYPES, IMAGE_MAX_UPLOAD_BYTES, IMAGE_WIDTHS } from '@btp/shared';
import { BadRequestException, PayloadTooLargeException } from '@nestjs/common';
import { fileTypeFromBuffer } from 'file-type';
import sharp, { type OutputInfo, type Sharp } from 'sharp';

export interface ProcessedVariant {
  width: number;
  format: 'avif' | 'webp';
  body: Buffer;
}

export interface ProcessedImage {
  width: number;
  height: number;
  blurData: string;
  variants: ProcessedVariant[];
}

const MAX_WIDTH = IMAGE_WIDTHS[IMAGE_WIDTHS.length - 1];
const BLUR_MAX_BYTES = 1024;

/** Largeurs à produire : celles de la liste qui ne dépassent pas l'original, plus l'original s'il est plus petit que 1920 px. */
export function targetWidths(originalWidth: number): number[] {
  const widths: number[] = IMAGE_WIDTHS.filter((w) => w <= originalWidth);
  if (originalWidth < MAX_WIDTH && !widths.includes(originalWidth)) widths.push(originalWidth);
  return widths;
}

async function assertAcceptedImage(buffer: Buffer): Promise<void> {
  if (buffer.length > IMAGE_MAX_UPLOAD_BYTES) {
    throw new PayloadTooLargeException(
      `La photo dépasse ${IMAGE_MAX_UPLOAD_BYTES / 1024 / 1024} Mo. Réduisez-la avant de l'envoyer.`,
    );
  }
  // Type réel lu dans le contenu du fichier, pas dans son extension ni dans l'en-tête envoyé.
  const type = await fileTypeFromBuffer(buffer);
  if (!type || !(IMAGE_ACCEPTED_TYPES as readonly string[]).includes(type.mime)) {
    throw new BadRequestException(
      'Ce fichier n’est pas une photo prise en charge. Formats acceptés : JPEG, PNG, WebP, AVIF.',
    );
  }
}

/**
 * sharp ne recopie aucune métadonnée (EXIF, GPS, profil appareil) sauf demande explicite :
 * chaque sortie en est donc dépourvue. `rotate()` applique l'orientation EXIF avant qu'elle disparaisse.
 */
export async function processImage(
  buffer: Buffer,
  options: { watermark?: string } = {},
): Promise<ProcessedImage> {
  await assertAcceptedImage(buffer);

  // Décodage unique, ramené à 1920 px et gardé en pixels bruts (≈ 10 Mo au plus) :
  // les variantes en dérivent sans redécoder l'original.
  let decoded: { data: Buffer; info: OutputInfo };
  try {
    decoded = await sharp(buffer, { failOn: 'error' })
      .rotate()
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .raw()
      .toBuffer({ resolveWithObject: true });
  } catch {
    throw new BadRequestException('La photo est illisible ou endommagée. Essayez un autre fichier.');
  }
  const { width, height, channels } = decoded.info;
  if (options.watermark) {
    decoded = await sharp(decoded.data, { raw: { width, height, channels } })
      .composite([{ input: watermarkSvg(width, height, options.watermark) }])
      .raw()
      .toBuffer({ resolveWithObject: true });
  }
  const source = (): Sharp => sharp(decoded.data, { raw: { width, height, channels: decoded.info.channels } });

  const variants: ProcessedVariant[] = [];
  // Séquentiel : limite la mémoire sur un petit serveur.
  for (const w of targetWidths(width)) {
    const resized = source().resize({ width: w, withoutEnlargement: true });
    variants.push({
      width: w,
      format: 'avif',
      body: await resized.clone().avif({ quality: 50, effort: 4 }).toBuffer(),
    });
    variants.push({ width: w, format: 'webp', body: await resized.clone().webp({ quality: 78 }).toBuffer() });
  }

  return { width, height, blurData: await blurPlaceholder(source), variants };
}

function escapeXml(text: string): string {
  return text.replace(/[<>&"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

/**
 * Filigrane des plans : le nom répété en diagonale, discret (18 % d'opacité), plus une
 * mention nette en bas à gauche (le bas à droite est la place du cartouche du plan).
 */
function watermarkSvg(width: number, height: number, text: string): Buffer {
  const label = escapeXml(`© ${text}`);
  const size = Math.round(Math.max(width, height) / 28);
  const stepX = size * 12;
  const stepY = size * 6;
  const rows: string[] = [];
  for (let y = -height; y < height * 2; y += stepY) {
    for (let x = -width; x < width * 2; x += stepX) {
      rows.push(`<text x="${x}" y="${y}">${label}</text>`);
    }
  }
  // Mention nette, dimensionnée sur la longueur du nom (≈ 0,6 em par caractère).
  const plate = Math.round(size * 0.65);
  const plateW = Math.round(plate * (text.length * 0.62 + 2.4));
  const plateH = Math.round(plate * 1.7);
  const margin = Math.round(plate * 0.6);
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <g transform="rotate(-30 ${width / 2} ${height / 2})" font-family="Arial, sans-serif" font-size="${size}"
         font-weight="700" fill="#1d4a73" fill-opacity="0.18">${rows.join('')}</g>
      <rect x="${margin}" y="${height - margin - plateH}" width="${plateW}" height="${plateH}"
            fill="#ffffff" fill-opacity="0.85" stroke="#2a3139" stroke-width="2"/>
      <text x="${margin + plateW / 2}" y="${height - margin - plateH * 0.32}" text-anchor="middle" font-family="Arial, sans-serif"
            font-size="${plate}" font-weight="700" fill="#2a3139">${label}</text>
    </svg>`,
  );
}

async function blurPlaceholder(source: () => Sharp): Promise<string> {
  for (const size of [16, 10, 6]) {
    const data = await source().resize(size, size, { fit: 'inside' }).webp({ quality: 40 }).toBuffer();
    const url = `data:image/webp;base64,${data.toString('base64')}`;
    if (url.length < BLUR_MAX_BYTES) return url;
  }
  return '';
}
