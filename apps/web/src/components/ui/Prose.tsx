import styles from './Prose.module.css';

/**
 * Texte riche saisi dans l'admin (titres, gras, listes, liens). Le HTML est nettoyé
 * côté API avec une liste blanche : seules ces balises peuvent arriver ici.
 */
export function Prose({ html, className }: { html: string; className?: string }) {
  if (!html.trim()) return null;
  return (
    <div
      className={[styles.prose, className].filter(Boolean).join(' ')}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
