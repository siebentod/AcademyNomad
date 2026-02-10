import { StateCreator } from 'zustand';
import type { Lists, List, ListItem } from 'src/shared/types';
import type { Store, ListsSlice } from '../types';
import { createPrivateSlice } from './index.private';
import { findListByName } from './listsUtils';

export const createListsSlice: StateCreator<
  Store,
  [],
  [],
  ListsSlice
> = (set, get) => {
  const privateSlice = createPrivateSlice(set, get);

  return {
    lists: [],
    areListsLoaded: false,

    ...privateSlice,

    createList: async (listName: string, value: ListItem[]) => {
      get()._setList({ listName, value });
    },

    addToList: async ({ listName, itemData }) => {
      const foundList = findListByName(get().lists, listName);
      const currentList = (foundList?.items as ListItem[]) || [];

      const existingIndex = currentList.findIndex(
        (item) => item.file_name === itemData.file_name
      );

      if (existingIndex === -1) {
        const newItem: ListItem = {
          ...itemData,
          dateAdded: new Date().toISOString(),
        };
        const newItems = [...currentList, newItem];

        get()._setList({ listName, value: newItems });
      }
    },

    removeFromList: async ({ listName, fileName }) => {
      const foundList = findListByName(get().lists, listName);
      if (foundList) {
        const currentList = foundList.items as ListItem[];
        const filteredItems = currentList.filter(
          (item) => item.file_name !== fileName
        );

        get()._setList({ listName, value: filteredItems });
      }
    },

    removeList: async (listName) => {
      const lists = get().lists.filter((list: List) => list.name !== listName);
      set({ lists });
      await get()._removeList(listName);
    },

    renameList: async (oldName: string, newName: string) => {
      const list = get().lists.find((l: List) => l.name === oldName);
      if (!list) return;
      const existingList = get().lists.find((l: List) => l.name === newName);
      if (existingList) {
        throw new Error('Список с таким именем уже существует');
      }      
      const updatedLists = get().lists.map((l: List) => 
        l.name === oldName ? { ...l, name: newName } : l
      );      
      set({ lists: updatedLists });
      await get()._renameList(oldName, newName);
    },

    updateFileInAllLists: async ({
      file: updatedFile,
      field = 'full_path',
    }) => {
      let hasChanges = false;

      const updatedLists: Lists = get().lists.map((list) => {
        const updatedItems = (list.items as ListItem[]).map((file) => {
          if (updatedFile[field] === file[field]) {
            hasChanges = true;
            return {
              ...updatedFile,
              dateAdded: file.dateAdded,
              is_pinned: file.is_pinned,
              pinned_order: file.pinned_order,
            };
          }
          return file;
        });

        return { ...list, items: updatedItems };
      });

      if (hasChanges) {
        get()._setLists(updatedLists);
      }
    },

    updateFilesInAllLists: async (updatedFiles) => {
      // Создаем Map для быстрого поиска по full_path
      const updatedFilesMap = new Map(
        updatedFiles.map((file) => [file.full_path, file])
      );
      let hasChanges = false;

      const updatedLists: Lists = get().lists.map((list) => {
        const updatedItems = (list.items as ListItem[]).map((file) => {
          const updatedFile = updatedFilesMap.get(file.full_path);
          if (updatedFile) {
            hasChanges = true;
            return {
              ...updatedFile,
              dateAdded: file.dateAdded,
              is_pinned: file.is_pinned,
              pinned_order: file.pinned_order,
            };
          }
          return file;
        });

        return { ...list, items: updatedItems };
      });

      if (hasChanges) {
        get()._setLists(updatedLists);
      }
    },

    pinItem: async ({ listName, fileName }) => {
      const foundList = findListByName(get().lists, listName);
      if (foundList) {
        const currentList = foundList.items as ListItem[];
        const itemIndex = currentList.findIndex(
          (item) => item.file_name === fileName
        );

        if (itemIndex !== -1) {
          const item = currentList[itemIndex];
          const maxOrder = Math.max(
            ...currentList
              .filter((i) => i.is_pinned)
              .map((i) => i.pinned_order ?? 0),
            -1
          );

          item.is_pinned = true;
          item.pinned_order = maxOrder + 1;

          get()._setList({ listName, value: [...currentList] });
        }
      }
    },

    unpinItem: async ({ listName, fileName }) => {
      const foundList = findListByName(get().lists, listName);
      if (foundList) {
        const currentList = foundList.items as ListItem[];
        const itemIndex = currentList.findIndex(
          (item) => item.file_name === fileName
        );

        if (itemIndex !== -1) {
          const item = currentList[itemIndex];
          item.is_pinned = false;
          delete item.pinned_order;

          get()._setList({ listName, value: [...currentList] });
        }
      }
    },
  };
};
