import type { MediaDto } from '@btp/shared';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { ProjectImage } from '@/components/media/ProjectImage';
import styles from '@/components/projects/ProjectCard.module.css';
import own from './Tile.module.css';

interface TileProps {
  href: string;
  title: string;
  cover: MediaDto | null;
  sizes: string;
  /** Informations courtes séparées par des filets : « AutoCAD · Débutant · 40 h ». */
  meta: (ReactNode | null | false | undefined)[];
  summary?: string;
  /** Pastille posée sur l'image : « Extrait vidéo ». */
  badge?: string;
  /** Ligne mise en avant sous le titre : prix, prochaine session. */
  highlight?: ReactNode;
  headingLevel?: 'h2' | 'h3';
}

/** Tuile de liste (formation, plan) : même langage que les tuiles de réalisations. */
export function Tile({ href, title, cover, sizes, meta, summary, badge, highlight, headingLevel: Heading = 'h2' }: TileProps) {
  const items = meta.filter(Boolean);
  return (
    <article className={styles.card}>
      <div className={`${styles.media} ${own.media}`}>
        {cover ? <ProjectImage media={cover} sizes={sizes} cover /> : <div className={styles.noPhoto} aria-hidden="true" />}
        {badge && <span className={own.badge}>{badge}</span>}
      </div>
      <div className={styles.caption}>
        <Heading className={styles.title}>
          <Link href={href} className={styles.link}>
            {title}
          </Link>
        </Heading>
        {items.length > 0 && (
          <p className={styles.meta}>
            {items.map((item, i) => (
              <span key={i}>{item}</span>
            ))}
          </p>
        )}
        {highlight && <p className={own.highlight}>{highlight}</p>}
        {summary && <p className={styles.summary}>{summary}</p>}
      </div>
    </article>
  );
}
