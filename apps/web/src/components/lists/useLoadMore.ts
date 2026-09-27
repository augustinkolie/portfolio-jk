'use client';

import type { Paginated } from '@btp/shared';
import { useEffect, useRef, useState } from 'react';
import { PUBLIC_API_URL } from '@/lib/site';

/**
 * « Charger plus » pour une liste publique : la première page est générée statiquement,
 * les suivantes sont demandées à l'API au clic. Après chargement, le focus clavier passe
 * au premier élément ajouté (lecteurs d'écran, navigation au clavier).
 */
export function useLoadMore<T extends { id: string }>(initial: Paginated<T>, path: string) {
  const [items, setItems] = useState(initial.items);
  const [page, setPage] = useState(initial.page);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const listRef = useRef<HTMLUListElement>(null);
  const focusFrom = useRef<number | null>(null);

  useEffect(() => {
    if (focusFrom.current === null) return;
    listRef.current?.children[focusFrom.current]?.querySelector('a')?.focus();
    focusFrom.current = null;
  }, [items]);

  async function loadMore() {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`${PUBLIC_API_URL}${path}?page=${page + 1}&limit=${initial.limit}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as Paginated<T>;
      focusFrom.current = items.length;
      setItems((prev) => [...prev, ...data.items.filter((x) => !prev.some((p) => p.id === x.id))]);
      setPage(data.page);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return { items, total: initial.total, remaining: Math.max(0, initial.total - items.length), loading, error, loadMore, listRef };
}
