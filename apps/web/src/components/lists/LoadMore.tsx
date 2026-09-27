'use client';

import { Button } from '@/components/ui/Button';
import styles from './LoadMore.module.css';

interface LoadMoreProps {
  remaining: number;
  loading: boolean;
  error: boolean;
  onLoad: () => void;
  /** « formations », « plans »… */
  noun: string;
}

/** Bouton « Charger plus » avec le nombre restant et un message clair en cas de coupure réseau. */
export function LoadMore({ remaining, loading, error, onLoad, noun }: LoadMoreProps) {
  if (remaining === 0 && !error) return null;
  return (
    <div className={styles.more}>
      {error && (
        <p className={styles.error} role="alert">
          Le chargement a échoué : la connexion semble coupée. Vérifiez votre réseau puis réessayez.
        </p>
      )}
      {remaining > 0 && (
        <Button variant="trait" onClick={onLoad} disabled={loading}>
          {loading ? 'Chargement…' : `Charger plus de ${noun} (${remaining} restant${remaining > 1 ? 's' : ''})`}
        </Button>
      )}
    </div>
  );
}
