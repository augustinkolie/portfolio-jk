import type { CSSProperties, ReactNode } from 'react';
import styles from './DimensionLine.module.css';

interface DimensionLineProps {
  /** Valeur de la cote : « 2 400 m² », « 12 km »… ou contenu composé (chiffre + libellé). */
  children: ReactNode;
  orientation?: 'horizontal' | 'vertical';
  /** acier sur béton, plan (blanc) sur cyanotype. */
  tone?: 'acier' | 'plan';
  /**
   * Longueur relative de 0 à 1 (horizontal uniquement) : une cote de 12 km est plus
   * longue qu'une cote de 6 km. Par défaut, toute la largeur disponible.
   */
  length?: number;
  /**
   * Trace la cote au chargement (§3.6). Réservé au hero de l'accueil :
   * c'est le seul moment orchestré du site.
   */
  draw?: boolean;
  /** Décalage du tracé en secondes, pour enchaîner plusieurs cotes. */
  delay?: number;
  /** Grande valeur (bloc chiffres) au lieu d'une légende discrète. */
  size?: 'legende' | 'chiffre';
  className?: string;
}

/**
 * Ligne de cote d'un plan : deux lignes d'attache, deux traits obliques,
 * la valeur au-dessus. Le trait est tracé du centre vers les extrémités.
 */
export function DimensionLine({
  children,
  orientation = 'horizontal',
  tone = 'acier',
  length = 1,
  draw = false,
  delay = 0,
  size = 'legende',
  className,
}: DimensionLineProps) {
  const style = {
    '--longueur': `${Math.round(Math.min(Math.max(length, 0.05), 1) * 1000) / 10}%`,
    '--delai': `${delay}s`,
  } as CSSProperties;

  const classes = [
    styles.dim,
    styles[orientation],
    styles[tone],
    styles[size],
    draw && styles.draw,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const vertical = orientation === 'vertical';

  return (
    <div className={classes} style={style}>
      <div className={styles.value}>{children}</div>
      <div className={styles.track}>
        <svg className={styles.svg} aria-hidden="true" focusable="false">
          {vertical ? (
            <>
              <line x1="50%" y1="50%" x2="50%" y2="0" pathLength={1} />
              <line x1="50%" y1="50%" x2="50%" y2="100%" pathLength={1} />
            </>
          ) : (
            <>
              <line x1="50%" y1="50%" x2="0" y2="50%" pathLength={1} />
              <line x1="50%" y1="50%" x2="100%" y2="50%" pathLength={1} />
            </>
          )}
        </svg>
        <span className={`${styles.end} ${styles.start}`} aria-hidden="true" />
        <span className={`${styles.end} ${styles.finish}`} aria-hidden="true" />
      </div>
    </div>
  );
}
