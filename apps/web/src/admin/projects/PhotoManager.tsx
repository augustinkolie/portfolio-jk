'use client';

import type { MediaDto, MediaKind } from '@btp/shared';
import { useEffect, useRef, useState, type DragEvent } from 'react';
import { adminFetch, uploadMedia } from '@/admin/lib/client';
import { compressImage, formatBytes } from '@/admin/lib/compress';
import { errorMessage } from '@/admin/lib/useAdminData';
import { adminStyles as s } from '@/admin/ui';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import styles from './PhotoManager.module.css';

const KIND_LABELS: Record<MediaKind, string> = {
  COVER: 'Photo principale',
  GALLERY: 'Galerie',
  BEFORE: 'Avant travaux',
  AFTER: 'Après travaux',
};
const KINDS = Object.keys(KIND_LABELS) as MediaKind[];

interface Pending {
  key: string;
  file: File;
  preview: string;
  alt: string;
  kind: MediaKind;
  state: 'attente' | 'compression' | 'envoi' | 'erreur';
  progress: number;
  error?: string;
}

export type PhotoOwner = { type: 'project' | 'course' | 'plan'; id: string };

const OWNER_PATH = { project: 'projects', course: 'courses', plan: 'plans' } as const;
const OWNER_FIELD = { project: 'projectId', course: 'courseId', plan: 'planId' } as const;

interface PhotoManagerProps {
  owner: PhotoOwner;
  media: MediaDto[];
  onChange: (media: MediaDto[]) => void;
  /** Types proposés : les plans et formations n'ont pas d'« avant / après ». */
  kinds?: MediaKind[];
  /** Consigne affichée dans la zone d'envoi. */
  note?: string;
}

const thumb = (m: MediaDto) => m.sources.webp[0]?.url ?? m.sources.avif[0]?.url ?? '';

export function PhotoManager({ owner, media, onChange, kinds = KINDS, note }: PhotoManagerProps) {
  const [pending, setPending] = useState<Pending[]>([]);
  const [message, setMessage] = useState<{ tone: 'ok' | 'erreur'; text: string } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const mediaRef = useRef(media);
  mediaRef.current = media;
  const previews = useRef(new Set<string>());

  // Libère les aperçus locaux encore ouverts quand le composant disparaît.
  useEffect(() => {
    const open = previews.current;
    return () => open.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  function preview(file: File): string {
    const url = URL.createObjectURL(file);
    previews.current.add(url);
    return url;
  }

  function addFiles(files: FileList | File[]) {
    const images = [...files].filter((f) => f.type.startsWith('image/') || /\.(heic|heif)$/i.test(f.name));
    if (images.length === 0) {
      setMessage({ tone: 'erreur', text: 'Aucune photo dans la sélection. Formats acceptés : JPEG, PNG, WebP, AVIF.' });
      return;
    }
    const hasCover = media.some((m) => m.kind === 'COVER') || pending.some((p) => p.kind === 'COVER');
    setPending((prev) => [
      ...prev,
      ...images.map((file, i) => ({
        key: `${file.name}-${file.size}-${Date.now()}-${i}`,
        file,
        preview: preview(file),
        alt: '',
        kind: (!hasCover && i === 0 ? 'COVER' : 'GALLERY') as MediaKind,
        state: 'attente' as const,
        progress: 0,
      })),
    ]);
    setMessage(null);
  }

  function update(key: string, patch: Partial<Pending>) {
    setPending((prev) => prev.map((p) => (p.key === key ? { ...p, ...patch } : p)));
  }

  function removePending(key: string) {
    setPending((prev) => {
      const item = prev.find((p) => p.key === key);
      if (item) {
        URL.revokeObjectURL(item.preview);
        previews.current.delete(item.preview);
      }
      return prev.filter((p) => p.key !== key);
    });
  }

  /** Envoie les photos une par une (connexion lente : pas d'envois parallèles). */
  async function sendAll() {
    const queue = pending.filter((p) => p.state === 'attente' || p.state === 'erreur');
    const missingAlt = queue.filter((p) => p.alt.trim().length < 3);
    if (missingAlt.length > 0) {
      missingAlt.forEach((p) => update(p.key, { state: 'erreur', error: 'Décrivez la photo (3 caractères au moins).' }));
      setMessage({
        tone: 'erreur',
        text: `Texte alternatif manquant pour ${missingAlt.length} photo${missingAlt.length > 1 ? 's' : ''} : décrivez ce qu’elle montre.`,
      });
      return;
    }

    let sent = 0;
    for (const item of queue) {
      try {
        update(item.key, { state: 'compression', error: undefined });
        const blob = await compressImage(item.file);
        update(item.key, { state: 'envoi', progress: 0 });
        const created = await uploadMedia(blob, { alt: item.alt.trim(), kind: item.kind, [OWNER_FIELD[owner.type]]: owner.id }, (ratio) =>
          update(item.key, { progress: ratio }),
        );
        // Une nouvelle photo principale remplace l'ancienne (même règle que l'API).
        const next = mediaRef.current.map((m) =>
          created.kind === 'COVER' && m.kind === 'COVER' ? { ...m, kind: 'GALLERY' as const } : m,
        );
        onChange([...next, created]);
        removePending(item.key);
        sent++;
      } catch (e) {
        update(item.key, { state: 'erreur', error: errorMessage(e) });
      }
    }
    if (sent > 0) setMessage({ tone: 'ok', text: `${sent} photo${sent > 1 ? 's envoyées' : ' envoyée'}.` });
  }

  async function patchMedia(m: MediaDto, patch: { alt?: string; kind?: MediaKind }) {
    try {
      const updated = await adminFetch<MediaDto>(`/admin/media/${m.id}`, { method: 'PATCH', json: patch });
      onChange(
        media.map((x) =>
          x.id === m.id ? updated : patch.kind === 'COVER' && x.kind === 'COVER' ? { ...x, kind: 'GALLERY' } : x,
        ),
      );
      setMessage({ tone: 'ok', text: 'Photo mise à jour.' });
    } catch (e) {
      setMessage({ tone: 'erreur', text: errorMessage(e) });
    }
  }

  async function reorder(from: number, to: number) {
    if (to < 0 || to >= media.length || from === to) return;
    const next = [...media];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved!);
    onChange(next);
    try {
      onChange(
        await adminFetch<MediaDto[]>(`/admin/${OWNER_PATH[owner.type]}/${owner.id}/media/order`, {
          method: 'PUT',
          json: { ids: next.map((m) => m.id) },
        }),
      );
    } catch (e) {
      onChange(media);
      setMessage({ tone: 'erreur', text: errorMessage(e) });
    }
  }

  async function remove(m: MediaDto) {
    if (!window.confirm(`Supprimer cette photo ?\n« ${m.alt} »\n\nCette action est définitive.`)) return;
    try {
      await adminFetch<void>(`/admin/media/${m.id}`, { method: 'DELETE' });
      onChange(media.filter((x) => x.id !== m.id));
      setMessage({ tone: 'ok', text: 'Photo supprimée.' });
    } catch (e) {
      setMessage({ tone: 'erreur', text: errorMessage(e) });
    }
  }

  function onDrop(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  }

  const busy = pending.some((p) => p.state === 'compression' || p.state === 'envoi');

  return (
    <div className={styles.manager}>
      {message && (
        <p className={message.tone === 'ok' ? styles.ok : styles.err} role={message.tone === 'ok' ? 'status' : 'alert'}>
          {message.text}
        </p>
      )}

      {media.length > 0 && (
        <ol className={styles.grid} aria-label="Photos du projet, dans l’ordre d’affichage">
          {media.map((m, i) => (
            <li
              key={m.id}
              className={`${styles.item} ${dragIndex === i ? styles.dragging : ''}`}
              draggable
              onDragStart={() => setDragIndex(i)}
              onDragEnd={() => setDragIndex(null)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (dragIndex !== null) void reorder(dragIndex, i);
                setDragIndex(null);
              }}
            >
              <div className={styles.thumb}>
                <img src={thumb(m)} alt="" width={m.width} height={m.height} loading="lazy" />
                {m.kind === 'COVER' && <span className={styles.badge}>Photo principale</span>}
              </div>
              <label className={styles.small}>
                Texte alternatif
                <input
                  className={styles.input}
                  defaultValue={m.alt}
                  onBlur={(e) => {
                    const alt = e.target.value.trim();
                    if (alt !== m.alt && alt.length >= 3) void patchMedia(m, { alt });
                  }}
                />
              </label>
              <label className={styles.small}>
                Type
                <select
                  className={styles.input}
                  value={m.kind}
                  onChange={(e) => void patchMedia(m, { kind: e.target.value as MediaKind })}
                >
                  {kinds.map((k) => (
                    <option key={k} value={k}>
                      {KIND_LABELS[k]}
                    </option>
                  ))}
                </select>
              </label>
              <div className={styles.itemActions}>
                <button type="button" className={s.iconButton} onClick={() => void reorder(i, i - 1)} disabled={i === 0} aria-label={`Monter la photo ${i + 1}`}>
                  <Icon name="chevron-left" />
                </button>
                <span className={`${styles.position} num`}>{i + 1}</span>
                <button type="button" className={s.iconButton} onClick={() => void reorder(i, i + 1)} disabled={i === media.length - 1} aria-label={`Descendre la photo ${i + 1}`}>
                  <Icon name="chevron-right" />
                </button>
                <button type="button" className={`${s.linkButton} ${s.danger}`} onClick={() => void remove(m)}>
                  Supprimer
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}

      <label
        className={`${styles.drop} ${dragOver ? styles.dropActive : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        <Icon name="plus" size={28} />
        <span className={styles.dropTitle}>Ajouter des photos</span>
        <span className={s.muted}>
          {note ?? 'Glissez-les ici ou touchez pour choisir. Elles sont réduites avant l’envoi.'}
        </span>
        <input
          ref={input}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </label>

      {pending.length > 0 && (
        <div className={styles.pending}>
          <h3 className={styles.pendingTitle}>À envoyer ({pending.length})</h3>
          <ul className={styles.pendingList}>
            {pending.map((p) => (
              <li key={p.key} className={styles.pendingItem}>
                <img src={p.preview} alt="" className={styles.preview} />
                <div className={styles.pendingFields}>
                  <label className={styles.small}>
                    Texte alternatif (obligatoire)
                    <input
                      className={styles.input}
                      value={p.alt}
                      placeholder="Ex. Coulage de la dalle du 2e étage"
                      aria-invalid={p.state === 'erreur' && p.alt.trim().length < 3 ? true : undefined}
                      onChange={(e) => update(p.key, { alt: e.target.value })}
                      disabled={p.state === 'compression' || p.state === 'envoi'}
                    />
                  </label>
                  <label className={styles.small}>
                    Type
                    <select
                      className={styles.input}
                      value={p.kind}
                      onChange={(e) => update(p.key, { kind: e.target.value as MediaKind })}
                      disabled={p.state === 'compression' || p.state === 'envoi'}
                    >
                      {kinds.map((k) => (
                        <option key={k} value={k}>
                          {KIND_LABELS[k]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <p className={s.muted}>
                    {p.file.name} · {formatBytes(p.file.size)}
                    {p.state === 'compression' && ' · réduction…'}
                    {p.state === 'envoi' && ` · envoi ${Math.round(p.progress * 100)} %`}
                  </p>
                  {p.state === 'envoi' && <progress className={styles.progress} max={1} value={p.progress} />}
                  {p.error && <p className={styles.itemError}>{p.error}</p>}
                </div>
                <button
                  type="button"
                  className={`${s.linkButton} ${s.danger}`}
                  onClick={() => removePending(p.key)}
                  disabled={p.state === 'compression' || p.state === 'envoi'}
                >
                  Retirer
                </button>
              </li>
            ))}
          </ul>
          <Button variant="plein" onClick={() => void sendAll()} disabled={busy}>
            {busy ? 'Envoi en cours…' : `Envoyer ${pending.length > 1 ? `les ${pending.length} photos` : 'la photo'}`}
          </Button>
        </div>
      )}
    </div>
  );
}
