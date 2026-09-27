import type { Metadata } from 'next';
import { PAGE_SIZE } from '@btp/shared';
import { ProjectsBrowser } from '@/components/projects/ProjectsBrowser';
import { Container } from '@/components/ui/Container';
import { api } from '@/lib/api';
import styles from './realisations.module.css';

export const metadata: Metadata = {
  title: 'Réalisations',
  description:
    'Bâtiments, ouvrages de génie civil, routes et rénovations livrés en Guinée : lieux, surfaces, délais et photos de chantier.',
  alternates: { canonical: '/realisations' },
};

export default async function RealisationsPage() {
  const [initial, categories, years] = await Promise.all([
    api.projects({ limit: PAGE_SIZE }),
    api.categories(),
    api.projectYears(),
  ]);

  return (
    <Container className={styles.page}>
      <h1>Réalisations</h1>
      <p className={styles.lead}>
        Chaque projet avec son lieu, sa surface ou son linéaire, sa durée et ses photos de chantier.
      </p>
      <ProjectsBrowser initial={initial} categories={categories} years={years} />
    </Container>
  );
}
