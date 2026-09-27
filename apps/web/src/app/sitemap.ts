import type { MetadataRoute } from 'next';
import { api } from '@/lib/api';
import { SITE_URL } from '@/lib/site';

const STATIC_PAGES = ['', '/realisations', '/expertises', '/formations', '/plans', '/a-propos', '/contact', '/mentions-legales'];

// L'admin et la charte graphique n'y figurent pas (§8).
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [slugs, courses, plans] = await Promise.all([api.projectSlugs(), api.courseSlugs(), api.planSlugs()]);
  return [
    ...STATIC_PAGES.map((path) => ({ url: `${SITE_URL}${path}` })),
    ...slugs.map((slug) => ({ url: `${SITE_URL}/realisations/${slug}` })),
    ...courses.map((slug) => ({ url: `${SITE_URL}/formations/${slug}` })),
    ...plans.map((slug) => ({ url: `${SITE_URL}/plans/${slug}` })),
  ];
}
