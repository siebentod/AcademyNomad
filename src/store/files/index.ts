import { StateCreator } from 'zustand';
import type { Store, FilesSlice } from '../types';
import { countHighlightsAndAnnotations } from 'src/shared/lib/utils';
import { FilesDB } from 'src/db/FilesDB';
import { HighlightsDB } from 'src/db/HighlightsDB';

export const createFilesSlice: StateCreator<Store, [], [], FilesSlice> = (
  set,
  get
) => ({
  // Initial state
  files: [],
  areFilesLoading: false,
  error: null,
  searchError: null,
  currentQuery: '',
  currentFilters: {},
  lastSearchTime: null,
  searchTrigger: 0,

  setFiles: async (files) => {
    set({
      files,
      lastSearchTime: new Date().toISOString(),
    });
  },

  updateFileWithHighlights: async (file, highlights) => {
    const [highlightsCount, annotationsCount] =
      countHighlightsAndAnnotations(highlights);
      console.log('file', file)

    set((state) => {
      const updatedFiles = state.files.map((item) => {
        if (item.full_path === file.full_path) {
          return {
            ...file,
            new_numbers: true,
            highlights_count: highlightsCount,
            annotations_count: annotationsCount,
          };
        }
        return item;
      });

      return {
        files: updatedFiles,
        highlights: [],
        lastSearchTime: new Date().toISOString(),
      };
    });

    const result = await FilesDB.upsertFileBy(
      {
        ...file,
        highlights_count: highlightsCount,
        annotations_count: annotationsCount,
      },
      { full_path: file.full_path }
    );
    const lastInsertId = Number(result?.lastInsertId) || 0;

    await HighlightsDB.updateHighlightsFor({
      highlights: file.highlights || [],
      fileId: file.id || lastInsertId,
      // ЕСЛИ ЗАСУНУТЬ СЮДА PDF ИЗ EVERYTHING, ТАМ БУДЕТ НЕКОРРЕКТНЫЙ ID И В БД ПОЛОМАЕТСЯ ИНКРЕМЕНТЕР
    });
    get().triggerHighlights();
  },

  removeFile: (full_path) => {
    set((state) => ({
      files: state.files.filter((file) => file.full_path !== full_path),
    }));
    FilesDB.removeFile({ full_path });
  },

  setLoading: (loading) => set({ areFilesLoading: loading }),

  triggerSearch: () => {
    set((state) => ({
      searchTrigger: state.searchTrigger + 1,
    }));
  },
});
