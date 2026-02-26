import FilterControls from './components/filter-controls';
import SelectedBookChip from './components/selected-book-chip';
import HighlightsList from './components/highlights-list';
import HighlightItem from './components/highlight-item';
import DateHeader from './components/date-header';
import BookHeader from './components/book-header';
import Spinner from 'src/shared/ui/Spinner';
import { useState } from 'react';
import { useHighlights } from './hooks/use-highlights';
import { useStore } from 'src/store';
import { useShallow } from 'zustand/shallow';
import { useInvokeOpenFile } from 'src/shared/hooks/useInvokeOpenFile';
import type { ProcessedHighlight } from './types';
import Checkbox from 'src/shared/ui/Checkbox';

export default function HighlightsFeed() {
  const selectedBook = useStore((state) => state.view.selectedBook);
  const visibleHighlightsCount = useStore(
    (state) => state.view.visibleHighlightsCount
  );
  const areFilesLoading = useStore((state) => state.areFilesLoading);
  const invokeOpenFile = useInvokeOpenFile();
  const showOnlyAnnotated = useStore((state) => state.view.showOnlyAnnotated);
  const highlightsSearchText = useStore(
    (state) => state.view.highlightsSearchText
  );
  const highlightsTotalCount = useStore((state) => state.highlightsTotalCount);

  const {
    removeBookFilter,
    selectBook,
    incrementVisibleHighlightsCount,
    toggleShowOnlyAnnotated,
    setHighlightsSearchText,
  } = useStore(useShallow((state) => state.view.actions));

  const { groupedHighlights, totalFiltered, loading } = useHighlights();

  const handleOpenHighlight = async (highlight: ProcessedHighlight) => {
    await invokeOpenFile(highlight.full_path, highlight.page);
  };

  return (
    <div className="overflow-y-auto border border-t-0 border-border-dark">
      <div className="bg-surface">
        {selectedBook && (
          <SelectedBookChip
            bookName={selectedBook}
            onRemove={removeBookFilter}
          />
        )}

        <FilterControls>
          <Checkbox
            checked={showOnlyAnnotated}
            onChange={toggleShowOnlyAnnotated}
            aria-label="Только аннотации"
          />
          <div className="flex flex-col flex-shrink-0">
            <div className="text-sm font-medium text-text-secondary">
              Только аннотации
            </div>
          </div>
          <input
            type="text"
            placeholder="Search..."
            value={highlightsSearchText}
            onChange={(e) => setHighlightsSearchText(e.target.value)}
            className="flex-1 min-w-0 px-2 py-1 bg-input-dark border border-border-light rounded text-sm text-text-secondary placeholder-text-muted focus:outline-none focus:border-border-lighter"
          />
          <span className='absolute right-2 mt-20 text-sm text-gray-400'>Total: {highlightsTotalCount}</span>
        </FilterControls>

        {areFilesLoading && <Spinner size="sm" className="absolute" />}
        {loading && groupedHighlights.length === 0 ? (
          <div className="flex justify-center py-8">
            <Spinner size="lg" />
          </div>
        ) : (
          <HighlightsList
            loading={loading}
            groupedHighlights={groupedHighlights}
            visibleHighlightsCount={visibleHighlightsCount}
            totalFiltered={totalFiltered}
            incrementVisibleHighlightsCount={incrementVisibleHighlightsCount}
            renderItem={(item, index) =>
              item.type === 'date-header' ? (
                <DateHeader
                  key={`date-${index}`}
                  date={item.date}
                  index={index}
                />
              ) : item.type === 'file-header' ? (
                <BookHeader
                  key={`file-${index}`}
                  fileName={item.fileName}
                  index={index}
                  onSelectBook={selectBook}
                />
              ) : (
                <HighlightItem
                  key={`highlight-${index}`}
                  highlight={item.data}
                  onClick={handleOpenHighlight}
                />
              )
            }
          />
        )}
      </div>
    </div>
  );
}
