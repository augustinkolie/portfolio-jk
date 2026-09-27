import type { KeyFigure } from '@btp/shared';

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/+$/, '');
export const PUBLIC_API_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000').replace(
  /\/+$/,
  '',
);

/** Paramètres d'URL de /realisations, en français (§4.2). */
export const FILTER_PARAMS = { category: 'categorie', year: 'annee' } as const;

export function projectsUrl(categorySlug?: string): string {
  return categorySlug ? `/realisations?${FILTER_PARAMS.category}=${categorySlug}` : '/realisations';
}

/** Lien WhatsApp (canal prioritaire en Guinée), message prérempli facultatif. */
export function whatsappUrl(phone: string, message?: string): string {
  const digits = phone.replace(/\D/g, '');
  return `https://wa.me/${digits}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
}

/** +224622123456 → +224 622 12 34 56 */
export function formatPhone(phone: string): string {
  const m = /^\+224(\d{3})(\d{2})(\d{2})(\d{2})$/.exec(phone);
  return m ? `+224 ${m[1]} ${m[2]} ${m[3]} ${m[4]}` : phone;
}

const NUMBER = new Intl.NumberFormat('fr-FR');

/** 38200 → « 38 200 » (espace fine insécable, séparateur français). */
export function formatNumber(value: number): string {
  return NUMBER.format(value);
}

/**
 * Longueur des cotes du bloc chiffres. Les unités diffèrent (ans, m², km) : une
 * échelle logarithmique garde l'ordre « plus grand = plus long » sans écraser
 * les petites valeurs. La valeur exacte est toujours écrite au-dessus.
 */
export function figureLengths(figures: KeyFigure[]): number[] {
  const max = Math.max(...figures.map((f) => f.value), 1);
  return figures.map((f) => 0.3 + 0.7 * (Math.log10(f.value + 1) / Math.log10(max + 1)));
}
