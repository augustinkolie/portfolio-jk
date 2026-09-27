'use client';

import { COURSE_FORMAT_LABELS, COURSE_LEVEL_LABELS, type CourseSummaryDto, type Paginated } from '@btp/shared';
import { Tile } from '@/components/cards/Tile';
import { LoadMore } from '@/components/lists/LoadMore';
import { useLoadMore } from '@/components/lists/useLoadMore';

/** Liste des formations, « Charger plus » par 12. */
export function CoursesBrowser({ initial, gridClassName }: { initial: Paginated<CourseSummaryDto>; gridClassName?: string }) {
  const list = useLoadMore(initial, '/courses');
  return (
    <>
      <ul className={gridClassName} ref={list.listRef}>
        {list.items.map((c) => (
          <li key={c.id}>
            <Tile
              href={`/formations/${c.slug}`}
              title={c.title}
              cover={c.cover}
              sizes="(min-width: 64rem) 33vw, (min-width: 48rem) 50vw, 100vw"
              badge={c.hasTeaser ? 'Extrait vidéo' : undefined}
              meta={[c.software, COURSE_LEVEL_LABELS[c.level], c.duration, COURSE_FORMAT_LABELS[c.format]]}
              highlight={[c.price, c.nextSession && `Prochaine session : ${c.nextSession}`].filter(Boolean).join(' · ')}
              summary={c.summary}
            />
          </li>
        ))}
      </ul>
      <LoadMore remaining={list.remaining} loading={list.loading} error={list.error} onLoad={() => void list.loadMore()} noun="formations" />
    </>
  );
}
