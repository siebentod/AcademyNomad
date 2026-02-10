import { StateCreator } from 'zustand';
import type { Settings, ExcludedListItem } from 'src/shared/types';
import type { Store, SettingsSlice } from '../types';
import { createPrivateSlice } from './index.private';

const defaultSettings: Settings = {
  types: ['pdf', 'djvu'],
  excludedList: [],
  pdfReaderPath: '',
};

export const createSettingsSlice: StateCreator<
  Store,
  [],
  [],
  SettingsSlice
> = (set, get) => {
  const privateSlice = createPrivateSlice(set, get);

  return {
    settings: defaultSettings,
    areListsLoaded: false,

    ...privateSlice,

    saveSettings: async (settings: Settings) => {
      await get()._setSettings(settings);
    },

    addToExcluded: (file) =>
      set((state) => {
        const currentList = state.settings.excludedList || [];
        const existingIndex = currentList.findIndex(
          (item) => item.file_name === file.file_name
        );

        if (existingIndex === -1) {
          const newItem: ExcludedListItem = {
            file_name: file.file_name,
            dateAdded: new Date().toISOString(),
          };
          return {
            settings: {
              ...state.settings,
              excludedList: [...currentList, newItem],
            },
          };
        }
        return state;
      }),

    addToExcludedPath: (path) =>
      set((state) => {
        const currentList = state.settings.excludedList || [];
        const existingIndex = currentList.findIndex(
          (item) => item.path === path
        );

        if (existingIndex === -1) {
          const newItem: ExcludedListItem = {
            path,
            dateAdded: new Date().toISOString(),
          };
          return {
            settings: {
              ...state.settings,
              excludedList: [...currentList, newItem],
            },
          };
        }
        return state;
      }),

    removeFromExcluded: (identifier) =>
      set((state) => {
        const currentList = state.settings.excludedList || [];
        return {
          settings: {
            ...state.settings,
            excludedList: currentList.filter(
              (item) =>
                item.file_name !== identifier && item.path !== identifier
            ),
          },
        };
      }),
  };
};
