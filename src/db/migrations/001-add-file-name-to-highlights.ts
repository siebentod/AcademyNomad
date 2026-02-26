import type { Migration } from './types';
import { getFileName } from 'src/shared/lib/utils';

export const migration: Migration = {
  name: 'add-file-name-to-highlights',
  description: 'Add file_name column to highlights table and populate it from file_path',
  
  async up(db) {
    console.log('Starting migration: add file_name field to highlights...');
    
    // Проверяем, существует ли уже колонка file_name
    const tableInfo = await db.select("PRAGMA table_info(highlights)") as Array<{name: string}>;
    const hasFileNameColumn = tableInfo.some((col) => col.name === 'file_name');
    
    if (!hasFileNameColumn) {
      // Добавляем колонку
      await db.execute(`
        ALTER TABLE highlights ADD COLUMN file_name TEXT
      `);
      console.log('Added file_name column to highlights table');
    } else {
      console.log('file_name column already exists');
    }
    
    // Обновляем существующие записи, у которых нет file_name
    const highlightsToUpdate = await db.select(`
      SELECT h.id, h.file_path, h.file_id 
      FROM highlights h
      WHERE h.file_path IS NOT NULL 
        AND (h.file_name IS NULL OR h.file_name = '')
    `) as Array<{id: number, file_path: string, file_id: string}>;
    
    console.log(`Found ${highlightsToUpdate.length} highlights to update`);
    
    for (const highlight of highlightsToUpdate) {
      const fileName = getFileName(highlight.file_path);
      await db.execute(
        'UPDATE highlights SET file_name = ? WHERE id = ?',
        [fileName, highlight.id]
      );
    }
    
    console.log('Migration add-file-name-to-highlights completed successfully');
  }
};
