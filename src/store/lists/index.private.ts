import { LazyStore } from '@tauri-apps/plugin-store';
import type { List, ListItem, Lists } from 'src/shared/types';
import type { ListsSlice } from '../types';
import { updateListByName } from './listsUtils';

const storeFile = new LazyStore('lists.json');

export const createPrivateSlice = (set: any, get: () => ListsSlice) => ({
  _setLists: async (lists: Lists) => {
    set({ lists });
    await get()._writeLists(lists);
  },

  _setList: async ({
    listName,
    value,
  }: {
    listName: string;
    value: ListItem[];
  }) => {
    set((state: ListsSlice) => ({
      lists: updateListByName(state.lists, listName, value),
    }));
    await get()._writeList({ listName, value });
  },

  _loadLists: async () => {
    try {
      const entries = await storeFile.entries();
      const loadedListsObj = Object.fromEntries(entries) as Record<
        string,
        ListItem[]
      >;

      if (!Object.keys(loadedListsObj).length) {
        set({ lists: [], areListsLoaded: true });
        return;
      }

      const loadedLists: Lists = Object.entries(loadedListsObj).map(
        ([name, items]) => ({
          name,
          items,
        })
      );

      set({ lists: loadedLists, areListsLoaded: true });
    } catch (error) {
      console.error('Ошибка загрузки списков:', error);
      set({ lists: [], areListsLoaded: true });
    }
  },

  _writeList: async ({
    listName,
    value,
  }: {
    listName: string;
    value: ListItem[];
  }) => {
    try {
      await storeFile.set(listName, value);
      await storeFile.save();
    } catch (error) {
      console.error(`Ошибка сохранения списка "${listName}":`, error);
      throw error;
    }
  },

  _writeLists: async (lists: Lists) => {
    try {
      console.log('Saving lists:', lists);
      await Promise.all(
        lists.map((list: List) => storeFile.set(list.name, list.items))
      );
      await storeFile.save();
    } catch (error) {
      console.error('Ошибка сохранения всех списков:', error);
      throw error;
    }
  },

  _removeList: async (listName: string) => {
    try {
      await storeFile.delete(listName);
      await storeFile.save();
    } catch (error) {
      console.error(`Ошибка удаления списка "${listName}":`, error);
      throw error;
    }
  },

  _renameList: async (oldName: string, newName: string) => {
    try {
      const listData = await storeFile.get(oldName) as ListItem[];
      if (listData) {
        await storeFile.set(newName, listData);
        await storeFile.delete(oldName);
        await storeFile.save();
      }
    } catch (error) {
      console.error(`Ошибка переименования списка "${oldName}" в "${newName}":`, error);
      throw error;
    }
  },
});
