import { timingSafeEqual } from 'node:crypto';
import { revalidateTag } from 'next/cache';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Appelée par l'API après une publication, une modification ou une suppression (§6.6).
 * Seules les pages portant ces étiquettes sont régénérées.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET ?? '';
  const received = request.headers.get('x-revalidate-secret') ?? '';
  if (!secret || !safeEqual(received, secret)) {
    return NextResponse.json({ message: 'Secret de revalidation invalide.' }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { tags?: unknown } | null;
  const tags = Array.isArray(body?.tags) ? body.tags.filter((t): t is string => typeof t === 'string') : [];
  if (tags.length === 0) {
    return NextResponse.json({ message: 'Aucune étiquette à revalider.' }, { status: 400 });
  }

  // Expiration immédiate : la page suivante est régénérée avec les nouvelles données.
  for (const tag of tags) revalidateTag(tag, { expire: 0 });
  return NextResponse.json({ revalidated: tags });
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}
