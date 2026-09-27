/** « École primaire de Labé » → « ecole-primaire-de-labe » */
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '');
}

/** Ajoute -2, -3… jusqu'à trouver un slug libre. */
export async function uniqueSlug(
  base: string,
  isTaken: (slug: string) => Promise<boolean>,
): Promise<string> {
  const root = slugify(base) || 'element';
  let candidate = root;
  for (let i = 2; await isTaken(candidate); i++) candidate = `${root}-${i}`;
  return candidate;
}
