import { create } from 'zustand';
import { Store } from './types';
import { createSettingsSlice } from './settings';
import { createFilesSlice } from './files';
import { createListsSlice } from './lists';
import { createViewFilterSlice } from './view-filter';

export const useStore = create<Store>()((...a) => ({
  ...createSettingsSlice(...a),
  ...createFilesSlice(...a),
  ...createListsSlice(...a),
  ...createViewFilterSlice(...a),
}));

const store = useStore.getState();
Promise.all([
  store._loadSettings(),
  store._loadLists()
]).catch(error => {
  console.error('Ошибка инициализации приложения:', error);
});
