'use client';

import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Icon } from '@/components/ui/Icon';
import { loadPdfJs, renderPage, type PdfDocument } from '@/lib/pdf';
import styles from './PdfReader.module.css';

const ZOOMS = [0.5, 0.75, 1, 1.5, 2, 3, 4];

/** Filigrane répété par-dessus la page affichée (le PDF lui-même n'est pas modifié). */
function watermarkBackground(text: string): string {
  const safe = text.replace(/[<>&"]/g, '');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="340" height="220"><text x="170" y="110" text-anchor="middle" dominant-baseline="middle" transform="rotate(-30 170 110)" font-family="Arial, sans-serif" font-size="20" font-weight="700" fill="rgb(31,58,95)" fill-opacity="0.16">${safe}</text></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

interface PdfReaderProps {
  url: string;
  title: string;
  /** Texte du filigrane, ex. « © Jérôme Kolié ». */
  watermark: string;
  /** Contenu du bouton qui ouvre la liseuse. */
  children: ReactNode;
  className?: string;
}

/**
 * Liseuse PDF intégrée au site : <dialog> plein écran, une page à la fois,
 * zoom, flèches ← → et touches + / − au clavier. Pas de bouton de téléchargement.
 * pdf.js n'est chargé qu'au premier clic.
 */
export function PdfReader({ url, title, watermark, children, className }: PdfReaderProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const chain = useRef<Promise<void>>(Promise.resolve());
  const [open, setOpen] = useState(false);
  const [doc, setDoc] = useState<PdfDocument | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(2); // index dans ZOOMS : 100 % = page entière à l'écran
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [rendering, setRendering] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  // Premier affichage : chargement de pdf.js puis du document.
  useEffect(() => {
    if (!open || doc || status === 'loading') return;
    setStatus('loading');
    let cancelled = false;
    (async () => {
      try {
        const pdfjs = await loadPdfJs();
        const loaded = await pdfjs.getDocument({ url }).promise;
        if (cancelled) {
          void loaded.loadingTask.destroy();
          return;
        }
        setDoc(loaded);
        setStatus('ready');
      } catch (error) {
        console.error('Liseuse PDF : chargement impossible', error);
        if (!cancelled) setStatus('error');
      }
    })();
    return () => {
      // Liseuse fermée avant la fin du chargement : on recommencera à la prochaine ouverture.
      cancelled = true;
      setStatus((s) => (s === 'loading' ? 'idle' : s));
    };
  }, [open, url, attempt]); // doc et status volontairement absents : un chargement par ouverture ou essai

  useEffect(() => () => void doc?.loadingTask.destroy(), [doc]);

  // Taille disponible pour la page (suit la rotation du téléphone).
  useEffect(() => {
    const el = stage.current;
    if (!open || !el) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setSize({ w: entry.contentRect.width, h: entry.contentRect.height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [open, status]);

  // Rendu de la page : les rendus sont enchaînés (pdf.js refuse deux rendus simultanés sur un canevas).
  useEffect(() => {
    const target = canvas.current;
    if (!doc || !target || !size) return;
    let stale = false;
    setRendering(true);
    chain.current = chain.current
      .then(async () => {
        if (stale) return;
        await renderPage(doc, page, target, (w, h) => Math.min(size.w, (size.h * w) / h) * ZOOMS[zoom]!);
      })
      .catch((error: unknown) => {
        console.error('Liseuse PDF : affichage de la page impossible', error);
        setStatus('error');
      })
      .finally(() => !stale && setRendering(false));
    return () => {
      stale = true;
    };
  }, [doc, page, zoom, size]);

  const pages = doc?.numPages ?? 0;

  function go(delta: number) {
    setPage((p) => Math.min(Math.max(1, p + delta), Math.max(1, pages)));
    stage.current?.scrollTo({ top: 0, left: 0 });
  }

  function zoomBy(delta: number) {
    setZoom((z) => Math.min(Math.max(0, z + delta), ZOOMS.length - 1));
  }

  function close() {
    setOpen(false);
    trigger.current?.focus();
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'ArrowRight' || e.key === 'PageDown') go(1);
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') go(-1);
    else if (e.key === '+' || e.key === '=') zoomBy(1);
    else if (e.key === '-') zoomBy(-1);
    else return;
    e.preventDefault();
  }

  return (
    <>
      <button type="button" ref={trigger} className={className} onClick={() => setOpen(true)}>
        {children}
      </button>

      <dialog
        ref={dialog}
        className={styles.dialog}
        aria-label={`Plan — ${title}`}
        onClose={() => open && close()}
        onKeyDown={onKeyDown}
      >
        {open && (
          <div className={styles.viewer}>
            <div className={styles.bar}>
              <p className={styles.title}>{title}</p>
              <button type="button" className={styles.control} onClick={close}>
                <Icon name="close" size={24} />
                <span>Fermer</span>
              </button>
            </div>

            <div className={styles.stage} ref={stage}>
              {status === 'loading' && <p className={styles.state} role="status">Ouverture du plan…</p>}
              {status === 'error' && (
                <div className={styles.state} role="alert">
                  <p>Le plan n’a pas pu être affiché. Vérifiez votre connexion, puis réessayez.</p>
                  <button
                    type="button"
                    className={styles.control}
                    onClick={() => {
                      // Document déjà chargé : seul l'affichage a échoué, on le relance.
                      setStatus(doc ? 'ready' : 'idle');
                      setAttempt((n) => n + 1);
                      setSize((s) => (s ? { ...s } : s));
                    }}
                  >
                    Réessayer
                  </button>
                </div>
              )}
              <div className={styles.sheet} hidden={status !== 'ready'} aria-busy={rendering}>
                <canvas
                  ref={canvas}
                  className={styles.canvas}
                  role="img"
                  aria-label={`${title}, page ${page} sur ${pages}`}
                  onContextMenu={(e) => e.preventDefault()}
                />
                <div className={styles.watermark} style={{ backgroundImage: watermarkBackground(watermark) }} aria-hidden="true" />
              </div>
            </div>

            <div className={styles.tools}>
              <div className={styles.group}>
                <button type="button" className={styles.control} onClick={() => go(-1)} disabled={page <= 1}>
                  <Icon name="chevron-left" size={24} />
                  <span className={styles.wide}>Précédente</span>
                </button>
                <p className={`${styles.counter} num`} aria-live="polite">
                  Page {page} / {pages || '…'}
                </p>
                <button type="button" className={styles.control} onClick={() => go(1)} disabled={page >= pages}>
                  <span className={styles.wide}>Suivante</span>
                  <Icon name="chevron-right" size={24} />
                </button>
              </div>
              <div className={styles.group}>
                <button type="button" className={styles.control} onClick={() => zoomBy(-1)} disabled={zoom === 0} aria-label="Réduire">
                  <Icon name="minus" size={24} />
                </button>
                <button type="button" className={`${styles.control} num`} onClick={() => setZoom(2)} aria-label="Taille ajustée à l’écran">
                  {Math.round(ZOOMS[zoom]! * 100)} %
                </button>
                <button type="button" className={styles.control} onClick={() => zoomBy(1)} disabled={zoom === ZOOMS.length - 1} aria-label="Agrandir">
                  <Icon name="plus" size={24} />
                </button>
              </div>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
