import styles from './SkipLink.module.css';

/** Premier élément focalisable de chaque page : saute la navigation. */
export function SkipLink() {
  return (
    <a className={styles.skip} href="#contenu">
      Aller au contenu
    </a>
  );
}
