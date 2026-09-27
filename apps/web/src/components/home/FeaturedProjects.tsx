import type { ProjectSummaryDto } from '@btp/shared';
import { wideTileIndex } from '@/components/projects/layout';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { ActionLink } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import styles from './FeaturedProjects.module.css';

/**
 * Mosaïque irrégulière (§4.1, point 3) : le premier projet « en vedette » occupe une grande
 * tuile quand elle ne laisse pas de trou dans la grille (voir wideTileIndex).
 */
export function FeaturedProjects({ projects }: { projects: ProjectSummaryDto[] }) {
  if (projects.length === 0) return null;
  const wideIndex = wideTileIndex(projects);
  return (
    <Container as="section" className={styles.section} aria-labelledby="realisations-titre">
      <div className={styles.head}>
        <h2 id="realisations-titre">Réalisations</h2>
        <ActionLink href="/realisations">Toutes les réalisations</ActionLink>
      </div>
      <ul className={styles.mosaic}>
        {projects.map((p, i) => (
          <li key={p.id} className={i === wideIndex ? styles.large : undefined}>
            <ProjectCard
              project={p}
              large={i === wideIndex}
              sizes={
                i === wideIndex
                  ? '(min-width: 64rem) 66vw, 100vw'
                  : '(min-width: 64rem) 33vw, (min-width: 48rem) 50vw, 100vw'
              }
            />
          </li>
        ))}
      </ul>
    </Container>
  );
}
