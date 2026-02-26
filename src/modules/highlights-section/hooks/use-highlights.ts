import {
  formatDate,
  parsePDFDate,
  getDateKey,
  getFileName,
  convertHighlightsToArray,
} from 'src/shared/lib/utils';
import type { ProcessedHighlight, GroupedHighlightItem } from '../types';
import type { Highlight } from 'src/shared/types';
import { useStore } from 'src/store';
import { useEffect, useState } from 'react';

function groupHighlights(
  resultHighlights: ProcessedHighlight[],
  selectedBook?: string
): GroupedHighlightItem[] {
  // Группировка
  const dateMap = new Map();
  const dateOrder: string[] = [];

  resultHighlights.forEach((highlight: ProcessedHighlight) => {
    const dateKey = getDateKey(highlight.timestamp);
    const fileName = highlight.fileName || 'Без названия';

    if (!dateMap.has(dateKey)) {
      dateMap.set(dateKey, {
        date: formatDate(highlight.timestamp),
        files: new Map(),
        fileOrder: [],
      });
      dateOrder.push(dateKey);
    }

    const dateEntry = dateMap.get(dateKey);

    if (!dateEntry.files.has(fileName)) {
      dateEntry.files.set(fileName, []);
      dateEntry.fileOrder.push(fileName);
    }

    dateEntry.files.get(fileName).push(highlight);
  });

  const groupedHighlights: GroupedHighlightItem[] = [];
  dateOrder.forEach((dateKey: string) => {
    const dateEntry = dateMap.get(dateKey);
    groupedHighlights.push({ type: 'date-header', date: dateEntry.date });

    if (selectedBook) {
      dateEntry.fileOrder.forEach((fileName: string) => {
        const highlightsForFile = dateEntry.files.get(fileName) || [];
        highlightsForFile.forEach((h: ProcessedHighlight) =>
          groupedHighlights.push({ type: 'highlight', data: h })
        );
      });
    } else {
      dateEntry.fileOrder.forEach((fileName: string) => {
        groupedHighlights.push({ type: 'file-header', fileName });
        const highlightsForFile = dateEntry.files.get(fileName) || [];
        highlightsForFile.forEach((h: ProcessedHighlight) =>
          groupedHighlights.push({ type: 'highlight', data: h })
        );
      });
    }
  });

  return groupedHighlights;
}

export function useHighlights() {
  const activeList = useStore((state) => state.activeList);
  const visibleHighlightsCount = useStore(
    (state) => state.view.visibleHighlightsCount
  );
  const selectedBook = useStore((state) => state.view.selectedBook);
  const showOnlyAnnotated = useStore((state) => state.view.showOnlyAnnotated);
  const highlightsSearchText = useStore(
    (state) => state.view.highlightsSearchText
  );
  const getHighlights = useStore((state) => state.getHighlights);
  const highlightsTrigger = useStore((state) => state.highlightsTrigger);
  const everythingFiles = useStore((state) => state.files);
  console.log('everythingFiles', everythingFiles)

  const [groupedHighlights, setGroupedHighlights] = useState<
    GroupedHighlightItem[]
  >([]);
  const [totalFiltered, setTotalFiltered] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const processHighlights = async () => {
      setLoading(true);

      let newHighlights: Highlight[] = [];
      let total = 0;

      if (activeList?.name) {
        const { items, total: totalCount } = await getHighlights({
          limit: visibleHighlightsCount,
          list_id: activeList?.id,
          selectedBook,
          highlightsSearchText,
          showOnlyAnnotated,
        });
        newHighlights = items || [];
        total = totalCount;
      } else {
        console.log('shi', ({
          limit: visibleHighlightsCount,
          selectedBook,
          highlightsSearchText,
          showOnlyAnnotated,
        }))
        const { items, total: totalCount } = await getHighlights({
          limit: visibleHighlightsCount,
          selectedBook,
          highlightsSearchText,
          showOnlyAnnotated,
        });
        newHighlights = items || [];
        total = totalCount;
      }
      setTotalFiltered(total);

      // Преобразуем хайлайты в нужный формат
      const highlightsWithArrayColor = convertHighlightsToArray(newHighlights);
      const resultHighlights: ProcessedHighlight[] = highlightsWithArrayColor
        .map((h: Highlight) => ({
          page: h.page || 0,
          highlighted_text: h.highlighted_text || '',
          annotation_text: h.annotation_text,
          date: h.date,
          timestamp: parsePDFDate(h.date || ''),
          fileName: h.title || '',
          full_path: h.file_path || '',
          color: h.color,
        }))
        ?.sort((a, b) => b.timestamp - a.timestamp);

      const _groupedHighlights = groupHighlights(
        resultHighlights,
        selectedBook || undefined
      );

      setGroupedHighlights(_groupedHighlights);
      setLoading(false);
    };

    processHighlights();
  }, [
    activeList,
    highlightsSearchText,
    selectedBook,
    showOnlyAnnotated,
    visibleHighlightsCount,
    getHighlights,
    highlightsTrigger,
  ]);

  return {
    groupedHighlights,
    totalFiltered,
    loading,
  };
}
