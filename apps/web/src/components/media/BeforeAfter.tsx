'use client';

import type { MediaDto } from '@btp/shared';
import { useState, type CSSProperties } from 'react';
import { ProjectImage } from './ProjectImage';
import styles from './BeforeAfter.module.css';

interface BeforeAfterProps {
  before: MediaDto;
  after: MediaDto;
}

/**
 * Curseur avant/après (§4.3). La poignée est un <input type="range"> natif :
 * flèches du clavier, lecteurs d'écran et glisser au doigt sans code supplémentaire.
 */
export function BeforeAfter({ before, after }: BeforeAfterProps) {
  const [position, setPosition] = useState(50);
  const sizes = '(min-width: 80rem) 80rem, 100vw';

  return (
    <figure className={styles.figure}>
      <div
        className={styles.frame}
        style={{ '--position': `${position}%`, aspectRatio: `${after.width} / ${after.height}` } as CSSProperties}
      >
        <div className={styles.layer}>
          <ProjectImage media={before} sizes={sizes} cover />
          <span className={`${styles.tag} ${styles.tagBefore}`} aria-hidden="true">
            Avant
          </span>
        </div>
        <div className={`${styles.layer} ${styles.after}`}>
          <ProjectImage media={after} sizes={sizes} cover />
          <span className={`${styles.tag} ${styles.tagAfter}`} aria-hidden="true">
            Après
          </span>
        </div>
        <span className={styles.handle} aria-hidden="true" />
        <input
          className={styles.range}
          type="range"
          min={0}
          max={100}
          step={1}
          value={position}
          onChange={(e) => setPosition(Number(e.target.value))}
          aria-label="Comparer la photo avant travaux et après travaux"
          aria-valuetext={`${100 - position} % avant travaux, ${position} % après travaux`}
        />
      </div>
      <figcaption className={styles.caption}>
        Avant : {before.alt}. Après : {after.alt}.
      </figcaption>
    </figure>
  );
}
