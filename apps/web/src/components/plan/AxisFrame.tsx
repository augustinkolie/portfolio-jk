import type { ReactNode } from 'react';
import styles from './AxisFrame.module.css';

interface AxisFrameProps {
  children: ReactNode;
  /** Repères des axes verticaux, de gauche à droite : ['A', 'B', 'C', 'D']. */
  columns: string[];
  /** Repères des axes horizontaux, de haut en bas : ['1', '2']. Masqués sur mobile. */
  rows?: string[];
  className?: string;
}

/**
 * Trame d'axes d'un plan de structure : bulles lettrées en tête, bulles chiffrées
 * à gauche, traits d'axe en tirets. Structure discrètement le hero et la page
 * À propos, et seulement elles (§3.2). Purement graphique : masquée aux lecteurs d'écran.
 */
export function AxisFrame({ children, columns, rows = [], className }: AxisFrameProps) {
  return (
    <div className={[styles.frame, rows.length > 0 && styles.withRows, className].filter(Boolean).join(' ')}>
      <div className={styles.columns} aria-hidden="true">
        {columns.map((c) => (
          <span className={styles.column} key={c}>
            <span className={styles.bubble}>{c}</span>
          </span>
        ))}
      </div>
      {rows.length > 0 && (
        <div className={styles.rows} aria-hidden="true">
          {rows.map((r) => (
            <span className={styles.row} key={r}>
              <span className={styles.bubble}>{r}</span>
            </span>
          ))}
        </div>
      )}
      <div className={styles.content}>{children}</div>
    </div>
  );
}
