'use client';

import { PDF_MAX_UPLOAD_BYTES, type AdminPlanDto } from '@btp/shared';
import { useState } from 'react';
import { adminFetch, adminFetchBytes, uploadMedia, uploadPlanDocument } from '@/admin/lib/client';
import { formatBytes } from '@/admin/lib/compress';
import { errorMessage } from '@/admin/lib/useAdminData';
import styles from '@/admin/training/TeaserManager.module.css';
import { adminStyles as s } from '@/admin/ui';
import { PdfReader } from '@/components/media/PdfReader';
import { Icon } from '@/components/ui/Icon';
import { loadPdfJs, renderPage } from '@/lib/pdf';

/** Largeur de l'aperçu tiré de la 1re page : assez pour lire les cotes une fois agrandi. */
const PREVIEW_WIDTH = 2000;

/** Première page du PDF en JPEG, et nombre de pages. Tout se passe dans le navigateur. */
async function readPdf(file: File): Promise<{ pages: number; preview: Blob | null }> {
  const pdfjs = await loadPdfJs();
  const doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  try {
    const canvas = document.createElement('canvas');
    await renderPage(doc, 1, canvas, () => PREVIEW_WIDTH, 1);
    const preview = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.88));
    return { pages: doc.numPages, preview };
  } finally {
    void doc.loadingTask.destroy();
  }
}

class ReadError extends Error {}

type Step = { label: string; ratio: number } | null;

/**
 * Dossier PDF d'un plan. À l'envoi, la 1re page devient une image du plan (filigranée par
 * le serveur) : c'est l'aperçu affiché sur le site. Le PDF se lit ensuite dans la liseuse.
 */
export function PlanDocumentManager({
  plan,
  watermark,
  onChange,
}: {
  plan: AdminPlanDto;
  watermark: string;
  onChange: (plan: AdminPlanDto) => void;
}) {
  const [step, setStep] = useState<Step>(null);
  const [withPreview, setWithPreview] = useState(true);
  const [message, setMessage] = useState<{ tone: 'ok' | 'erreur'; text: string } | null>(null);
  const hasCover = plan.media.some((m) => m.kind === 'COVER');

  async function send(file: File) {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setMessage({
        tone: 'erreur',
        text: 'Ce fichier n’est pas un PDF. Pour un fichier Word, Excel ou AutoCAD, utilisez « Enregistrer sous » ou « Exporter » en PDF.',
      });
      return;
    }
    if (file.size > PDF_MAX_UPLOAD_BYTES) {
      setMessage({
        tone: 'erreur',
        text: `Le PDF pèse ${formatBytes(file.size)} : la limite est ${formatBytes(PDF_MAX_UPLOAD_BYTES)}. Réduisez-le (qualité « standard ») ou séparez-le.`,
      });
      return;
    }
    setMessage(null);
    setStep({ label: 'Lecture du PDF', ratio: 0 });
    try {
      let read: { pages: number; preview: Blob | null };
      try {
        read = await readPdf(file);
      } catch {
        throw new ReadError('Ce PDF n’a pas pu être ouvert. Il est peut-être protégé par un mot de passe ou endommagé.');
      }

      if (withPreview && read.preview) {
        setStep({ label: 'Envoi de l’aperçu (page 1)', ratio: 0 });
        await uploadMedia(
          read.preview,
          { alt: `Plan « ${plan.title} », page 1`, kind: hasCover ? 'GALLERY' : 'COVER', planId: plan.id },
          (ratio) => setStep({ label: 'Envoi de l’aperçu (page 1)', ratio }),
        );
      }

      setStep({ label: 'Envoi du PDF', ratio: 0 });
      // La réponse contient déjà l'aperçu dans les images du plan.
      onChange(
        await uploadPlanDocument<AdminPlanDto>(plan.id, file, read.pages, (ratio) => setStep({ label: 'Envoi du PDF', ratio })),
      );
      setMessage({
        tone: 'ok',
        text: `PDF enregistré (${read.pages} page${read.pages > 1 ? 's' : ''}).${
          withPreview && read.preview ? ' La première page a été ajoutée aux images du plan.' : ''
        }`,
      });
    } catch (e) {
      setMessage({ tone: 'erreur', text: e instanceof ReadError ? e.message : errorMessage(e) });
    } finally {
      setStep(null);
    }
  }

  async function remove() {
    if (!window.confirm('Retirer le PDF de ce plan ? Les images du plan sont conservées.')) return;
    try {
      onChange(await adminFetch<AdminPlanDto>(`/admin/plans/${plan.id}/document`, { method: 'DELETE' }));
      setMessage({ tone: 'ok', text: 'PDF retiré.' });
    } catch (e) {
      setMessage({ tone: 'erreur', text: errorMessage(e) });
    }
  }

  const doc = plan.document;

  return (
    <div className={styles.manager}>
      {message && (
        <p className={message.tone === 'ok' ? styles.ok : styles.err} role={message.tone === 'ok' ? 'status' : 'alert'}>
          {message.text}
        </p>
      )}

      {doc && (
        <div className={styles.current}>
          <p>
            <strong>{doc.name}</strong>
            <br />
            <span className={s.muted}>
              PDF{doc.pages ? ` · ${doc.pages} page${doc.pages > 1 ? 's' : ''}` : ''} · {formatBytes(doc.size)}
            </span>
          </p>
          <PdfReader
            key={doc.readPath} // PDF remplacé : nouvelle lecture
            source={() => adminFetchBytes(`/admin/plans/${plan.id}/document`)}
            title={plan.title}
            watermark={watermark}
            className={s.linkButton}
          >
            Prévisualiser comme sur le site
          </PdfReader>
          <button type="button" className={`${s.linkButton} ${s.danger}`} onClick={() => void remove()}>
            Retirer le PDF
          </button>
        </div>
      )}

      {step ? (
        <div className={styles.progress} role="status">
          <span>
            {step.label} : {Math.round(step.ratio * 100)} %
          </span>
          <progress max={1} value={step.ratio} />
          <span className={s.muted}>Gardez cette page ouverte jusqu’à la fin de l’envoi.</span>
        </div>
      ) : (
        <>
          <label className={styles.drop}>
            <Icon name="document" size={28} />
            <span className={styles.dropTitle}>{doc ? 'Remplacer le PDF' : 'Ajouter le PDF du plan'}</span>
            <span className={s.muted}>
              PDF, {formatBytes(PDF_MAX_UPLOAD_BYTES)} au plus. Word, Excel ou AutoCAD : exportez d’abord en PDF.
            </span>
            <input
              type="file"
              accept="application/pdf,.pdf"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (file) void send(file);
              }}
            />
          </label>
          <label className={styles.check}>
            <input type="checkbox" checked={withPreview} onChange={(e) => setWithPreview(e.target.checked)} />
            <span>
              Ajouter la première page aux images du plan
              {hasCover ? '' : ' (elle deviendra l’image de couverture)'}
            </span>
          </label>
        </>
      )}
    </div>
  );
}
