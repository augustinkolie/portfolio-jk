'use client';

import type { AdminPlanDto, Paginated } from '@btp/shared';
import Link from 'next/link';
import { useState } from 'react';
import { useAdminData } from '@/admin/lib/useAdminData';
import { Notice, PageHeader, Pager, Tag, adminStyles as s } from '@/admin/ui';
import { Button } from '@/components/ui/Button';
import styles from '../projets/projets.module.css';

const LIMIT = 20;

export default function PlansAdminPage() {
  const [page, setPage] = useState(1);
  const { data, error, loading } = useAdminData<Paginated<AdminPlanDto>>(`/admin/plans?limit=${LIMIT}&page=${page}`);

  return (
    <>
      <PageHeader
        title="Plans de conception"
        actions={
          <Button href="/admin/plans/nouveau" variant="plein" icon="plus">
            Ajouter un plan
          </Button>
        }
      />
      {error && <Notice tone="erreur">{error}</Notice>}
      {loading && <p className={s.muted}>Chargement…</p>}
      {data && data.total === 0 && <p className={s.empty}>Aucun plan pour l’instant.</p>}
      {data && data.items.length > 0 && (
        <ul className={s.list}>
          {data.items.map((p) => {
            const thumb = p.cover?.sources.webp[0]?.url;
            return (
              <li key={p.id} className={s.row}>
                <div className={styles.thumb}>{thumb && <img src={thumb} alt="" loading="lazy" />}</div>
                <div className={s.rowMain}>
                  <Link href={`/admin/plans/${p.id}`} className={s.rowTitle}>
                    {p.title}
                  </Link>
                  <span className={s.muted}>
                    {[p.planType, p.levels, p.surface].filter(Boolean).join(' · ')} · {p.media.length} image
                    {p.media.length > 1 ? 's' : ''}
                  </span>
                </div>
                <Tag strong={p.published}>{p.published ? 'Publié' : 'Brouillon'}</Tag>
              </li>
            );
          })}
        </ul>
      )}
      {data && <Pager page={page} total={data.total} limit={LIMIT} onChange={setPage} />}
    </>
  );
}
