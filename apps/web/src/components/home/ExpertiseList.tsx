import type { CategoryDto, ExpertiseDto } from '@btp/shared';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Icon } from '@/components/ui/Icon';
import { projectsUrl } from '@/lib/site';
import styles from './ExpertiseList.module.css';

interface ExpertiseListProps {
  expertises: ExpertiseDto[];
  categories: CategoryDto[];
}

/** Domaines d'intervention : liste typographique, sans cartes ni icônes (§4.1, point 4). */
export function ExpertiseList({ expertises, categories }: ExpertiseListProps) {
  if (expertises.length === 0) return null;
  const counts = new Map(categories.map((c) => [c.id, c.projectCount]));

  return (
    <Container as="section" className={styles.section} aria-labelledby="domaines-titre">
      <h2 id="domaines-titre">Domaines d’intervention</h2>
      <ul className={styles.list}>
        {expertises.map((e) => {
          const count = e.category ? (counts.get(e.category.id) ?? 0) : 0;
          return (
            <li key={e.id} className={styles.item}>
              <h3 className={styles.name}>{e.name}</h3>
              <p className={styles.description}>{e.description}</p>
              {e.category && count > 0 ? (
                <Link className={styles.link} href={projectsUrl(e.category.slug)}>
                  <span className="num">
                    {count} projet{count > 1 ? 's' : ''}
                  </span>
                  <Icon name="arrow-right" />
                </Link>
              ) : (
                <Link className={styles.link} href={`/expertises#${e.slug}`}>
                  En savoir plus
                  <Icon name="arrow-right" />
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </Container>
  );
}
