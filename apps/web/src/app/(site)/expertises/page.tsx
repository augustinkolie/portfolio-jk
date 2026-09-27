import type { Metadata } from 'next';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { ActionLink } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { api } from '@/lib/api';
import { projectsUrl } from '@/lib/site';
import styles from './expertises.module.css';

export const metadata: Metadata = {
  title: 'Expertises',
  description: 'Bâtiment, génie civil, routes et VRD, rénovation : nos domaines d’intervention et les chantiers qui les illustrent.',
  alternates: { canonical: '/expertises' },
};

const PROJECTS_SHOWN = 2;

export default async function ExpertisesPage() {
  const list = await api.expertises();
  const details = (await Promise.all(list.map((e) => api.expertise(e.slug)))).filter((e) => e !== null);

  return (
    <Container className={styles.page}>
      <h1>Expertises</h1>
      <nav aria-label="Domaines" className={styles.toc}>
        <ul>
          {list.map((e) => (
            <li key={e.id}>
              <a href={`#${e.slug}`}>{e.name}</a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Grand écran : domaines en grille de deux colonnes, séparés par des filets (pas de cartes). */}
      <div className={styles.grid}>
        {details.map((e) => (
          <section key={e.id} id={e.slug} className={styles.domain} aria-labelledby={`${e.slug}-titre`}>
            <h2 id={`${e.slug}-titre`} className={styles.name}>
              {e.name}
            </h2>
            <p>{e.description}</p>

            {e.projects.length > 0 ? (
              <>
                <ul className={styles.projects}>
                  {e.projects.slice(0, PROJECTS_SHOWN).map((p) => (
                    <li key={p.id}>
                      <ProjectCard project={p} sizes="(min-width: 64rem) 20vw, (min-width: 48rem) 45vw, 100vw" />
                    </li>
                  ))}
                </ul>
                {e.category && (
                  <ActionLink href={projectsUrl(e.category.slug)}>
                    {e.projects.length > 1 ? `Voir les ${e.projects.length} projets` : 'Voir le projet'}
                  </ActionLink>
                )}
              </>
            ) : (
              <p className={styles.none}>
                Aucune réalisation publiée pour l’instant dans ce domaine.{' '}
                <a href="/contact">Demander un devis pour ce type de travaux</a>
              </p>
            )}
          </section>
        ))}
      </div>
    </Container>
  );
}
