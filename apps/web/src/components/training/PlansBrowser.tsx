'use client';

import type { Paginated, PlanSummaryDto } from '@btp/shared';
import { Tile } from '@/components/cards/Tile';
import { LoadMore } from '@/components/lists/LoadMore';
import { useLoadMore } from '@/components/lists/useLoadMore';
import { planMeta } from '@/lib/plans';

/** Galerie des plans, « Charger plus » par 12. */
export function PlansBrowser({ initial, gridClassName }: { initial: Paginated<PlanSummaryDto>; gridClassName?: string }) {
  const list = useLoadMore(initial, '/plans');
  return (
    <>
      <ul className={gridClassName} ref={list.listRef}>
        {list.items.map((p) => (
          <li key={p.id}>
            <Tile
              href={`/plans/${p.slug}`}
              title={p.title}
              cover={p.cover}
              sizes="(min-width: 64rem) 33vw, (min-width: 48rem) 50vw, 100vw"
              meta={planMeta(p)}
              summary={p.summary}
              badge={p.hasDocument ? 'Plan PDF à lire' : undefined}
              badgeKind="document"
            />
          </li>
        ))}
      </ul>
      <LoadMore remaining={list.remaining} loading={list.loading} error={list.error} onLoad={() => void list.loadMore()} noun="plans" />
    </>
  );
}
