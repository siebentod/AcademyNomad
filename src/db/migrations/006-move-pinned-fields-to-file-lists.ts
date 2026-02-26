import Database from '@tauri-apps/plugin-sql';

export const migration = {
  name: '006-move-pinned-fields-to-file-lists',
  
  async up(db: Database) {
    console.log('Moving is_pinned and pinned_order from files to file_lists table...');
    
    // 1. Добавляем новые поля в таблицу file_lists
    await db.execute(`
      ALTER TABLE file_lists 
      ADD COLUMN is_pinned INTEGER DEFAULT 0
    `);
    
    await db.execute(`
      ALTER TABLE file_lists 
      ADD COLUMN pinned_order INTEGER DEFAULT 0
    `);
    
    // 2. Переносим данные из таблицы files в file_lists
    // Для каждой записи в file_lists копируем is_pinned и pinned_order из соответствующего файла
    await db.execute(`
      UPDATE file_lists 
      SET is_pinned = (
        SELECT is_pinned 
        FROM files 
        WHERE files.id = file_lists.file_id
      ),
      pinned_order = (
        SELECT pinned_order 
        FROM files 
        WHERE files.id = file_lists.file_id
      )
    `);
    
    // 3. Удаляем поля из таблицы files
    await db.execute(`
      ALTER TABLE files 
      DROP COLUMN is_pinned
    `);
    
    await db.execute(`
      ALTER TABLE files 
      DROP COLUMN pinned_order
    `);
    
    console.log('Successfully moved pinned fields from files to file_lists table');
  }
};
