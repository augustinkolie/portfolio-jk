'use client';

import { VIDEO_ACCEPTED_TYPES, VIDEO_MAX_UPLOAD_BYTES, type AdminCourseDto } from '@btp/shared';
import { useState } from 'react';
import { adminFetch, uploadTeaser } from '@/admin/lib/client';
import { formatBytes } from '@/admin/lib/compress';
import { errorMessage } from '@/admin/lib/useAdminData';
import { adminStyles as s } from '@/admin/ui';
import { Icon } from '@/components/ui/Icon';
import styles from './TeaserManager.module.css';

/**
 * Extrait vidéo d'une formation. Pas de conversion côté serveur : on vérifie ici le format
 * et le poids avant d'envoyer, pour ne pas gaspiller une connexion lente.
 */
export function TeaserManager({ course, onChange }: { course: AdminCourseDto; onChange: (c: AdminCourseDto) => void }) {
  const [progress, setProgress] = useState<number | null>(null);
  const [message, setMessage] = useState<{ tone: 'ok' | 'erreur'; text: string } | null>(null);

  async function send(file: File) {
    if (!(VIDEO_ACCEPTED_TYPES as readonly string[]).includes(file.type)) {
      setMessage({ tone: 'erreur', text: 'Format non pris en charge. Exportez la vidéo en MP4 (H.264) ou WebM.' });
      return;
    }
    if (file.size > VIDEO_MAX_UPLOAD_BYTES) {
      setMessage({
        tone: 'erreur',
        text: `La vidéo pèse ${formatBytes(file.size)} : la limite est ${formatBytes(VIDEO_MAX_UPLOAD_BYTES)}. Exportez-la en 720p ou raccourcissez l’extrait.`,
      });
      return;
    }
    setMessage(null);
    setProgress(0);
    try {
      onChange(await uploadTeaser<AdminCourseDto>(course.id, file, setProgress));
      setMessage({ tone: 'ok', text: 'Extrait vidéo enregistré.' });
    } catch (e) {
      setMessage({ tone: 'erreur', text: errorMessage(e) });
    } finally {
      setProgress(null);
    }
  }

  async function remove() {
    if (!window.confirm('Retirer l’extrait vidéo de cette formation ?')) return;
    try {
      onChange(await adminFetch<AdminCourseDto>(`/admin/courses/${course.id}/teaser`, { method: 'DELETE' }));
      setMessage({ tone: 'ok', text: 'Extrait vidéo retiré.' });
    } catch (e) {
      setMessage({ tone: 'erreur', text: errorMessage(e) });
    }
  }

  return (
    <div className={styles.manager}>
      {message && (
        <p className={message.tone === 'ok' ? styles.ok : styles.err} role={message.tone === 'ok' ? 'status' : 'alert'}>
          {message.text}
        </p>
      )}

      {course.teaser && (
        <div className={styles.current}>
          <video className={styles.video} src={course.teaser.url} controls preload="metadata" />
          <p className={s.muted}>
            {course.teaser.mime === 'video/webm' ? 'WebM' : 'MP4'} · {formatBytes(course.teaser.size)}
          </p>
          <button type="button" className={`${s.linkButton} ${s.danger}`} onClick={() => void remove()}>
            Retirer l’extrait
          </button>
        </div>
      )}

      {progress !== null ? (
        <div className={styles.progress} role="status">
          <span>Envoi de la vidéo : {Math.round(progress * 100)} %</span>
          <progress max={1} value={progress} />
          <span className={s.muted}>Gardez cette page ouverte jusqu’à la fin de l’envoi.</span>
        </div>
      ) : (
        <label className={styles.drop}>
          <Icon name="plus" size={28} />
          <span className={styles.dropTitle}>{course.teaser ? 'Remplacer l’extrait vidéo' : 'Ajouter un extrait vidéo'}</span>
          <span className={s.muted}>
            MP4 ou WebM, {formatBytes(VIDEO_MAX_UPLOAD_BYTES)} au plus. Conseil : 1 à 3 minutes, exporté en 720p.
          </span>
          <input
            type="file"
            accept="video/mp4,video/webm"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (file) void send(file);
            }}
          />
        </label>
      )}
    </div>
  );
}
