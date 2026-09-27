import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BeforeAfter } from '@/components/media/BeforeAfter';
import { Gallery } from '@/components/media/Gallery';
import { ProjectImage } from '@/components/media/ProjectImage';
import { Cartouche, StatusMark } from '@/components/plan/Cartouche';
import { JsonLd } from '@/components/seo/JsonLd';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { Icon } from '@/components/ui/Icon';
import { Prose } from '@/components/ui/Prose';
import { api } from '@/lib/api';
import { projectsUrl, SITE_URL } from '@/lib/site';
import styles from './project.module.css';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = await api.projectSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const project = await api.project((await params).slug);
  if (!project) return {};
  return {
    title: project.title,
    description: project.summary,
    alternates: { canonical: `/realisations/${project.slug}` },
    openGraph: { type: 'article', title: project.title, description: project.summary },
  };
}

export default async function ProjectPage({ params }: PageProps) {
  const project = await api.project((await params).slug);
  if (!project) notFound();

  const cover = project.cover;
  const before = project.media.find((m) => m.kind === 'BEFORE');
  const after = project.media.find((m) => m.kind === 'AFTER');
  const gallery = project.media.filter((m) => m.kind === 'GALLERY' && m.id !== cover?.id);

  return (
    <article className={styles.page}>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'CreativeWork',
          name: project.title,
          description: project.summary,
          url: `${SITE_URL}/realisations/${project.slug}`,
          dateCreated: String(project.year),
          dateModified: project.updatedAt,
          locationCreated: { '@type': 'Place', name: project.location, address: { '@type': 'PostalAddress', addressCountry: 'GN' } },
          image: cover?.sources.webp.at(-1)?.url,
          genre: project.category.name,
        }}
      />

      <Container className={styles.header}>
        <nav aria-label="Fil d’Ariane" className={styles.breadcrumb}>
          <Link href="/realisations">Réalisations</Link>
          <span aria-hidden="true">/</span>
          <Link href={projectsUrl(project.category.slug)}>{project.category.name}</Link>
        </nav>
        <h1>{project.title}</h1>
        <p className={styles.summary}>{project.summary}</p>
      </Container>

      {cover && (
        <div className={styles.cover}>
          <ProjectImage media={cover} sizes="100vw" priority cover />
        </div>
      )}

      <Container className={styles.body}>
        <Cartouche
          title="Fiche technique"
          className={styles.cartouche}
          rows={[
            { label: 'Maître d’ouvrage', value: project.client },
            { label: 'Lieu', value: project.location },
            { label: 'Année', value: <span className="num">{project.year}</span> },
            { label: 'Durée des travaux', value: project.duration },
            { label: 'Surface / linéaire', value: project.size },
            { label: 'Montant', value: project.budget },
            { label: 'Domaine', value: project.category.name },
            { label: 'Statut', value: <StatusMark delivered={project.status === 'DELIVERED'} /> },
          ]}
        />
        <Prose html={project.description} className={styles.description} />
      </Container>

      {before && after && (
        <Container as="section" className={styles.section} aria-labelledby="avant-apres">
          <h2 id="avant-apres">Avant / après</h2>
          <BeforeAfter before={before} after={after} />
        </Container>
      )}

      {gallery.length > 0 && (
        <Container as="section" className={styles.section} aria-labelledby="galerie">
          <h2 id="galerie">Photos du chantier</h2>
          <Gallery media={gallery} title={project.title} />
        </Container>
      )}

      <Container className={styles.section}>
        <div className={styles.cta}>
          <p className={styles.ctaText}>Un projet comparable à réaliser ?</p>
          <Button href="/contact" variant="devis">
            Demander un devis
          </Button>
        </div>
        {(project.previous || project.next) && (
          <nav className={styles.pager} aria-label="Autres réalisations">
            {project.previous ? (
              <Link href={`/realisations/${project.previous.slug}`} className={styles.pagerLink} rel="prev">
                <span className={styles.pagerLabel}>
                  <Icon name="arrow-left" /> Projet précédent
                </span>
                <span className={styles.pagerTitle}>{project.previous.title}</span>
              </Link>
            ) : (
              <span />
            )}
            {project.next && (
              <Link href={`/realisations/${project.next.slug}`} className={`${styles.pagerLink} ${styles.next}`} rel="next">
                <span className={styles.pagerLabel}>
                  Projet suivant <Icon name="arrow-right" />
                </span>
                <span className={styles.pagerTitle}>{project.next.title}</span>
              </Link>
            )}
          </nav>
        )}
      </Container>
    </article>
  );
}
