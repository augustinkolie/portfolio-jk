'use client';

import type { DashboardDto } from '@btp/shared';
import Link from 'next/link';
import { Notice, PageHeader, Panel, adminStyles as s } from '@/admin/ui';
import { useAdminData } from '@/admin/lib/useAdminData';
import { Button } from '@/components/ui/Button';
import styles from './dashboard.module.css';

const DATE = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });

export default function DashboardPage() {
  const { data, error, loading } = useAdminData<DashboardDto>('/admin/dashboard');

  return (
    <>
      <PageHeader
        title="Tableau de bord"
        actions={
          <Button href="/admin/projets/nouveau" variant="plein" icon="plus">
            Ajouter un projet
          </Button>
        }
      />
      {error && <Notice tone="erreur">{error}</Notice>}
      {loading && <p className={s.muted}>Chargement…</p>}

      {data && (
        <>
          <dl className={styles.stats}>
            <div>
              <dt>Projets publiés</dt>
              <dd className="num">{data.projects.published}</dd>
            </div>
            <div>
              <dt>Brouillons</dt>
              <dd className="num">{data.projects.drafts}</dd>
            </div>
            <div>
              <dt>Messages non lus</dt>
              <dd className="num">{data.messages.unread}</dd>
            </div>
            <div>
              <dt>
                <Link href="/admin/inscriptions">Inscriptions à traiter</Link>
              </dt>
              <dd className="num">{data.enrollments.pending}</dd>
            </div>
          </dl>

          <Panel title="Derniers messages non lus" id="messages-recents">
            {data.messages.latest.length === 0 ? (
              <p className={s.muted}>Aucun nouveau message.</p>
            ) : (
              <ul className={s.list}>
                {data.messages.latest.map((m) => (
                  <li key={m.id} className={s.row}>
                    <div className={s.rowMain}>
                      <span className={s.rowTitle}>
                        {m.name}
                        {m.location && ` · ${m.location}`}
                      </span>
                      <span className={s.muted}>{DATE.format(new Date(m.createdAt))}</span>
                    </div>
                    <Link href={`/admin/messages?ouvrir=${m.id}`}>Lire</Link>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/admin/messages">Tous les messages</Link>
          </Panel>
        </>
      )}
    </>
  );
}
