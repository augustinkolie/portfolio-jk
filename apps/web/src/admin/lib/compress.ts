const MAX_SIDE = 2400;
const QUALITY = 0.85;

export class UnreadableImageError extends Error {}

/**
 * Réduit la photo à 2 400 px de côté au plus et la réencode en JPEG avant l'envoi (§5.3) :
 * une photo de téléphone de 5 Mo passe sous 1 Mo, l'envoi est 5 fois plus court.
 * L'orientation EXIF est appliquée par le navigateur au décodage.
 */
export async function compressImage(file: File): Promise<Blob> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new UnreadableImageError(
      `« ${file.name} » n’a pas pu être lue. Formats acceptés : JPEG, PNG, WebP, AVIF.`,
    );
  }

  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  // Déjà petite et légère : envoyée telle quelle.
  if (scale === 1 && file.size < 1_500_000 && file.type === 'image/jpeg') {
    bitmap.close();
    return file;
  }

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new UnreadableImageError('Le navigateur ne peut pas préparer la photo.');
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new UnreadableImageError('Compression impossible.'))),
      'image/jpeg',
      QUALITY,
    ),
  );
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} Mo`;
}
