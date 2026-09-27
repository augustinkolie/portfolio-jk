import type { ImageSource, MediaDto } from '@btp/shared';
import { getImageProps } from 'next/image';
import { preload } from 'react-dom';
import styles from './ProjectImage.module.css';

interface ProjectImageProps {
  media: MediaDto;
  /** Attribut `sizes` : largeur réelle d'affichage, pour que le navigateur choisisse la bonne variante. */
  sizes: string;
  /** Image LCP (hero, photo principale d'un projet) : chargée en priorité. Une seule par page. */
  priority?: boolean;
  /** Remplit son conteneur (qui fixe le ratio) en recadrant, au lieu de garder son ratio d'origine. */
  cover?: boolean;
  className?: string;
}

function srcSet(sources: ImageSource[]): string {
  return sources.map((s) => `${s.url} ${s.width}w`).join(', ');
}

/**
 * Photo produite par l'API : variantes AVIF et WebP déjà générées (400 → 1920 px).
 * next/image fournit les attributs (dimensions réservées, flou, chargement différé) ;
 * le <picture> sert l'AVIF aux navigateurs qui le lisent et le WebP aux autres,
 * sans second traitement de l'image côté Next.js.
 */
export function ProjectImage({ media, sizes, priority = false, cover = false, className }: ProjectImageProps) {
  const { avif, webp } = media.sources;
  const fallback = webp[webp.length - 1] ?? avif[avif.length - 1];
  if (!fallback) return null;

  const { props } = getImageProps({
    src: fallback.url,
    alt: media.alt,
    width: media.width,
    height: media.height,
    sizes,
    unoptimized: true,
    loading: priority ? 'eager' : 'lazy',
    fetchPriority: priority ? 'high' : undefined,
    placeholder: media.blurData ? 'blur' : 'empty',
    blurDataURL: media.blurData || undefined,
  });

  if (priority && avif.length > 0) {
    preload(fallback.url, {
      as: 'image',
      imageSrcSet: srcSet(avif),
      imageSizes: sizes,
      type: 'image/avif',
      fetchPriority: 'high',
    });
  }

  return (
    <picture className={[styles.picture, cover && styles.cover, className].filter(Boolean).join(' ')}>
      {avif.length > 0 && <source type="image/avif" srcSet={srcSet(avif)} sizes={sizes} />}
      {webp.length > 0 && <source type="image/webp" srcSet={srcSet(webp)} sizes={sizes} />}
      <img {...props} className={styles.img} />
    </picture>
  );
}
