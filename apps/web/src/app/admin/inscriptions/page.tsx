'use client';

import {
  ENROLLMENT_STATUS_LABELS,
  type EnrollmentDto,
  type EnrollmentStatus,
  type Paginated,
} from '@btp/shared';
import Link from 'next/link';
import { useState } from 'react';
import { adminFetch } from '@/admin/lib/client';
import { errorMessage, useAdminData } from '@/admin/lib/useAdminData';
import { Notice, PageHeader, Pager, Tag, adminStyles as s } from '@/admin/ui';
import { Button } from '@/components/ui/Button';
import { formatPhone, whatsappUrl } from '@/lib/site';
import filters from '../projets/projets.module.css';
import styles from './inscriptions.module.css';

const STATUSES = Object.keys(ENROLLMENT_STATUS_LABELS) as EnrollmentStatus[];
const DATE = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
const LIMIT = 20;

export default function EnrollmentsPage() {
  const [status, setStatus] = useState<EnrollmentStatus | ''>('');
  const [courseId, setCourseId] = useState('');
  const [page, setPage] = useState(1);
  const [feedback, setFeedback] = useState<{ tone: 'ok' | 'erreur'; text: string } | null>(null);
  const params = new URLSearchParams({ limit: String(LIMIT), page: String(page) });
  if (status) params.set('status', status);
  if (courseId) params.set('courseId', courseId);
  const { data, error, loading, reload, setData } = useAdminData<Paginated<EnrollmentDto>>(`/admin/enrollments?${params}`);
  const { data: courses } = useAdminData<{ id: string; title: string }[]>('/admin/courses/options');

  async function update(e: EnrollmentDto, next: EnrollmentStatus) {
    try {
      const updated = await adminFetch<EnrollmentDto>(`/admin/enrollments/${e.id}`, { method: 'PATCH', json: { status: next } });
      if (data) setData({ ...data, items: data.items.map((x) => (x.id === e.id ? updated : x)) });
      setFeedback({ tone: 'ok', text: `${e.name} : ${ENROLLMENT_STATUS_LABELS[next].toLowerCase()}.` });
    } catch (err) {
      setFeedback({ tone: 'erreur', text: errorMessage(err) });
    }
  }

  async function remove(e: EnrollmentDto) {
    if (!window.confirm(`Supprimer la demande de ${e.name} ? Cette action est définitive.`)) return;
    try {
      await adminFetch<void>(`/admin/enrollments/${e.id}`, { method: 'DELETE' });
      setFeedback({ tone: 'ok', text: 'Demande supprimée.' });
      await reload();
    } catch (err) {
      setFeedback({ tone: 'erreur', text: errorMessage(err) });
    }
  }

  return (
    <>
      <PageHeader title="Inscriptions aux formations">
        <p>Rappelez chaque personne pour confirmer sa place et le paiement, puis passez-la en « Inscrit ».</p>
      </PageHeader>

      <div className={s.toolbar}>
        <label className={filters.filter}>
          Statut
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as EnrollmentStatus | '');
              setPage(1);
            }}
          >
            <option value="">Tous</option>
            {STATUSES.map((st) => (
              <option key={st} value={st}>
                {ENROLLMENT_STATUS_LABELS[st]}
              </option>
            ))}
          </select>
        </label>
        <label className={filters.filter}>
          Formation
          <select
            value={courseId}
            onChange={(e) => {
              setCourseId(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Toutes</option>
            {courses?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </label>
      </div>

      {feedback && <Notice tone={feedback.tone}>{feedback.text}</Notice>}
      {error && <Notice tone="erreur">{error}</Notice>}
      {loading && <p className={s.muted}>Chargement…</p>}
      {data && data.items.length === 0 && <p className={s.empty}>Aucune demande d’inscription.</p>}

      {data && data.items.length > 0 && (
        <ul className={s.list}>
          {data.items.map((e) => (
            <li key={e.id} className={styles.item}>
              <div className={styles.head}>
                <div className={s.rowMain}>
                  <span className={`${s.rowTitle} ${e.status === 'NEW' ? styles.unread : ''}`}>{e.name}</span>
                  <span className={s.muted}>
                    <Link href={`/admin/formations/${e.course.id}`}>{e.course.title}</Link> · {DATE.format(new Date(e.createdAt))}
                  </span>
                </div>
                <Tag strong={e.status === 'NEW'}>{ENROLLMENT_STATUS_LABELS[e.status]}</Tag>
              </div>
              <p className={styles.contact}>
                <a href={`tel:${e.phone}`} className="num">
                  {formatPhone(e.phone)}
                </a>
                {e.email && <span> · {e.email}</span>}
              </p>
              {e.message && <p className={styles.message}>{e.message}</p>}
              <div className={styles.actions}>
                <Button
                  href={whatsappUrl(e.phone, `Bonjour ${e.name}, suite à votre demande d’inscription à la formation « ${e.course.title} » :`)}
                  external
                  variant="plein"
                  icon="whatsapp"
                >
                  Écrire sur WhatsApp
                </Button>
                <label className={styles.statusSelect}>
                  <span className="sr-only">Statut de {e.name}</span>
                  <select value={e.status} onChange={(ev) => void update(e, ev.target.value as EnrollmentStatus)}>
                    {STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {ENROLLMENT_STATUS_LABELS[st]}
                      </option>
                    ))}
                  </select>
                </label>
                <button type="button" className={`${s.linkButton} ${s.danger}`} onClick={() => void remove(e)}>
                  Supprimer
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {data && <Pager page={page} total={data.total} limit={LIMIT} onChange={setPage} />}
    </>
  );
}
