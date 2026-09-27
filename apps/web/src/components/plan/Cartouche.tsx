import type { ReactNode } from 'react';
import styles from './Cartouche.module.css';

export interface CartoucheRow {
  label: string;
  value: ReactNode;
}

interface CartoucheProps {
  /** Titre du bloc, lu comme nom de la région par les lecteurs d'écran. */
  title: string;
  rows: CartoucheRow[];
  /** Référence du document : « PRJ-2022-014 ». */
  reference?: string;
  /** Mention de feuille : « Feuille 1/1 ». */
  sheet?: string;
  tone?: 'acier' | 'plan';
  className?: string;
}

/**
 * Cartouche de plan (bloc d'identification en bas à droite d'un tirage) :
 * fiche technique d'un projet, coordonnées du pied de page.
 * Les lignes sans valeur ne sont pas affichées.
 */
export function Cartouche({
  title,
  rows,
  reference,
  sheet,
  tone = 'acier',
  className,
}: CartoucheProps) {
  const filled = rows.filter(
    (r) => r.value !== null && r.value !== undefined && r.value !== '' && r.value !== false,
  );
  return (
    <section
      className={[styles.cartouche, styles[tone], className].filter(Boolean).join(' ')}
      aria-label={title}
    >
      <p className={styles.title} aria-hidden="true">
        {title}
      </p>
      <dl className={styles.rows}>
        {filled.map((row) => (
          <div className={styles.row} key={row.label}>
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
      {(reference || sheet) && (
        <p className={styles.footer}>
          {reference && <span>Réf. {reference}</span>}
          {sheet && <span>{sheet}</span>}
        </p>
      )}
    </section>
  );
}

/** Statut d'un projet : carré plein = livré, carré vide = en cours. Jamais de couleur (§3.3). */
export function StatusMark({ delivered }: { delivered: boolean }) {
  return (
    <span className={styles.status}>
      <span className={delivered ? styles.squareFull : styles.squareEmpty} aria-hidden="true" />
      {delivered ? 'Livré' : 'En cours'}
    </span>
  );
}
