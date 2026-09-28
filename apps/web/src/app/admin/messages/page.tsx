'use client';

import type { ContactMessageDto, MessageStatus, Paginated } from '@btp/shared';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { adminFetch } from '@/admin/lib/client';
import { errorMessage, useAdminData } from '@/admin/lib/useAdminData';
import { Notice, PageHeader, Pager, Tag, adminStyles as s } from '@/admin/ui';
import { Button } from '@/components/ui/Button';
import { formatPhone, whatsappUrl } from '@/lib/site';
import styles from './messages.module.css';

const FILTERS: { value: MessageStatus | ''; label: string }[] = [
  { value: 'NEW', label: 'Non lus' },
  { value: 'READ', label: 'Lus' },
  { value: 'HANDLED', label: 'Traités' },
  { value: '', label: 'Tous' },
];
const STATUS_LABEL: Record<MessageStatus, string> = { NEW: 'Nouveau', READ: 'Lu', HANDLED: 'Traité' };
const DATE = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short' });
const LIMIT = 20;

// useSearchParams exige une frontière Suspense (page rendue côté client uniquement).
export default function MessagesPage() {
  return (
    <Suspense>
      <Messages />
    </Suspense>
  );
}

function Messages() {
  const ouvrir = useSearchParams().get('ouvrir');
  const [status, setStatus] = useState<MessageStatus | ''>('');
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ tone: 'ok' | 'erreur'; text: string } | null>(null);
  const { data, error, loading, reload, setData } = useAdminData<Paginated<ContactMessageDto>>(
    `/admin/messages?limit=${LIMIT}&page=${page}${status ? `&status=${status}` : ''}`,
  );

  // Lien depuis le tableau de bord ou la cloche : ?ouvrir=<id> (aussi quand on est déjà sur la page).
  useEffect(() => {
    if (!ouvrir) return;
    setOpenId(ouvrir);
    adminFetch<ContactMessageDto>(`/admin/messages/${ouvrir}`) // marque comme lu
      .then((m) => setData((d) => (d ? { ...d, items: d.items.map((x) => (x.id === m.id ? m : x)) } : d)))
      .catch((e: unknown) => setFeedback({ tone: 'erreur', text: errorMessage(e) }));
  }, [ouvrir]);

  function replace(updated: ContactMessageDto) {
    if (data) setData({ ...data, items: data.items.map((m) => (m.id === updated.id ? updated : m)) });
  }

  async function open(id: string) {
    if (openId === id) return setOpenId(null);
    setOpenId(id);
    try {
      replace(await adminFetch<ContactMessageDto>(`/admin/messages/${id}`)); // marque comme lu
    } catch (e) {
      setFeedback({ tone: 'erreur', text: errorMessage(e) });
    }
  }

  async function setMessageStatus(m: ContactMessageDto, next: MessageStatus) {
    try {
      replace(await adminFetch<ContactMessageDto>(`/admin/messages/${m.id}`, { method: 'PATCH', json: { status: next } }));
      setFeedback({ tone: 'ok', text: next === 'HANDLED' ? 'Message marqué comme traité.' : 'Message marqué comme non lu.' });
    } catch (e) {
      setFeedback({ tone: 'erreur', text: errorMessage(e) });
    }
  }

  async function remove(m: ContactMessageDto) {
    if (!window.confirm(`Supprimer le message de ${m.name} ? Cette action est définitive.`)) return;
    try {
      await adminFetch<void>(`/admin/messages/${m.id}`, { method: 'DELETE' });
      setFeedback({ tone: 'ok', text: 'Message supprimé.' });
      await reload();
    } catch (e) {
      setFeedback({ tone: 'erreur', text: errorMessage(e) });
    }
  }

  return (
    <>
      <PageHeader title="Messages" />
      <div className={styles.filters} role="group" aria-label="Filtrer par statut">
        {FILTERS.map((f) => (
          <button
            key={f.label}
            type="button"
            className={styles.filter}
            aria-pressed={status === f.value}
            onClick={() => {
              setStatus(f.value);
              setPage(1);
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {feedback && <Notice tone={feedback.tone}>{feedback.text}</Notice>}
      {error && <Notice tone="erreur">{error}</Notice>}
      {loading && <p className={s.muted}>Chargement…</p>}
      {data && data.items.length === 0 && <p className={s.empty}>Aucun message.</p>}

      {data && data.items.length > 0 && (
        <ul className={s.list}>
          {data.items.map((m) => {
            const isOpen = openId === m.id;
            return (
              <li key={m.id} className={styles.item}>
                <button
                  type="button"
                  className={styles.summary}
                  aria-expanded={isOpen}
                  aria-controls={`message-${m.id}`}
                  onClick={() => void open(m.id)}
                >
                  <span className={s.rowMain}>
                    <span className={`${s.rowTitle} ${m.status === 'NEW' ? styles.unread : ''}`}>
                      {m.name}
                      {m.projectType && ` · ${m.projectType}`}
                    </span>
                    <span className={s.muted}>
                      {DATE.format(new Date(m.createdAt))}
                      {m.location && ` · ${m.location}`}
                    </span>
                  </span>
                  <Tag strong={m.status === 'NEW'}>{STATUS_LABEL[m.status]}</Tag>
                </button>

                {isOpen && (
                  <div id={`message-${m.id}`} className={styles.detail}>
                    <p className={styles.body}>{m.message}</p>
                    <dl className={styles.meta}>
                      <dt>Téléphone</dt>
                      <dd>
                        <a href={`tel:${m.phone}`}>{formatPhone(m.phone)}</a>
                      </dd>
                      {m.email && (
                        <>
                          <dt>Email</dt>
                          <dd>{m.email}</dd>
                        </>
                      )}
                      {m.location && (
                        <>
                          <dt>Chantier</dt>
                          <dd>{m.location}</dd>
                        </>
                      )}
                    </dl>
                    <div className={s.formActions}>
                      <Button
                        href={whatsappUrl(m.phone, `Bonjour ${m.name}, suite à votre demande de devis sur notre site :`)}
                        external
                        variant="plein"
                        icon="whatsapp"
                      >
                        Répondre sur WhatsApp
                      </Button>
                      {m.email && (
                        <Button href={`mailto:${m.email}?subject=${encodeURIComponent('Votre demande de devis')}`} external variant="trait" icon="mail">
                          Répondre par email
                        </Button>
                      )}
                      {m.status !== 'HANDLED' ? (
                        <Button variant="trait" icon="check" onClick={() => void setMessageStatus(m, 'HANDLED')}>
                          Marquer comme traité
                        </Button>
                      ) : (
                        <button type="button" className={s.linkButton} onClick={() => void setMessageStatus(m, 'NEW')}>
                          Marquer comme non lu
                        </button>
                      )}
                      <button type="button" className={`${s.linkButton} ${s.danger}`} onClick={() => void remove(m)}>
                        Supprimer
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {data && <Pager page={page} total={data.total} limit={LIMIT} onChange={setPage} />}
    </>
  );
}
