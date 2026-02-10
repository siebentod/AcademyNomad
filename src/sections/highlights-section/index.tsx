import { invoke } from '@tauri-apps/api/core';
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
import { selectPdfReaderPath } from 'src/store/settings/settingsSelectors';
import type { ProcessedHighlight } from './types';
import toast from 'react-hot-toast';

interface OpenFileResult {
  success: boolean;
  path: string;
}

export default function HighlightsFeed() {
  const selectedBook = useStore((state) => state.view.selectedBook);
  const visibleHighlightsCount = useStore(
    (state) => state.view.visibleHighlightsCount
  );
  const showOnlyAnnotated = useStore((state) => state.view.showOnlyAnnotated);
  const highlightsSearchText = useStore(
    (state) => state.view.highlightsSearchText
  );

  const {
    removeBookFilter,
    selectBook,
    hideBook,
    incrementVisibleHighlightsCount,
    toggleShowOnlyAnnotated,
    setHighlightsSearchText,
  } = useStore(useShallow((state) => state.view.actions));
  const areFilesLoading = useStore((state) => state.areFilesLoading);
  const programPath = useStore(selectPdfReaderPath);

  const { groupedHighlights, totalFiltered } = useHighlights();

  const handleOpenHighlight = async (highlight: ProcessedHighlight) => {
    const result = await invoke('open_file', {
      params: {
        path: highlight.full_path,
        page: highlight.page,
        ...(programPath ? { program_path: programPath } : {}),
      },
    });
    if (!(result as OpenFileResult).success) {
      toast.error(
        `Не удалось открыть приложение ${programPath} Открываю в ${
          (result as OpenFileResult).path === 'explorer'
            ? 'приложении по умолчанию'
            : (result as OpenFileResult).path
        }...`
      );
    }
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

        <FilterControls
          showOnlyAnnotated={showOnlyAnnotated}
          searchText={highlightsSearchText}
          onToggleAnnotated={toggleShowOnlyAnnotated}
          onSearchChange={setHighlightsSearchText}
        />

        {areFilesLoading ? (
          <div className="flex justify-center py-8">
            <Spinner size="lg" />
          </div>
        ) : (
          <HighlightsList
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
                  onHideBook={hideBook}
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
