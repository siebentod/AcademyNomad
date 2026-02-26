import { initDb, getDb } from './index';
import { buildInsert } from './utils';
import { HighlightsDB } from './HighlightsDB';
import type { List, ListItem, Lists } from 'src/shared/types';

export class ListsDB {
  static async removeList(listId: number) {
    try {
      await initDb();
      const db = getDb();
      await db.execute('DELETE FROM lists WHERE id = $1', [listId]);
    } catch (error) {
      console.error(`Ошибка удаления списка с ID ${listId}:`, error);
      throw error;
    }
  }

  static async getListByName(listName: string) {
    try {
      await initDb();
      const db = getDb();

      const result = await db.select<List[]>(
        'SELECT * FROM lists WHERE name = ?',
        [listName]
      );
      
      return result?.[0];
    } catch (error) {
      console.error('Ошибка получения списка:', error);
      throw error;
    }
  }

  static async removeFileFromList({ listId, fileId }: { listId: number; fileId: number }) {
    try {
      await initDb();
      const db = getDb();
      
      await db.execute('DELETE FROM file_lists WHERE list_id = $1 AND file_id = $2', [listId, fileId]);
    } catch (error) {
      console.error(`Ошибка удаления файла ${fileId} из списка ${listId}:`, error);
      throw error;
    }
  }

  static async createNewList(listName: string, items: ListItem[]) {
    try {
      await initDb();
      const db = getDb();

      const existingList = await db.select<Array<{ id: number }>>(
        'SELECT id FROM lists WHERE name = $1',
        [listName]
      );

      if (existingList.length > 0) {
        throw new Error(`Список с названием "${listName}" уже существует`);
      }

      const insert = buildInsert('lists', { name: listName });
      const result = await db.execute(insert.sql, insert.values);
      const listId = Number(result.lastInsertId);

      // Add items to the list if provided
      if (items.length > 0) {
        for (const item of items) {
          if (item.id) {
            await db.execute(
              'INSERT INTO file_lists (list_id, file_id, date_added) VALUES ($1, $2, $3)',
              [listId, item.id, new Date().toISOString()]
            );
          }
        }
      }
      
      return listId;
    } catch (error) {
      console.error(`Ошибка создания списка "${listName}":`, error);
      throw error;
    }
  }

  static async renameList(listId: number, newName: string) {
    try {
      await initDb();
      const db = getDb();

      // Проверяем, существует ли список с таким ID
      const existingList = await db.select<Array<{ id: number }>>(
        'SELECT id FROM lists WHERE id = $1',
        [listId]
      );

      if (existingList.length === 0) {
        throw new Error(`Список с ID ${listId} не существует`);
      }

      // Проверяем, не занято ли новое имя другим списком
      const nameExists = await db.select<Array<{ id: number }>>(
        'SELECT id FROM lists WHERE name = $1 AND id != $2',
        [newName, listId]
      );

      if (nameExists.length > 0) {
        throw new Error(`Список с названием "${newName}" уже существует`);
      }

      // Обновляем имя списка
      await db.execute('UPDATE lists SET name = $1 WHERE id = $2', [newName, listId]);
    } catch (error) {
      console.error(`Ошибка переименования списка с ID ${listId} в "${newName}":`, error);
      throw error;
    }
  }
static async pinItemInList(itemId: number, listId: number) {
  try {
    await initDb();
    const db = getDb();

    const existingItem = await db.select<Array<{ is_pinned: boolean; pinned_order: number }>>(
      'SELECT is_pinned, pinned_order FROM file_lists WHERE file_id = $1 AND list_id = $2',
      [itemId, listId]
    );

    if (existingItem.length === 0) {
      throw new Error(`Элемент с ID ${itemId} не найден в списке ${listId}`);
    }

    if (existingItem[0].is_pinned) {
      // Элемент уже запинен — перемещаем наверх
      const currentOrder = existingItem[0].pinned_order;

      // Сдвигаем вниз только тех, кто выше текущего (меньший order = выше)
      await db.execute(
        'UPDATE file_lists SET pinned_order = pinned_order + 1 WHERE list_id = $1 AND is_pinned = 1 AND pinned_order < $2',
        [listId, currentOrder]
      );

      // Ставим текущий на первое место
      await db.execute(
        'UPDATE file_lists SET pinned_order = 1 WHERE file_id = $1 AND list_id = $2',
        [itemId, listId]
      );
    } else {
      // Элемент не запинен — пинаем и ставим наверх
      await db.execute(
        'UPDATE file_lists SET pinned_order = pinned_order + 1 WHERE list_id = $1 AND is_pinned = 1',
        [listId]
      );

      await db.execute(
        'UPDATE file_lists SET is_pinned = 1, pinned_order = 1 WHERE file_id = $1 AND list_id = $2',
        [itemId, listId]
      );
    }
  } catch (error) {
    console.error(`Ошибка закрепления элемента ${itemId} в списке ${listId}:`, error);
    throw error;
  }
}

static async unpinItemInList(itemId: number, listId: number) {
  try {
    await initDb();
    const db = getDb();

    const existingItem = await db.select<Array<{ is_pinned: boolean; pinned_order: number }>>(
      'SELECT is_pinned, pinned_order FROM file_lists WHERE file_id = $1 AND list_id = $2',
      [itemId, listId]
    );

    if (existingItem.length === 0) {
      throw new Error(`Элемент с ID ${itemId} не найден в списке ${listId}`);
    }

    if (!existingItem[0].is_pinned) {
      return;
    }

    const currentOrder = existingItem[0].pinned_order;

    // Сдвигаем вверх тех, кто был ниже удаляемого (заполняем пробел)
    await db.execute(
      'UPDATE file_lists SET pinned_order = pinned_order - 1 WHERE list_id = $1 AND is_pinned = 1 AND pinned_order > $2',
      [listId, currentOrder]
    );

    // Снимаем пин
    await db.execute(
      'UPDATE file_lists SET is_pinned = 0, pinned_order = 0 WHERE file_id = $1 AND list_id = $2',
      [itemId, listId]
    );
  } catch (error) {
    console.error(`Ошибка открепления элемента ${itemId} из списка ${listId}:`, error);
    throw error;
  }
}
}
