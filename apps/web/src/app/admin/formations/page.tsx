'use client';

import { COURSE_LEVEL_LABELS, type AdminCourseDto, type Paginated } from '@btp/shared';
import Link from 'next/link';
import { useState } from 'react';
import { useAdminData } from '@/admin/lib/useAdminData';
import { Notice, PageHeader, Pager, Tag, adminStyles as s } from '@/admin/ui';
import { Button } from '@/components/ui/Button';
import styles from '../projets/projets.module.css';

const LIMIT = 20;

export default function CoursesAdminPage() {
  const [page, setPage] = useState(1);
  const { data, error, loading } = useAdminData<Paginated<AdminCourseDto>>(`/admin/courses?limit=${LIMIT}&page=${page}`);

  return (
    <>
      <PageHeader
        title="Formations"
        actions={
          <>
            <Button href="/admin/inscriptions" variant="trait">
              Voir les inscriptions
            </Button>
            <Button href="/admin/formations/nouveau" variant="plein" icon="plus">
              Ajouter une formation
            </Button>
          </>
        }
      />
      {error && <Notice tone="erreur">{error}</Notice>}
      {loading && <p className={s.muted}>Chargement…</p>}
      {data && data.total === 0 && <p className={s.empty}>Aucune formation pour l’instant.</p>}
      {data && data.items.length > 0 && (
        <ul className={s.list}>
          {data.items.map((c) => {
            const thumb = c.cover?.sources.webp[0]?.url;
            return (
              <li key={c.id} className={s.row}>
                <div className={styles.thumb}>{thumb && <img src={thumb} alt="" loading="lazy" />}</div>
                <div className={s.rowMain}>
                  <Link href={`/admin/formations/${c.id}`} className={s.rowTitle}>
                    {c.title}
                  </Link>
                  <span className={s.muted}>
                    {c.software} · {COURSE_LEVEL_LABELS[c.level]}
                    {c.price && ` · ${c.price}`} · {c.teaser ? 'extrait vidéo' : 'sans vidéo'} ·{' '}
                    <span className="num">{c.enrollmentCount}</span> inscription{c.enrollmentCount > 1 ? 's' : ''}
                  </span>
                </div>
                <Tag strong={c.published}>{c.published ? 'Publiée' : 'Brouillon'}</Tag>
              </li>
            );
          })}
        </ul>
      )}
      {data && <Pager page={page} total={data.total} limit={LIMIT} onChange={setPage} />}
    </>
  );
}
