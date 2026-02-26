/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  selectTypesQuery,
  selectExcludedQuery,
} from 'src/store/settings/settingsSelectors';
import {
  searchFiles,
  buildSearchQuery,
  buildIncludeQuery,
  searchHighlightsForFiles,
} from 'src/shared/lib/searchUtils';
import { countHighlightsAndAnnotations } from 'src/shared/lib/utils';
import { useStore } from 'src/store';
import { useShallow } from 'zustand/shallow';
import { File } from 'src/shared/types';
import { HighlightsDB } from 'src/db/HighlightsDB';
import { FilesDB } from 'src/db/FilesDB';

export function useSearch() {
  const areListsLoaded = useStore((state) => state.areListsLoaded);
  const activeMode = useStore((state) => state.view.activeMode);
  const activeList = useStore((state) => state.activeList);
  const typesQuery = useStore(selectTypesQuery);
  const excludedQuery = useStore(selectExcludedQuery);
  const fetchCount = useStore((state) => state.view.fetchCount);
  const searchTrigger = useStore((state) => state.searchTrigger);
  const { setHasMore } = useStore(useShallow((state) => state.view.actions));
  const deleteTemporaryHighlights = useStore(
    (state) => state.deleteTemporaryHighlights
  );
  const searchQuery = useStore((state) => state.view.searchQuery);
  const { setSearchQuery } = useStore(
    useShallow((state) => state.view.actions)
  );
  const setLoading = useStore((state) => state.setLoading);
  const setFiles = useStore((state) => state.setFiles);

  useEffect(() => {
    const abortController = new AbortController();

    const handleSearch = async () => {
      if (!areListsLoaded) return;

      try {
        setLoading(true);

        deleteTemporaryHighlights();

        const activeListFiles = activeList?.items || [];

        if (activeList?.name && activeListFiles?.length === 0) {
          setFiles([]);
          return;
        }

        const activeListPaths =
          activeListFiles?.map((item: File) => item.full_path) || [];
        const includeQuery = buildIncludeQuery(activeListPaths);
        const query = buildSearchQuery({
          searchQuery,
          typesQuery,
          excludedQuery,
          includeQuery,
        });

        const result = await searchFiles({
          query,
          includeHighlights: false,
          count: fetchCount,
        });

        if (abortController.signal.aborted) return;

        const _searchItems = result?.items || [];

        console.log('activeListFiles', activeListFiles);
        setFiles(activeList?.name ? activeListFiles : _searchItems);
        setHasMore(result?.has_more || false);

        const searchItemsPaths = _searchItems.map((file) => file.full_path);
        const filesFromDB = !activeList?.id
          ? await FilesDB.getFilesByPaths(searchItemsPaths)
          : await FilesDB.getFilesByList(activeList?.id);

        if (abortController.signal.aborted) return;

        const firstSevenPaths = searchItemsPaths.slice(0, 7);
        const firstSevenResults = await searchHighlightsForFiles(
          firstSevenPaths
        );

        if (abortController.signal.aborted) return;

        const searchItems = (activeList?.id ? filesFromDB : _searchItems).map(
          (file) => {
            const fileWithHighlights = firstSevenResults.find(
              (result) => result.full_path === file.full_path
            );
            const fileFromDB = filesFromDB?.find(
              (dbFile) => dbFile.full_path === file.full_path
            );
            const simpleFile = _searchItems?.find(
              (sFile) => sFile.full_path === file.full_path
            );
            if (
              fileFromDB &&
              !_searchItems.some((item) => item.full_path === file.full_path)
            ) {
              return { ...fileFromDB, isMissing: true };
            }
            if (fileWithHighlights) {
              return {
                ...simpleFile,
                highlights: fileWithHighlights.highlights,
                is_pinned: fileFromDB?.is_pinned,
                pinned_order: fileFromDB?.pinned_order ?? null,
              };
            }
            if (fileFromDB) {
              return {
                ...fileFromDB,
                is_locked: file?.is_locked ?? false,
              };
            }
            return file;
          }
        );

        const processedFiles = await Promise.all(
          searchItems.map(async (file) => {
            if (abortController.signal.aborted) return null;

            const fileFromDB = filesFromDB?.find(
              (f) => f.full_path === file.full_path
            );

            let updatedFile = { ...file };

            if (file.highlights) {
              const [highlightsCount, annotationsCount] =
                countHighlightsAndAnnotations(file.highlights);

              const result = await FilesDB.upsertFileBy(
                {
                  ...file,
                  highlights_count: highlightsCount,
                  annotations_count: annotationsCount,
                },
                { full_path: file.full_path }
              );
              const lastInsertId = Number(result?.lastInsertId);

              await HighlightsDB.updateHighlightsFor({
                highlights: file.highlights || [],
                fileId: fileFromDB ? fileFromDB.id! : lastInsertId,
              });

              if (abortController.signal.aborted) return null;

              updatedFile = {
                ...updatedFile,
                highlights_count: highlightsCount,
                annotations_count: annotationsCount,
                new_numbers: true,
              };
            }

            if (fileFromDB?.highlights_count != null && !file.highlights) {
              updatedFile = {
                ...updatedFile,
                highlights_count: fileFromDB.highlights_count,
                annotations_count: fileFromDB.annotations_count,
              };
            }

            if (fileFromDB) {
              updatedFile = {
                ...updatedFile,
                is_in_lists: Boolean(fileFromDB.in_list) || false,
                id: fileFromDB.id,
              };
            }

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { highlights: _highlights, ...fileWithoutHighlights } =
              updatedFile;
            return fileWithoutHighlights;
          })
        );

        if (abortController.signal.aborted) return;

        const validProcessedFiles = processedFiles.filter(
          (file): file is File => file !== null
        );
        setFiles(validProcessedFiles);
        console.log('processedFiles', validProcessedFiles);
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error('Error choosing folder or reading files:', err);
          toast.error(`Ошибка: ${err.message}`);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    };

    if (areListsLoaded) {
      handleSearch();
    }

    return () => {
      abortController.abort();
    };
  }, [
    activeList,
    activeMode,
    areListsLoaded,
    deleteTemporaryHighlights,
    excludedQuery,
    fetchCount,
    searchQuery,
    searchTrigger,
    setFiles,
    setHasMore,
    setLoading,
    typesQuery,
  ]);

  return {
    setSearchQuery,
  };
}
