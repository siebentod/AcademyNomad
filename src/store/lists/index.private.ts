import { initDb, getDb } from 'src/db';
import type { ListItem, Lists } from 'src/shared/types';
import type { ListsSlice } from '../types';

export const createPrivateSlice = (set: any, get: () => ListsSlice) => ({
  _loadLists: async () => {
    try {
      await initDb();
      const db = getDb();

      const allLists = await db.select<Array<{ id: number; name: string }>>(
        'SELECT id, name FROM lists'
      );

      if (!allLists.length) {
        set({ lists: [], areListsLoaded: true });
        return;
      }

      const loadedLists: Lists = await Promise.all(
        allLists.map(async (list) => {
          const items = await db.select<ListItem[]>(
            `SELECT 
              f.id, f.created_date, f.date_added, f.extension, f.file_name, f.full_path,
              f.is_locked, f.modified_date,
              f.pdf_author, f.pdf_creator, f.pdf_title, f.size, f.title
            FROM files f
            INNER JOIN file_lists fl ON f.id = fl.file_id
            WHERE fl.list_id = $1
            ORDER BY fl.date_added DESC`,
            [list.id]
          );

          return {
            name: list.name,
            id: list.id,
            items,
          };
        })
      );

      set({ lists: loadedLists, areListsLoaded: true });
    } catch (error) {
      console.error('Ошибка загрузки списков:', error);
      set({ lists: [], areListsLoaded: true });
    }
  },
});
