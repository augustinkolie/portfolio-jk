import type { MediaDto, TeaserDto } from '@btp/shared';
import styles from './VideoTeaser.module.css';

/** Poids lisible : « 310 Ko », « 5,2 Mo ». */
function megabytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} Ko`;
  return `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} Mo`;
}

/**
 * Extrait vidéo d'une formation. `preload="none"` : rien n'est téléchargé avant le clic
 * sur lecture (connexion 3G), seule l'image de couverture s'affiche. Le poids est indiqué
 * pour que le visiteur décide en connaissance de cause.
 */
export function VideoTeaser({ teaser, poster, title }: { teaser: TeaserDto; poster: MediaDto | null; title: string }) {
  const posterUrl = poster?.sources.webp.find((s) => s.width >= 800)?.url ?? poster?.sources.webp.at(-1)?.url;
  return (
    <figure className={styles.figure}>
      <video
        className={styles.video}
        controls
        preload="none"
        playsInline
        poster={posterUrl}
        aria-label={`Extrait vidéo : ${title}`}
      >
        <source src={teaser.url} type={teaser.mime} />
        <p>
          Votre navigateur ne lit pas cette vidéo. <a href={teaser.url}>Télécharger l’extrait</a> (
          {megabytes(teaser.size)}).
        </p>
      </video>
      <figcaption className={styles.caption}>
        Extrait de la formation · <span className="num">{megabytes(teaser.size)}</span>, chargé seulement si vous lancez
        la lecture.
      </figcaption>
    </figure>
  );
}
