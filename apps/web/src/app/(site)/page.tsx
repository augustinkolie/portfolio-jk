import { ExpertiseList } from '@/components/home/ExpertiseList';
import { FeaturedProjects } from '@/components/home/FeaturedProjects';
import { Hero } from '@/components/home/Hero';
import { KeyFigures } from '@/components/home/KeyFigures';
import { Method } from '@/components/home/Method';
import { JsonLd } from '@/components/seo/JsonLd';
import { api } from '@/lib/api';
import { SITE_URL } from '@/lib/site';

const HOME_PROJECTS = 6;

export default async function HomePage() {
  const [settings, projects, expertises, categories] = await Promise.all([
    api.settings(),
    api.projects({ limit: HOME_PROJECTS }),
    api.expertises(),
    api.categories(),
  ]);

  const heroProject =
    projects.items.find((p) => p.featured && p.cover) ?? projects.items.find((p) => p.cover) ?? null;
  const { company, contact, social } = settings;

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'GeneralContractor',
          name: company.name,
          description: company.tagline || undefined,
          url: SITE_URL,
          telephone: contact.phone || undefined,
          email: contact.email || undefined,
          address: contact.address
            ? { '@type': 'PostalAddress', streetAddress: contact.address, addressCountry: 'GN' }
            : undefined,
          areaServed: { '@type': 'Country', name: 'Guinée' },
          sameAs: Object.values(social).filter(Boolean),
        }}
      />
      <Hero company={company} project={heroProject} />
      <KeyFigures figures={settings.keyFigures} />
      <FeaturedProjects projects={projects.items} />
      <ExpertiseList expertises={expertises} categories={categories} />
      <Method />
    </>
  );
}
