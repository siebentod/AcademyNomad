import type { Migration } from './types';

export const migration: Migration = {
  name: 'create-file-lists-junction-table',
  description: 'Create file_lists junction table and migrate existing file-list relationships',
  
  async up(db) {
    console.log('Starting migration: create file_lists junction table...');
    
    // 1. Создаем связующую таблицу
    await db.execute(`
      CREATE TABLE IF NOT EXISTS file_lists (
        file_id INTEGER NOT NULL,
        list_id INTEGER NOT NULL,
        date_added TEXT DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (file_id, list_id),
        FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE,
        FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE
      )
    `);
    console.log('Created file_lists junction table');
    
    // 2. Проверяем, есть ли данные для миграции из files.list_id
    const filesTableInfo = await db.select("PRAGMA table_info(files)") as Array<{name: string}>;
    const hasListIdColumn = filesTableInfo.some((col) => col.name === 'list_id');
    
    if (hasListIdColumn) {
      // Мигрируем существующие связи из files.list_id
      const existingRelations = await db.select(`
        SELECT id, list_id 
        FROM files 
        WHERE list_id IS NOT NULL
      `) as Array<{id: number, list_id: number}>;
      
      console.log(`Found ${existingRelations.length} existing file-list relations to migrate`);
      
      for (const relation of existingRelations) {
        await db.execute(`
          INSERT OR IGNORE INTO file_lists (file_id, list_id, date_added) 
          VALUES (?, ?, ?)
        `, [
          relation.id, 
          relation.list_id, 
          new Date().toISOString()
        ]);
      }
      
      console.log('Migrated existing file-list relations');
      
      // 3. Удаляем колонку list_id из таблицы files
      console.log('Removing list_id column from files table...');
      
      // 1. Создаем временную таблицу без list_id
      await db.execute(`
        CREATE TABLE files_temp (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          pdf_id TEXT,
          created_date TEXT,
          date_added TEXT,
          extension TEXT,
          file_name TEXT,
          full_path TEXT,
          highlights_count INTEGER DEFAULT 0,
          annotations_count INTEGER DEFAULT 0,
          is_locked INTEGER DEFAULT 0,
          is_pinned INTEGER DEFAULT 0,
          modified_date TEXT,
          pdf_author TEXT,
          pdf_creator TEXT,
          pdf_title TEXT,
          pinned_order INTEGER DEFAULT 0,
          size INTEGER,
          title TEXT
        )
      `);
      
      // 2. Копируем данные без list_id
      await db.execute(`
        INSERT INTO files_temp (
          id, pdf_id, created_date, date_added, extension, file_name, full_path,
          highlights_count, annotations_count, is_locked, is_pinned, modified_date,
          pdf_author, pdf_creator, pdf_title, pinned_order, size, title
        )
        SELECT 
          id, pdf_id, created_date, date_added, extension, file_name, full_path,
          highlights_count, annotations_count, is_locked, is_pinned, modified_date,
          pdf_author, pdf_creator, pdf_title, pinned_order, size, title
        FROM files
      `);
      
      // 3. Удаляем старую таблицу
      await db.execute('DROP TABLE files');
      
      // 4. Переименовываем временную таблицу
      await db.execute('ALTER TABLE files_temp RENAME TO files');
      
      console.log('Successfully removed list_id column from files table');
    } else {
      console.log('list_id column does not exist in files table - no migration needed');
    }
    
    console.log('Migration create-file-lists-junction-table completed successfully');
  }
};
