'use client';

import type { AdminProjectDto, CategoryDto, Paginated } from '@btp/shared';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAdminData } from '@/admin/lib/useAdminData';
import { Notice, PageHeader, Pager, Tag, adminStyles as s } from '@/admin/ui';
import { Button } from '@/components/ui/Button';
import styles from './projets.module.css';

const LIMIT = 20;

export default function ProjectsPage() {
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  const [published, setPublished] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [page, setPage] = useState(1);

  // Recherche : on attend la fin de la frappe avant d'interroger l'API.
  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);
  useEffect(() => setPage(1), [debounced, published, categoryId]);

  const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
  if (debounced) params.set('q', debounced);
  if (published) params.set('published', published);
  if (categoryId) params.set('categoryId', categoryId);

  const { data, error, loading } = useAdminData<Paginated<AdminProjectDto>>(`/admin/projects?${params}`);
  const { data: categories } = useAdminData<CategoryDto[]>('/admin/categories');

  return (
    <>
      <PageHeader
        title="Réalisations"
        actions={
          <Button href="/admin/projets/nouveau" variant="plein" icon="plus">
            Ajouter un projet
          </Button>
        }
      />

      <div className={s.toolbar} role="search">
        <label className={styles.filter}>
          Rechercher
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Titre, lieu, maître d’ouvrage" />
        </label>
        <label className={styles.filter}>
          Statut
          <select value={published} onChange={(e) => setPublished(e.target.value)}>
            <option value="">Tous</option>
            <option value="true">Publiés</option>
            <option value="false">Brouillons</option>
          </select>
        </label>
        <label className={styles.filter}>
          Catégorie
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">Toutes</option>
            {categories?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && <Notice tone="erreur">{error}</Notice>}
      <p className={s.muted} role="status">
        {loading ? 'Chargement…' : data ? `${data.total} projet${data.total > 1 ? 's' : ''}` : ''}
      </p>

      {data && data.items.length === 0 && !loading && <p className={s.empty}>Aucun projet ne correspond.</p>}

      {data && data.items.length > 0 && (
        <ul className={s.list}>
          {data.items.map((p) => {
            const thumb = p.cover?.sources.webp[0]?.url;
            return (
              <li key={p.id} className={s.row}>
                <div className={styles.thumb}>{thumb && <img src={thumb} alt="" loading="lazy" />}</div>
                <div className={s.rowMain}>
                  <Link href={`/admin/projets/${p.id}`} className={s.rowTitle}>
                    {p.title}
                  </Link>
                  <span className={s.muted}>
                    {p.category.name} · {p.location} · <span className="num">{p.year}</span> · {p.media.length} photo
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
