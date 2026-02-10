
import { useIntersectionObserver } from 'src/shared/hooks/useIntersectionObserver';
import type { HighlightsListProps } from '../types';

export default function HighlightsList({
  groupedHighlights,
  visibleHighlightsCount,
  totalFiltered,
  renderItem,
  incrementVisibleHighlightsCount,
}: HighlightsListProps) {
  const loadMoreRef = useIntersectionObserver<HTMLDivElement>(() => {
    const total = totalFiltered;
    console.log('Достигнут последний элемент Списка!');
    if (visibleHighlightsCount < total) {
      incrementVisibleHighlightsCount(Math.min(50, total - visibleHighlightsCount));
    }
  }, { threshold: 0.1 });

  if (groupedHighlights.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        Хайлайты не найдены
      </div>
    );
  }

  return (
    <>
      {groupedHighlights.map((item, index) => renderItem(item, index))}

      {visibleHighlightsCount < totalFiltered && (
        <div
          ref={loadMoreRef}
          className="text-center py-3 text-gray-500 text-xs"
        >
          Загрузка...
        </div>
      )}
    </>
  );
}
