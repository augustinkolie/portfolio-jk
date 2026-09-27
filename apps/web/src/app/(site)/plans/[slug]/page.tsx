import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Gallery } from '@/components/media/Gallery';
import { ProjectImage } from '@/components/media/ProjectImage';
import { Cartouche } from '@/components/plan/Cartouche';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { Prose } from '@/components/ui/Prose';
import { api } from '@/lib/api';
import { whatsappUrl } from '@/lib/site';
import styles from './plan.module.css';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return (await api.planSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const plan = await api.plan((await params).slug);
  if (!plan) return {};
  return { title: plan.title, description: plan.summary, alternates: { canonical: `/plans/${plan.slug}` } };
}

export default async function PlanPage({ params }: PageProps) {
  const [plan, settings] = await Promise.all([api.plan((await params).slug), api.settings()]);
  if (!plan) notFound();
  const others = plan.media.filter((m) => m.id !== plan.cover?.id);
  const { whatsapp } = settings.contact;

  return (
    <article className={styles.page}>
      <Container className={styles.header}>
        <nav aria-label="Fil d’Ariane" className={styles.breadcrumb}>
          <Link href="/plans">Plans</Link>
          <span aria-hidden="true">/</span>
          <span>{plan.planType}</span>
        </nav>
        <h1>{plan.title}</h1>
        <p className={styles.summary}>{plan.summary}</p>
      </Container>

      <Container className={styles.body}>
        {plan.cover && (
          <div className={styles.main}>
            <ProjectImage media={plan.cover} sizes="(min-width: 64rem) 60vw, 100vw" priority />
          </div>
        )}

        <aside className={styles.aside}>
          <Cartouche
            title="Fiche du plan"
            rows={[
              { label: 'Type', value: plan.planType },
              { label: 'Niveaux', value: plan.levels },
              { label: 'Surface', value: plan.surface },
              { label: 'Chambres', value: plan.bedrooms !== null ? String(plan.bedrooms) : null },
            ]}
          />
          <div className={styles.order}>
            <p className={styles.orderTitle}>Un plan de ce type pour votre terrain ?</p>
            <p className={styles.orderText}>
              Chaque plan est adapté aux dimensions du terrain, à l’orientation et au budget.
            </p>
            <Button href="/contact" variant="devis" block>
              Demander un devis
            </Button>
            {whatsapp && (
              <Button
                href={whatsappUrl(whatsapp, `Bonjour, je souhaite un plan similaire à « ${plan.title} ».`)}
                external
                variant="trait"
                icon="whatsapp"
                block
              >
                Commander un plan similaire
              </Button>
            )}
          </div>
        </aside>

        <div className={styles.details}>
          <Prose html={plan.description} />
          {others.length > 0 && (
            <section className={styles.gallery} aria-labelledby="vues-titre">
              <h2 id="vues-titre">Autres vues du plan</h2>
              <Gallery media={others} title={plan.title} />
            </section>
          )}
        </div>
      </Container>
    </article>
  );
}
