import type { Migration } from './types';

export const migration: Migration = {
  name: 'remove-list-id-from-highlights',
  description: 'Remove list_id column from highlights table by recreating the table',
  
  async up(db) {
    console.log('Starting migration: remove list_id column from highlights...');
    
    // Проверяем, существует ли колонка list_id
    const tableInfo = await db.select("PRAGMA table_info(highlights)") as Array<{name: string}>;
    const hasListIdColumn = tableInfo.some((col) => col.name === 'list_id');
    
    if (hasListIdColumn) {
      // В SQLite нельзя удалить колонку напрямую, поэтому пересоздаем таблицу
      console.log('Removing list_id column from highlights table...');
      
      // 1. Создаем временную таблицу без list_id
      await db.execute(`
        CREATE TABLE highlights_temp (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          file_id TEXT,
          file_path TEXT,
          file_name TEXT,
          annotation_text TEXT,
          color_r REAL,
          color_g REAL,
          color_b REAL,
          date TEXT,
          highlight_type TEXT,
          highlighted_text TEXT,
          page INTEGER
        )
      `);
      
      // 2. Копируем данные без list_id
      await db.execute(`
        INSERT INTO highlights_temp (
          id, file_id, file_path, file_name, annotation_text,
          color_r, color_g, color_b, date, highlight_type,
          highlighted_text, page
        )
        SELECT 
          id, file_id, file_path, file_name, annotation_text,
          color_r, color_g, color_b, date, highlight_type,
          highlighted_text, page
        FROM highlights
      `);
      
      // 3. Удаляем старую таблицу
      await db.execute('DROP TABLE highlights');
      
      // 4. Переименовываем временную таблицу
      await db.execute('ALTER TABLE highlights_temp RENAME TO highlights');
      
      console.log('Successfully removed list_id column from highlights table');
    } else {
      console.log('list_id column does not exist in highlights table');
    }
    
    console.log('Migration remove-list-id-from-highlights completed successfully');
  }
};
