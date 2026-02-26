import type { Migration } from './types';

export const migration: Migration = {
  name: 'link-highlights-to-files-and-remove-redundant-fields',
  description: 'Link highlights.file_id to files.id and remove file_path and file_name fields from highlights',
  
  async up(db) {
    console.log('Starting migration: link highlights to files and remove redundant fields...');
    
    // Очищаем временные таблицы от предыдущих неудачных миграций
    await db.execute('DROP TABLE IF EXISTS highlights_temp');
    await db.execute('DROP TABLE IF EXISTS highlights_new');
    console.log('Cleaned up any existing temporary tables');
    
    // 1. Мигрируем существующие хайлайты, связывая их с файлами по file_path
    const highlightsWithoutFileId = await db.select(`
      SELECT id, file_path, file_name
      FROM highlights 
      WHERE file_id IS NULL AND file_path IS NOT NULL
    `) as Array<{id: number, file_path: string, file_name: string}>;
    
    console.log(`Found ${highlightsWithoutFileId.length} highlights without file_id to migrate`);
    
    for (const highlight of highlightsWithoutFileId) {
      // Ищем файл по полному пути
      const matchingFile = await db.select(`
        SELECT id 
        FROM files 
        WHERE full_path = ? OR file_name = ?
        LIMIT 1
      `, [highlight.file_path, highlight.file_name]) as Array<{id: number}>;
      
      if (matchingFile.length > 0) {
        await db.execute(`
          UPDATE highlights 
          SET file_id = ? 
          WHERE id = ?
        `, [matchingFile[0].id, highlight.id]);
      }
    }
    
    console.log('Migrated highlights to link with files');
    
    // 2. Удаляем колонки file_path и file_name из таблицы highlights
    const highlightsTableInfo = await db.select("PRAGMA table_info(highlights)") as Array<{name: string}>;
    const hasFilePathColumn = highlightsTableInfo.some((col) => col.name === 'file_path');
    const hasFileNameColumn = highlightsTableInfo.some((col) => col.name === 'file_name');
    
    if (hasFilePathColumn || hasFileNameColumn) {
      console.log('Removing file_path and file_name columns from highlights table...');
      
      // Сначала удаляем внешние ключи, если они существуют
      await db.execute('PRAGMA foreign_keys = OFF');
      
      // В SQLite нельзя удалить колонку напрямую, поэтому пересоздаем таблицу
      await db.execute(`
        CREATE TABLE highlights_temp (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          file_id INTEGER,
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
      
      // Копируем данные без file_path и file_name, только валидные file_id
      await db.execute(`
        INSERT INTO highlights_temp (
          id, file_id, annotation_text, color_r, color_g, color_b,
          date, highlight_type, highlighted_text, page
        )
        SELECT 
          h.id, h.file_id, h.annotation_text, h.color_r, h.color_g, h.color_b,
          h.date, h.highlight_type, h.highlighted_text, h.page
        FROM highlights h
        WHERE h.file_id IS NULL OR EXISTS (
          SELECT 1 FROM files f WHERE f.id = h.file_id
        )
      `);
      
      // Удаляем старую таблицу
      await db.execute('DROP TABLE highlights');
      
      // Переименовываем временную таблицу
      await db.execute('ALTER TABLE highlights_temp RENAME TO highlights');
      
      // Включаем обратно внешние ключи
      await db.execute('PRAGMA foreign_keys = ON');
      
      console.log('Successfully removed file_path and file_name columns from highlights table');
    } else {
      console.log('file_path and file_name columns do not exist in highlights table');
    }
    
    // 3. Добавляем внешний ключ constraint
    await db.execute(`
      CREATE TABLE highlights_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_id INTEGER,
        annotation_text TEXT,
        color_r REAL,
        color_g REAL,
        color_b REAL,
        date TEXT,
        highlight_type TEXT,
        highlighted_text TEXT,
        page INTEGER,
        FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE
      )
    `);
    
    // Копируем данные в новую таблицу с внешним ключом
    await db.execute(`
      INSERT INTO highlights_new (
        id, file_id, annotation_text, color_r, color_g, color_b,
        date, highlight_type, highlighted_text, page
      )
      SELECT 
        id, file_id, annotation_text, color_r, color_g, color_b,
        date, highlight_type, highlighted_text, page
      FROM highlights
    `);
    
    // Удаляем старую таблицу и переименовываем
    await db.execute('DROP TABLE highlights');
    await db.execute('ALTER TABLE highlights_new RENAME TO highlights');
    
    // 4. Обновляем индексы
    await db.execute('CREATE INDEX IF NOT EXISTS idx_highlights_file_id ON highlights(file_id)');
    
    // 5. Удаляем старые индексы если они существуют
    await db.execute('DROP INDEX IF EXISTS idx_highlights_file_path');
    await db.execute('DROP INDEX IF EXISTS idx_highlights_file_name');
    
    console.log('Migration link-highlights-to-files-and-remove-redundant-fields completed successfully');
  }
};
