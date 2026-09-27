import { COURSE_FORMAT_LABELS, COURSE_LEVEL_LABELS } from '@btp/shared';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ProjectImage } from '@/components/media/ProjectImage';
import { VideoTeaser } from '@/components/media/VideoTeaser';
import { Cartouche } from '@/components/plan/Cartouche';
import { JsonLd } from '@/components/seo/JsonLd';
import { EnrollmentForm } from '@/components/training/EnrollmentForm';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { Prose } from '@/components/ui/Prose';
import { api } from '@/lib/api';
import { SITE_URL, whatsappUrl } from '@/lib/site';
import styles from './formation.module.css';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return (await api.courseSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const course = await api.course((await params).slug);
  if (!course) return {};
  return {
    title: `Formation ${course.title}`,
    description: course.summary,
    alternates: { canonical: `/formations/${course.slug}` },
  };
}

export default async function CoursePage({ params }: PageProps) {
  const [course, settings] = await Promise.all([api.course((await params).slug), api.settings()]);
  if (!course) notFound();
  const { whatsapp } = settings.contact;

  return (
    <article className={styles.page}>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Course',
          name: course.title,
          description: course.summary,
          url: `${SITE_URL}/formations/${course.slug}`,
          provider: { '@type': 'Organization', name: settings.company.name, url: SITE_URL },
        }}
      />
      <Container className={styles.header}>
        <nav aria-label="Fil d’Ariane" className={styles.breadcrumb}>
          <Link href="/formations">Formations</Link>
          <span aria-hidden="true">/</span>
          <span>{course.software}</span>
        </nav>
        <h1>{course.title}</h1>
        <p className={styles.summary}>{course.summary}</p>
      </Container>

      <Container className={styles.body}>
        <div className={styles.media}>
          {course.teaser ? (
            <VideoTeaser teaser={course.teaser} poster={course.cover} title={course.title} />
          ) : (
            course.cover && (
              <div className={styles.cover}>
                <ProjectImage media={course.cover} sizes="(min-width: 64rem) 60vw, 100vw" priority cover />
              </div>
            )
          )}
        </div>

        <aside className={styles.aside} aria-label="Inscription">
          <Cartouche
            title="Fiche de la formation"
            rows={[
              { label: 'Logiciel', value: course.software },
              { label: 'Niveau', value: COURSE_LEVEL_LABELS[course.level] },
              { label: 'Format', value: COURSE_FORMAT_LABELS[course.format] },
              { label: 'Durée', value: course.duration },
              { label: 'Lieu', value: course.location },
              { label: 'Prochaine session', value: course.nextSession },
              { label: 'Prix', value: course.price },
            ]}
          />
          <section className={styles.enroll} aria-labelledby="inscription-titre">
            <h2 id="inscription-titre" className={styles.enrollTitle}>
              Demander mon inscription
            </h2>
            <p className={styles.enrollNote}>
              Pas de paiement en ligne : nous vous rappelons pour confirmer la place et les modalités de paiement.
            </p>
            <EnrollmentForm courseId={course.id} courseTitle={course.title} />
            {whatsapp && (
              <Button
                href={whatsappUrl(whatsapp, `Bonjour, je souhaite m’inscrire à la formation « ${course.title} ».`)}
                external
                variant="trait"
                icon="whatsapp"
                block
              >
                S’inscrire par WhatsApp
              </Button>
            )}
          </section>
        </aside>

        <section className={styles.program} aria-labelledby="programme-titre">
          <h2 id="programme-titre">Programme</h2>
          <Prose html={course.description} />
        </section>
      </Container>
    </article>
  );
}
