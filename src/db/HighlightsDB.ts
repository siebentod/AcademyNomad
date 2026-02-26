import { initDb, getDb } from './index';
import { buildBatchInsert } from './utils';
import { convertHighlightsToDB } from 'src/shared/lib/utils';
import type { Highlight } from 'src/shared/types';

export class HighlightsDB {
  static async updateHighlightsFor({
    highlights,
    fileId,
  }: {
    highlights: Highlight[];
    fileId: number;
  }) {
    try {
      await initDb();
      const db = getDb();
      console.log('fileId', fileId)

      if (fileId) {
        await db.execute('DELETE FROM highlights WHERE file_id = $1', [fileId]);
      }

      if (highlights && highlights.length > 0) {
        const convertedHighlights = convertHighlightsToDB(highlights);

        // Добавляем file_id ко всем записям
        const highlightData = convertedHighlights.map((h) => ({
          ...h,
          file_id: fileId,
        }));

        // Batch insert одним запросом
        const insert = buildBatchInsert('highlights', highlightData);
        await db.execute(insert.sql, insert.values);
      }
    } catch (error) {
      console.error(`Ошибка вставки хайлайтов для файла "${fileId}":`, error);
      throw error;
    }
  }

  static async getHighlights({
    limit = 50,
    offset = 0,
    list_id,
    file_id,
    selectedBook,
    highlightsSearchText,
    showOnlyAnnotated,
    searchQuery,
  }: {
    limit?: number;
    offset?: number;
    list_id?: number;
    file_id?: number;
    selectedBook?: string | null;
    highlightsSearchText?: string;
    showOnlyAnnotated?: boolean;
    searchQuery?: string;
  } = {}): Promise<{
    items: Highlight[];
    total: number;
  }> {
    try {
      await initDb();
      const db = getDb();

      // Сначала получаем total
      let countQuery =
        'SELECT COUNT(*) as total FROM highlights h LEFT JOIN files f ON h.file_id = f.id';
      const countConditions: string[] = [];
      const countValues: (string | number)[] = [];

      if (file_id) {
        countConditions.push('h.file_id = ?');
        countValues.push(file_id);
      }

      if (list_id) {
        countConditions.push(
          'EXISTS (SELECT 1 FROM file_lists fl WHERE fl.file_id = h.file_id AND fl.list_id = ?)'
        );
        countValues.push(list_id);
      }

      if (selectedBook) {
        countConditions.push('f.title = ?');
        countValues.push(selectedBook);
      }

      if (showOnlyAnnotated) {
        countConditions.push(
          "(h.annotation_text IS NOT NULL AND h.annotation_text != '')"
        );
      }

      if (highlightsSearchText && highlightsSearchText.trim() !== '') {
        countConditions.push(
          '(LOWER(h.highlighted_text) LIKE LOWER(?) OR LOWER(h.annotation_text) LIKE LOWER(?))'
        );
        const searchText = `%${highlightsSearchText.trim()}%`;
        countValues.push(searchText, searchText);
      }

      if (searchQuery && searchQuery.trim() !== '') {
        countConditions.push('LOWER(f.title) LIKE LOWER(?)');
        const titleSearchText = `%${searchQuery.trim()}%`;
        countValues.push(titleSearchText);
      }

      if (countConditions.length > 0) {
        countQuery += ' WHERE ' + countConditions.join(' AND ');
      }

      const countResult = await db.select<Array<{ total: number }>>(
        countQuery,
        countValues
      );
      const total = countResult[0]?.total || 0;

      // Затем получаем данные с лимитом
      let query =
        'SELECT h.*, f.title, f.full_path FROM highlights h LEFT JOIN files f ON h.file_id = f.id';
      const conditions: string[] = [];
      const values: (string | number)[] = [];

      if (file_id) {
        conditions.push('h.file_id = ?');
        values.push(file_id);
      }

      if (list_id) {
        conditions.push(
          'EXISTS (SELECT 1 FROM file_lists fl WHERE fl.file_id = h.file_id AND fl.list_id = ?)'
        );
        values.push(list_id);
      }

      if (selectedBook) {
        conditions.push('f.title = ?');
        values.push(selectedBook);
      }

      if (showOnlyAnnotated) {
        conditions.push(
          "(h.annotation_text IS NOT NULL AND h.annotation_text != '')"
        );
      }

      if (highlightsSearchText && highlightsSearchText.trim() !== '') {
        conditions.push(
          '(LOWER(h.highlighted_text) LIKE LOWER(?) OR LOWER(h.annotation_text) LIKE LOWER(?))'
        );
        const searchText = `%${highlightsSearchText.trim()}%`;
        values.push(searchText, searchText);
      }

      if (searchQuery && searchQuery.trim() !== '') {
        conditions.push('LOWER(f.title) LIKE LOWER(?)');
        const titleSearchText = `%${searchQuery.trim()}%`;
        values.push(titleSearchText);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' ORDER BY h.date DESC LIMIT ? OFFSET ?';
      values.push(limit, offset);

      const items = await db.select<Array<Highlight>>(query, values);
      console.log('itemsz', items);

      return { items, total };
    } catch (error) {
      console.error('Ошибка получения хайлайтов:', error);
      throw error;
    }
  }

  static async deleteHighlights({
    file_path,
    list_id,
    file_id,
    file_name,
  }: {
    file_path?: string;
    list_id?: number;
    file_id?: number;
    file_name?: string;
  }) {
    try {
      // If no parameters provided, do nothing
      if (!file_path && !list_id && !file_id && !file_name) {
        return;
      }

      await initDb();
      const db = getDb();

      let query = 'DELETE FROM highlights';
      const conditions: string[] = [];
      const values: (string | number)[] = [];

      if (file_path) {
        conditions.push('file_path = ?');
        values.push(file_path);
      }

      if (list_id) {
        conditions.push(
          'id IN (SELECT h.id FROM highlights h JOIN file_lists fl ON h.file_id = fl.file_id WHERE fl.list_id = ?)'
        );
        values.push(list_id);
      }

      if (file_id) {
        conditions.push('file_id = ?');
        values.push(file_id);
      }

      if (file_name) {
        conditions.push('h.file_id IN (SELECT id FROM files WHERE file_name = ?)');
        values.push(file_name);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
        await db.execute(query, values);
      }
    } catch (error) {
      console.error('Ошибка удаления хайлайтов:', error);
      throw error;
    }
  }

  static async deleteTemporaryHighlights() {
    try {
      await initDb();
      const db = getDb();

      // Удаляем хайлайты, у которых file_id не существует в таблице files
      await db.execute(`
        DELETE FROM highlights 
        WHERE NOT EXISTS (SELECT 1 FROM files WHERE files.id = highlights.file_id)
      `);
    } catch (error) {
      console.error('Ошибка удаления временных хайлайтов:', error);
      throw error;
    }
  }
}
