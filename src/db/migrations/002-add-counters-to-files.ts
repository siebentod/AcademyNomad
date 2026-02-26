import type { Migration } from './types';

export const migration: Migration = {
  name: 'add-counters-to-files',
  description: 'Add highlights_count and annotations_count columns to files table and populate them',
  
  async up(db) {
    console.log('Starting migration: add highlights_count and annotations_count to files...');
    
    // Проверяем и добавляем колонки в таблицу files
    const filesTableInfo = await db.select("PRAGMA table_info(files)") as Array<{name: string}>;
    const hasHighlightsCountColumn = filesTableInfo.some((col) => col.name === 'highlights_count');
    const hasAnnotationsCountColumn = filesTableInfo.some((col) => col.name === 'annotations_count');
    
    if (!hasHighlightsCountColumn) {
      await db.execute(`
        ALTER TABLE files ADD COLUMN highlights_count INTEGER DEFAULT 0
      `);
      console.log('Added highlights_count column to files table');
    } else {
      console.log('highlights_count column already exists');
    }
    
    if (!hasAnnotationsCountColumn) {
      await db.execute(`
        ALTER TABLE files ADD COLUMN annotations_count INTEGER DEFAULT 0
      `);
      console.log('Added annotations_count column to files table');
    } else {
      console.log('annotations_count column already exists');
    }
    
    // Обновляем счетчики для всех файлов
    const filesToUpdate = await db.select(`
      SELECT DISTINCT f.id 
      FROM files f
      LEFT JOIN highlights h ON f.id = h.file_id
    `) as Array<{id: string}>;
    
    console.log(`Found ${filesToUpdate.length} files to update counters`);
    
    for (const file of filesToUpdate) {
      // Считаем количество хайлайтов для файла
      const highlightsCount = await db.select(`
        SELECT COUNT(*) as count 
        FROM highlights 
        WHERE file_id = ?
      `, [file.id]) as Array<{count: number}>;
      
      // Считаем количество аннотаций (непустых annotation_text) для файла
      const annotationsCount = await db.select(`
        SELECT COUNT(*) as count 
        FROM highlights 
        WHERE file_id = ? AND annotation_text IS NOT NULL AND annotation_text != ''
      `, [file.id]) as Array<{count: number}>;
      
      await db.execute(
        'UPDATE files SET highlights_count = ?, annotations_count = ? WHERE id = ?',
        [highlightsCount[0].count, annotationsCount[0].count, file.id]
      );
    }
    
    console.log('Migration add-counters-to-files completed successfully');
  }
};
