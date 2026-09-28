/**
 * pdf.js (Mozilla) chargé à la demande : ~1 Mo qui n'est téléchargé que lorsqu'on ouvre
 * un plan PDF ou qu'on en envoie un dans l'admin. Navigateur uniquement.
 *
 * Version « legacy » : la version standard de pdf.js 6 exige les toutes dernières versions
 * des navigateurs (Map.getOrInsertComputed, Math.sumPrecise…) et échoue ailleurs. La version
 * legacy embarque ces compléments : indispensable pour les téléphones et PC pas à jour.
 */
export type PdfJs = typeof import('pdfjs-dist/legacy/build/pdf.mjs');
export type PdfDocument = Awaited<ReturnType<PdfJs['getDocument']>['promise']>;

let loading: Promise<PdfJs> | null = null;

export function loadPdfJs(): Promise<PdfJs> {
  loading ??= import('pdfjs-dist/legacy/build/pdf.mjs')
    .then((pdfjs) => {
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/legacy/build/pdf.worker.min.mjs',
        import.meta.url,
      ).toString();
      return pdfjs;
    })
    .catch((error: unknown) => {
      loading = null; // un nouvel essai retélécharge le module
      throw error;
    });
  return loading;
}

/**
 * Dessine une page dans un canevas. `cssWidth` reçoit la taille de la page (en points PDF)
 * et renvoie la largeur d'affichage voulue ; la résolution suit l'écran (Retina compris).
 */
export async function renderPage(
  doc: PdfDocument,
  pageNumber: number,
  canvas: HTMLCanvasElement,
  cssWidth: (pageWidth: number, pageHeight: number) => number,
  maxPixelRatio = 2,
): Promise<void> {
  const page = await doc.getPage(pageNumber);
  const base = page.getViewport({ scale: 1 });
  const width = cssWidth(base.width, base.height);
  const ratio = Math.min(window.devicePixelRatio || 1, maxPixelRatio);
  // Plafond de 16 millions de pixels : au-delà, certains téléphones refusent le canevas.
  const cap = Math.sqrt(16_000_000 / (base.width * base.height));
  const viewport = page.getViewport({ scale: Math.min((width / base.width) * ratio, cap) });
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  canvas.style.width = `${Math.round(width)}px`;
  canvas.style.height = `${Math.round((width * base.height) / base.width)}px`;
  await page.render({ canvas, viewport }).promise;
}
