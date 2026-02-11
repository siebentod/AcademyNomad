import React, { useMemo } from 'react';
import { useTableRowsContextMenu } from './hooks/useTableRowsContextMenu';
import { useIntersectionObserver } from 'src/shared/hooks/useIntersectionObserver';
import { useInvokeOpenFile } from 'src/shared/hooks/useInvokeOpenFile';
import { DEFAULT_FETCH_COUNT } from 'src/store/files/config';

import { useTableSort } from './hooks/use-table-sort';
import TableHeader from './components/table-header';
import TableBody from './components/table-body';
import TableRow from './components/table-row';

import type { File } from 'src/shared/types';
import type { TableColumn } from './types';
import { useStore } from 'src/store';
import { useShallow } from 'zustand/shallow';
import { mergeProjectFilesWithHighlights } from './utils';
import {
  searchFileByQuery,
  buildIncludeQuery,
} from 'src/shared/lib/searchUtils';
import {
  selectTypesQuery,
  selectExcludedQuery,
} from 'src/store/settings/settingsSelectors';
import toast from 'react-hot-toast';
import type { List } from 'src/shared/types';

const COLUMNS: TableColumn[] = [
  { key: 'status', label: '', editable: true, sortable: false },
  { key: 'title', label: 'Название', editable: true, sortable: false },
  { key: 'modified_date', label: 'Дата-М', sortable: false },
];

function Table() {
  const { selectBook, hideBook, setFetchCount } = useStore(useShallow((state) => state.view.actions));
  const hiddenBooks = useStore((state) => state.view.hiddenBooks);
  const activeProject = useStore((state) => state.view.activeProject);
  const activeMode = useStore((state) => state.view.activeMode);
  const fetchCount = useStore((state) => state.view.fetchCount);
  const hasMore = useStore((state) => state.view.hasMore);
  const { showFileContextMenu } = useTableRowsContextMenu();
  const typesQuery = useStore(selectTypesQuery);
  const excludedQuery = useStore(selectExcludedQuery);
  const invokeOpenFile = useInvokeOpenFile();
  const setLoading = useStore((state) => state.setLoading);
  const replaceFileByField = useStore((state) => state.replaceFileByField);
  const updateFileInAllLists = useStore(
    (state) => state.updateFileInAllLists
  );

  const lastElementRef = useIntersectionObserver<HTMLTableRowElement>(() => {
    // console.log('books section hasMore', hasMore);
    if (areFilesLoading || !hasMore) return;
    setLoading(true);
    setFetchCount(fetchCount + DEFAULT_FETCH_COUNT);
  });

  const lists = useStore((state) => state.lists);
  const everythingFiles = useStore((state) => state.files);
  const areFilesLoading = useStore((state) => state.areFilesLoading);
  const files = useMemo(() => {
    if (!activeProject) return everythingFiles;
    const projectItems =
      (lists?.find((list: List) => list.name === activeProject)
        ?.items as File[]) || [];
    return mergeProjectFilesWithHighlights(projectItems, everythingFiles);
  }, [activeProject, lists, everythingFiles]);

  console.log('files', files);

  const filesFromLists = useMemo(() => {
    return lists.flatMap((l: List) => l.items) as File[];
  }, [lists]);

  const defaultSort = activeProject ? 'modified_date' : null;
  const { sortColumn, sortDirection, sortedFiles, getSortIcon, handleSort } =
    useTableSort(files, defaultSort, activeProject);

  const handleFileContextMenu = (file: File) => {
    showFileContextMenu({ file, activeProject });
  };

  const handleRowClick = async (event: React.MouseEvent, file: File) => {
    if (event.ctrlKey) {
      await invokeOpenFile(file.full_path);
    } else {
      selectBook(file.title);
    }
  };

  const handleSearchFile = async (file: File) => {
    try {
      setLoading(true);

      const includeQuery = buildIncludeQuery([file.file_name]);
      const query = `${typesQuery} ${excludedQuery} ${includeQuery}`.trim();

      const result = await searchFileByQuery(query);

      console.log('result', result)
      if (result.items?.length) {
        const updatedFile = result.items?.[0];
        updateFileInAllLists({ file: updatedFile });

        replaceFileByField({
          file: updatedFile,
        });
      }
    } catch (err) {
      console.error('Error searching file:', err);
      toast.error(`Ошибка поиска файла: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  if (!sortedFiles) return null;

  return (
    <div className="max-h-[calc(100vh-150px)] overflow-y-auto border border-t-0 border-border-dark">
      <table className="min-w-full bg-surface">
        <TableHeader
          columns={COLUMNS}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={handleSort}
          getSortIcon={getSortIcon}
        />
        <TableBody
          files={sortedFiles}
          renderRows={(file, index) => {
            const isHidden = hiddenBooks.includes(file.title);
            const isMissing =
              !areFilesLoading &&
              Boolean(activeProject) &&
              !everythingFiles.some((f) => f.full_path === file.full_path);
            const isHighlighted =
              !activeProject &&
              filesFromLists.some((f) => f.full_path === file.full_path);
            const isLastItem = Boolean(
              sortedFiles && index === sortedFiles.length - 1
            );
            const isPinned = activeProject && file.is_pinned;
            return (
              <TableRow
                key={`${file.full_path}`}
                COLUMNS={COLUMNS}
                file={file}
                isHighlighted={isHighlighted}
                isHidden={isHidden}
                isMissing={isMissing}
                areFilesLoading={areFilesLoading}
                fullTableMode={activeMode !== 'highlights'}
                onContextMenu={() => handleFileContextMenu(file)}
                onRowClick={(e: React.MouseEvent) => handleRowClick(e, file)}
                onSearchFile={handleSearchFile}
                hideBook={hideBook}
                lastElementRef={
                  isLastItem && !activeProject && !areFilesLoading
                    ? lastElementRef
                    : undefined
                }
                isPinned={isPinned}
              />
            );
          }}
        />
      </table>
    </div>
  );
}

export default Table;
