import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  selectTypesQuery,
  selectExcludedQuery,
} from 'src/store/settings/settingsSelectors';
import {
  getCurrentLists,
  getFileByFullPath,
} from 'src/store/lists/listsSelectors';
import { DEFAULT_FETCH_COUNT } from 'src/store/files/config';
import {
  searchFiles,
  buildSearchQuery,
  buildIncludeQuery,
} from 'src/shared/lib/searchUtils';
import { useStore } from 'src/store';
import { useShallow } from 'zustand/shallow';
import { File, List } from 'src/shared/types';

export function useSearch(activeProject: string, activeMode: string) {
  const areListsLoaded = useStore((state) => state.areListsLoaded);
  const typesQuery = useStore(selectTypesQuery);
  const excludedQuery = useStore(selectExcludedQuery);
  const fetchCount = useStore((state) => state.view.fetchCount);
  const { setHasMore } = useStore(useShallow((state) => state.view.actions));
  const [searchQuery, setSearchQuery] = useState('');
  const setLoading = useStore((state) => state.setLoading);
  const setFiles = useStore((state) => state.setFiles);

  useEffect(() => {
    const handleSearch = async () => {
      if (!areListsLoaded) return;

      try {
        setLoading(true);
        // Получаем актуальный список напрямую из store в момент выполнения
        const currentLists = getCurrentLists();
        const currentActiveList = !activeProject
          ? null
          : currentLists.find((list: List) => list.name === activeProject)
              ?.items || [];

        if (currentActiveList && currentActiveList.length === 0) {
          setFiles([]);
          return;
        }

        const filePaths =
          currentActiveList?.map((item: any) => item.full_path) || [];
        const includeQuery = buildIncludeQuery(filePaths);
        const query = buildSearchQuery({
          searchQuery,
          typesQuery,
          excludedQuery,
          includeQuery,
        });

        const includeHighlights =
          activeMode === 'highlights' && fetchCount <= DEFAULT_FETCH_COUNT
            ? true
            : false;

        const result = await searchFiles({
          query,
          includeHighlights,
          count: fetchCount,
        });

        const processedResult = result?.items?.map((file: File) => {
          // Эта хрень нужна потому что мы в асинхронной функции
          const fileFromLists = getFileByFullPath(file.full_path);
          if (!file.highlights) {
            return fileFromLists
              ? { isFromLists: true, ...fileFromLists }
              : file;
          }
          return {
            is_pinned: fileFromLists?.is_pinned,
            pinned_order: fileFromLists?.pinned_order,
            dateAdded: fileFromLists?.dateAdded,
            ...file,
          };
        });

        setFiles(processedResult as File[]);
        setHasMore(result?.has_more || false);
      } catch (err) {
        console.error('Error choosing folder or reading files:', err);
        toast.error(`Ошибка: ${err}`);
      } finally {
        console.log('finally');
        setLoading(false);
      }
    };

    console.log('activeProject', activeProject);
    if (areListsLoaded) {
      handleSearch();
    }
  }, [
    activeMode,
    activeProject,
    excludedQuery,
    fetchCount,
    searchQuery,
    typesQuery,
  ]);

  return {
    setSearchQuery,
  };
}
