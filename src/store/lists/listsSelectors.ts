import type { Lists, ListItem, File } from 'src/shared/types';
import type { ListsSlice } from '../types';
import { useStore } from 'src/store';

export const getCurrentLists = (): Lists => {
  return useStore.getState().lists;
};

export const getFileByFullPath = (fullPath: string): File | null => {
  const state = useStore.getState();
  
  for (const list of state.lists) {
    const file = (list.items as File[]).find((item: File) => item.full_path === fullPath);
    if (file) {
      return file;
    }
  }
  return null;
};

export const getListByName = (listName: string | null): ListItem[] => {
  if (!listName) return [];
  
  const state = useStore.getState();
  const foundList = state.lists.find((list) => list.name === listName);
  return foundList ? foundList.items : [];
};