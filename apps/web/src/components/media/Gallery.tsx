'use client';

import type { MediaDto } from '@btp/shared';
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { Icon } from '@/components/ui/Icon';
import { ProjectImage } from './ProjectImage';
import styles from './Gallery.module.css';

const SWIPE_MIN_PX = 50;

/**
 * Galerie + visionneuse plein écran (§4.3). <dialog> natif : focus piégé,
 * Échap pour fermer, retour du focus à la vignette d'origine.
 * Flèches ← → au clavier, balayage au doigt sur mobile.
 */
export function Gallery({ media, title }: { media: MediaDto[]; title: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const triggers = useRef<(HTMLButtonElement | null)[]>([]);
  const swipeStart = useRef<number | null>(null);
  const [index, setIndex] = useState<number | null>(null);
  const current = index === null ? null : media[index];

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (index !== null && !el.open) el.showModal();
    if (index === null && el.open) el.close();
  }, [index]);

  function open(i: number) {
    setIndex(i);
  }

  function close() {
    const from = index;
    setIndex(null);
    if (from !== null) triggers.current[from]?.focus();
  }

  function go(delta: number) {
    setIndex((i) => (i === null ? i : (i + delta + media.length) % media.length));
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'ArrowRight') go(1);
    if (e.key === 'ArrowLeft') go(-1);
  }

  function onPointerDown(e: PointerEvent) {
    if (e.pointerType === 'touch') swipeStart.current = e.clientX;
  }

  function onPointerUp(e: PointerEvent) {
    if (swipeStart.current === null) return;
    const dx = e.clientX - swipeStart.current;
    swipeStart.current = null;
    if (Math.abs(dx) >= SWIPE_MIN_PX) go(dx < 0 ? 1 : -1);
  }

  if (media.length === 0) return null;

  return (
    <>
      <ul className={styles.grid}>
        {media.map((m, i) => (
          <li key={m.id}>
            <button
              type="button"
              className={styles.thumb}
              ref={(el) => {
                triggers.current[i] = el;
              }}
              onClick={() => open(i)}
              aria-label={`Agrandir la photo ${i + 1} sur ${media.length} : ${m.alt}`}
            >
              <ProjectImage
                media={m}
                sizes="(min-width: 64rem) 25vw, (min-width: 48rem) 33vw, 50vw"
                cover
              />
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialog}
        className={styles.dialog}
        aria-label={`Photos — ${title}`}
        onClose={() => index !== null && close()}
        onKeyDown={onKeyDown}
      >
        {current && index !== null && (
          <div className={styles.viewer}>
            <div className={styles.bar}>
              <p className={`${styles.counter} num`} aria-live="polite">
                {index + 1} / {media.length}
              </p>
              <button type="button" className={styles.control} onClick={close}>
                <Icon name="close" size={24} />
                <span>Fermer</span>
              </button>
            </div>
            <figure
              className={styles.stage}
              onPointerDown={onPointerDown}
              onPointerUp={onPointerUp}
            >
              <ProjectImage key={current.id} media={current} sizes="100vw" className={styles.full} />
              <figcaption className={styles.caption}>{current.alt}</figcaption>
            </figure>
            {media.length > 1 && (
              <div className={styles.nav}>
                <button type="button" className={styles.control} onClick={() => go(-1)}>
                  <Icon name="chevron-left" size={24} />
                  <span>Précédente</span>
                </button>
                <button type="button" className={styles.control} onClick={() => go(1)}>
                  <span>Suivante</span>
                  <Icon name="chevron-right" size={24} />
                </button>
              </div>
            )}
          </div>
        )}
      </dialog>
    </>
  );
}
