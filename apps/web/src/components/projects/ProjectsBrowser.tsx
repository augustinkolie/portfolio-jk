'use client';

import { PAGE_SIZE, type CategoryDto, type Paginated, type ProjectSummaryDto } from '@btp/shared';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { FILTER_PARAMS, PUBLIC_API_URL } from '@/lib/site';
import { wideTileIndex } from './layout';
import { ProjectCard } from './ProjectCard';
import styles from './ProjectsBrowser.module.css';

interface Filters {
  category: string;
  year: string;
}

interface ProjectsBrowserProps {
  /** Première page sans filtre, générée statiquement. */
  initial: Paginated<ProjectSummaryDto>;
  categories: CategoryDto[];
  years: number[];
}

const NO_FILTERS: Filters = { category: '', year: '' };

function readUrl(): Filters {
  const params = new URLSearchParams(window.location.search);
  return {
    category: params.get(FILTER_PARAMS.category) ?? '',
    year: params.get(FILTER_PARAMS.year) ?? '',
  };
}

function writeUrl(filters: Filters): void {
  const params = new URLSearchParams();
  if (filters.category) params.set(FILTER_PARAMS.category, filters.category);
  if (filters.year) params.set(FILTER_PARAMS.year, filters.year);
  const qs = params.toString();
  window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
}

async function fetchProjects(filters: Filters, page: number): Promise<Paginated<ProjectSummaryDto>> {
  const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
  if (filters.category) params.set('category', filters.category);
  if (filters.year) params.set('year', filters.year);
  const res = await fetch(`${PUBLIC_API_URL}/projects?${params}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as Paginated<ProjectSummaryDto>;
}

/** Filtres par catégorie et par année sans rechargement, URL synchronisée, « Charger plus » par 12 (§4.2). */
export function ProjectsBrowser({ initial, categories, years }: ProjectsBrowserProps) {
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [items, setItems] = useState(initial.items);
  const [total, setTotal] = useState(initial.total);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const firstNewItem = useRef<HTMLLIElement>(null);
  const focusIndex = useRef<number | null>(null);

  const load = useCallback(async (next: Filters, nextPage: number) => {
    setLoading(true);
    setError(false);
    try {
      const data = await fetchProjects(next, nextPage);
      setItems((prev) => (nextPage === 1 ? data.items : [...prev, ...data.items]));
      setTotal(data.total);
      setPage(nextPage);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Arrivée sur une URL déjà filtrée (lien depuis l'accueil, partage) : on applique ses filtres.
  useEffect(() => {
    const fromUrl = readUrl();
    if (fromUrl.category || fromUrl.year) {
      setFilters(fromUrl);
      void load(fromUrl, 1);
    }
  }, [load]);

  // Après « Charger plus », le focus clavier passe au premier projet ajouté.
  useEffect(() => {
    if (focusIndex.current !== null && firstNewItem.current) {
      firstNewItem.current.querySelector('a')?.focus();
      focusIndex.current = null;
    }
  }, [items]);

  function applyFilters(next: Filters) {
    setFilters(next);
    writeUrl(next);
    void load(next, 1);
  }

  function loadMore() {
    focusIndex.current = items.length;
    void load(filters, page + 1);
  }

  const categoryName = categories.find((c) => c.slug === filters.category)?.name;
  const wideIndex = wideTileIndex(items);

  return (
    <div className={styles.browser}>
      <form className={styles.filters} onSubmit={(e) => e.preventDefault()} aria-label="Filtrer les réalisations">
        <fieldset className={styles.categories}>
          <legend className="sr-only">Catégorie</legend>
          {[{ slug: '', name: 'Toutes' }, ...categories].map((c) => (
            <label key={c.slug || 'toutes'} className={styles.chip}>
              <input
                type="radio"
                name="categorie"
                value={c.slug}
                checked={filters.category === c.slug}
                onChange={() => applyFilters({ ...filters, category: c.slug })}
              />
              <span>{c.name}</span>
            </label>
          ))}
        </fieldset>
        <label className={styles.year}>
          <span>Année</span>
          <select
            value={filters.year}
            onChange={(e) => applyFilters({ ...filters, year: e.target.value })}
          >
            <option value="">Toutes</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>
      </form>

      <p className={styles.count} role="status" aria-live="polite">
        {loading && items.length === 0
          ? 'Chargement…'
          : `${total} projet${total > 1 ? 's' : ''}${categoryName ? ` · ${categoryName}` : ''}${filters.year ? ` · ${filters.year}` : ''}`}
      </p>

      {error && (
        <p className={styles.error} role="alert">
          Les projets n’ont pas pu être chargés. Vérifiez votre connexion, puis réessayez.{' '}
          <button type="button" className={styles.retry} onClick={() => void load(filters, page)}>
            Réessayer
          </button>
        </p>
      )}

      {!loading && !error && items.length === 0 && (
        <p className={styles.empty}>
          Aucun projet ne correspond à ces critères.{' '}
          <button type="button" className={styles.retry} onClick={() => applyFilters(NO_FILTERS)}>
            Voir toutes les réalisations
          </button>
        </p>
      )}

      <ul className={styles.grid} aria-busy={loading}>
        {items.map((p, i) => {
          // Une seule grande tuile (le premier projet en vedette) : le projet suivant vient
          // se placer à côté. Plusieurs grandes tuiles laisseraient une colonne vide par ligne.
          const wide = i === wideIndex;
          return (
            <li
              key={p.id}
              ref={i === focusIndex.current ? firstNewItem : undefined}
              className={wide ? styles.wide : undefined}
            >
              <ProjectCard
                project={p}
                large={wide}
                headingLevel="h2"
                sizes={
                  wide
                    ? '(min-width: 64rem) 66vw, 100vw'
                    : '(min-width: 64rem) 33vw, (min-width: 48rem) 50vw, 100vw'
                }
              />
            </li>
          );
        })}
      </ul>

      {items.length < total && (
        <div className={styles.more}>
          <Button variant="trait" onClick={loadMore} disabled={loading}>
            {loading ? 'Chargement…' : `Charger plus de projets (${total - items.length} restants)`}
          </Button>
        </div>
      )}
    </div>
  );
}
