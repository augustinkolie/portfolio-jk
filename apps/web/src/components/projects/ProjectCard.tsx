import type { ProjectSummaryDto } from '@btp/shared';
import Link from 'next/link';
import { ProjectImage } from '@/components/media/ProjectImage';
import styles from './ProjectCard.module.css';

interface ProjectCardProps {
  project: ProjectSummaryDto;
  sizes: string;
  /** Grande tuile de mosaïque : titre plus grand, résumé affiché. */
  large?: boolean;
  headingLevel?: 'h2' | 'h3';
}

/**
 * Réalisation dans une liste : photo franche, légende en texte dessous.
 * Pas de carte, pas d'ombre (§3.1, §3.5) : toute la zone est un seul lien.
 */
export function ProjectCard({ project, sizes, large = false, headingLevel: Heading = 'h3' }: ProjectCardProps) {
  return (
    <article className={[styles.card, large && styles.large].filter(Boolean).join(' ')}>
      <div className={styles.media}>
        {project.cover ? (
          <ProjectImage media={project.cover} sizes={sizes} cover />
        ) : (
          <div className={styles.noPhoto} aria-hidden="true" />
        )}
      </div>
      <div className={styles.caption}>
        <Heading className={styles.title}>
          <Link href={`/realisations/${project.slug}`} className={styles.link}>
            {project.title}
          </Link>
        </Heading>
        <p className={styles.meta}>
          <span>{project.location}</span>
          <span className="num">{project.year}</span>
          {project.size && <span className="num">{project.size}</span>}
          {project.status === 'IN_PROGRESS' && <span>En cours</span>}
        </p>
        {large && <p className={styles.summary}>{project.summary}</p>}
      </div>
    </article>
  );
}
