import { StateCreator } from 'zustand';
import type { Lists, List, ListItem } from 'src/shared/types';
import type { Store, ListsSlice } from '../types';
import { createPrivateSlice } from './index.private';
import { findListByName } from './listsUtils';
import { ListsDB } from 'src/db/ListsDB';
import { FilesDB } from 'src/db/FilesDB';
import toast from 'react-hot-toast';

export const createListsSlice: StateCreator<Store, [], [], ListsSlice> = (
  set,
  get
) => {
  const privateSlice = createPrivateSlice(set, get);

  return {
    lists: [],
    activeList: null,
    areListsLoaded: false,

    ...privateSlice,

    setActiveList: async (listName: string) => {
      get().view.actions.setSearchQuery('');
      if (!listName) {
        set({ activeList: null });
        return;
      }
      const list = await ListsDB.getListByName(listName);
      if (!list?.id) {
        set({ activeList: null });
        return;
      }
      const items = await FilesDB.getFilesByList(list.id);
      set({ activeList: { ...list, items } });
    },

    createList: async (listName: string, value: ListItem[]) => {
      await ListsDB.createNewList(listName, value);
      set({ lists: [...get().lists, { name: listName, items: value }] });
    },

    addToList: async ({ listName, itemData }) => {
      const foundList = findListByName(get().lists, listName);
      const listItems = (foundList?.items as ListItem[]) || [];
      const activeListName = get().activeList?.name;

      if (!foundList || !foundList.id) {
        toast.error('Список не найден');
        return;
      }

      const itemExists = listItems.some(
        (item) => item.file_name === itemData.file_name
      );

      if (itemExists) {
        toast.error('Файл с таким именем уже существует');
      } else {
        const newItem: ListItem = {
          ...itemData,
          date_added: new Date().toISOString(),
        };
        const newItems = [...listItems, newItem];

        await FilesDB.addFileToList(itemData, foundList.id);

        if (activeListName) {
          get().setActiveList(activeListName);
        }

        // 🔥Возможно вместо этого надо вручную обновлять нужные состояния. Какие?
        get().triggerSearch();
      }
    },

    removeFromList: async ({ listName, fileId }) => {
      const listId = findListByName(get().lists, listName)?.id;
      if (!listId) {
        toast.error('Список не найден');
        return;
      }
      await ListsDB.removeFileFromList({ listId, fileId });
      get().triggerSearch();
    },

    removeList: async (listName) => {
      const listId = findListByName(get().lists, listName)?.id;
      if (!listId) {
        toast.error('Список не найден');
        return;
      }
      await ListsDB.removeList(listId);
      set({ lists: get().lists.filter((list) => list.id !== listId) });
      get().triggerSearch();
    },

    renameList: async (oldName: string, newName: string) => {
      const listId = findListByName(get().lists, oldName)?.id;
      if (!listId) {
        toast.error('Список не найден');
        return;
      }
      await ListsDB.renameList(listId, newName);
      set({ lists: get().lists.map((list) => (list.id === listId ? { ...list, name: newName } : list)) });
    },

    pinItem: async ({ listName, fileId }) => {
      console.log('listName', listName);
      console.log('fileId', fileId);
      const listId = findListByName(get().lists, listName)?.id;
      if (!listId) {
        toast.error('Список не найден');
        return;
      }

      ListsDB.pinItemInList(fileId, listId);

      get().triggerSearch();
    },

    unpinItem: async ({ listName, fileId }) => {
      const listId = findListByName(get().lists, listName)?.id;
      if (!listId) {
        toast.error('Список не найден');
        return;
      }

      ListsDB.unpinItemInList(fileId, listId);

      get().triggerSearch();
    },
  };
};
