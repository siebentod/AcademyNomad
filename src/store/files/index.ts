import { StateCreator } from 'zustand';
import type { Store, FilesSlice } from '../types';

export const createFilesSlice: StateCreator<
  Store,
  [],
  [],
  FilesSlice
> = (set, get) => ({
  // Initial state
  files: [],
  areFilesLoading: false,
  error: null,
  searchError: null,
  currentQuery: '',
  currentFilters: {},
  lastSearchTime: null,

  // Actions
  setFiles: (files) => {
    // Логика merge файлов с highlights (из Redux)
    set((state) => {
      const existingFilesMap = new Map(state.files.map(file => [file.full_path, file]));

      const mergedFiles = files.map(newFile => {
        const existingFile = existingFilesMap.get(newFile.full_path);
        // Если получен файл с хайлайтами, всегда берем его
        if (newFile.highlights) {
          return newFile;
        }
        // Если получен файл без хайлайтов, но он уже есть с хайлайтами, используем старый с хайлайтами
        if (existingFile && existingFile.highlights) {
          return existingFile;
        }
        // Если нет, используем новый
        return newFile;
      });

      return {
        files: mergedFiles,
        lastSearchTime: new Date().toISOString()
      };
    });

    // Обновить файлы с highlights во всех lists (middleware логика)
    const filesWithHighlights = files.filter(file => file.highlights);
    if (filesWithHighlights.length > 0) {
      get().updateFilesInAllLists(filesWithHighlights);
    }
  },

  replaceFileByField: ({ file, field = 'full_path' }) => {
    set((state) => {
      const originalFiles = [...state.files];
      const updatedFiles = state.files.map((item) => {
        if (item[field] === file[field]) {
          console.log('replaceFileByField: Заменяю файл по полю', field, ':', {
            старый: item,
            новый: file
          });
          return file;
        }
        return item;
      });

      const hasChanges = updatedFiles.some((newFile, index) => newFile !== originalFiles[index]);
      if (hasChanges) {
        console.log('replaceFileByField: Замена произошла');
      } else {
        console.log('replaceFileByField: Замена НЕ произошла, файл не найден по полю', field, 'со значением:', file[field]);
        console.log('replaceFileByField: Доступные значения поля', field, 'в файлах:', state.files.map(f => f[field]));
      }

      return {
        files: updatedFiles,
        lastSearchTime: new Date().toISOString()
      };
    });
  },

  removeFile: (full_path) => {
    set((state) => ({
      files: state.files.filter((file) => file.full_path !== full_path)
    }));
    // Удаляем файл из всех списков
    get().removeFileFromAllLists({ full_path });
  },

  setLoading: (loading) => set({ areFilesLoading: loading }),
  setError: (error) => set({ error }),
  setSearchError: (error) => set({ searchError: error }),
  setCurrentQuery: (query) => set({ currentQuery: query }),
  setCurrentFilters: (filters) => set({ currentFilters: filters }),

  clearFiles: () => set({
    files: [],
    currentQuery: '',
    currentFilters: {},
    error: null,
    searchError: null
  }),
});