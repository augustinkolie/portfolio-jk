import type { ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import styles from './ui.module.css';

/** Titre de page de l'admin, avec actions à droite (« Ajouter un projet »…). */
export function PageHeader({ title, actions, children }: { title: string; actions?: ReactNode; children?: ReactNode }) {
  return (
    <header className={styles.header}>
      <div className={styles.headerText}>
        <h1 className={styles.title}>{title}</h1>
        {children}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </header>
  );
}

/** Message de retour : succès (« Projet publié ») ou erreur (ce qui s'est passé, comment corriger). */
export function Notice({ tone, children }: { tone: 'ok' | 'erreur'; children: ReactNode }) {
  return (
    <p className={`${styles.notice} ${tone === 'ok' ? styles.ok : styles.error}`} role={tone === 'ok' ? 'status' : 'alert'}>
      {children}
    </p>
  );
}

/** Bloc de formulaire titré : « Informations », « Photos », « Coordonnées »… */
export function Panel({ title, children, id }: { title: string; children: ReactNode; id?: string }) {
  return (
    <section className={styles.panel} aria-labelledby={id}>
      <h2 className={styles.panelTitle} id={id}>
        {title}
      </h2>
      {children}
    </section>
  );
}

/** Pastille de statut : Publié / Brouillon, Nouveau / Lu / Traité. */
export function Tag({ children, strong = false }: { children: ReactNode; strong?: boolean }) {
  return <span className={`${styles.tag} ${strong ? styles.tagStrong : ''}`}>{children}</span>;
}

/** Pagination des listes de l'admin. Masquée quand tout tient sur une page. */
export function Pager({
  page,
  total,
  limit,
  onChange,
}: {
  page: number;
  total: number;
  limit: number;
  onChange: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / limit));
  if (pages <= 1) return null;
  const go = (next: number) => {
    onChange(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  return (
    <nav className={styles.pager} aria-label="Pages">
      <Button variant="trait" onClick={() => go(page - 1)} disabled={page <= 1}>
        Précédents
      </Button>
      <span className="num">
        Page {page} sur {pages}
      </span>
      <Button variant="trait" onClick={() => go(page + 1)} disabled={page >= pages}>
        Suivants
      </Button>
    </nav>
  );
}

export { styles as adminStyles };
