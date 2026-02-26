// src/db/migrate.ts
import { LazyStore } from '@tauri-apps/plugin-store';
import { initDb, getDb } from './index';
import type { ListItem } from 'src/shared/types';

export async function migrateFromJsonToDb() {
  try {
    console.log('Starting migration from JSON to SQLite...');

    const storeFile = new LazyStore('lists.json');
    const entries = await storeFile.entries();
    const jsonData = Object.fromEntries(entries) as Record<string, ListItem[]>;

    if (Object.keys(jsonData).length === 0) {
      console.log('No data to migrate');
      return;
    }

    await initDb();
    const db = getDb();

    // Очищаем БД на всякий случай
    try {
      await db.execute('DELETE FROM highlights');
      await db.execute('DELETE FROM file_lists');
      await db.execute('DELETE FROM files');
      await db.execute('DELETE FROM lists');
    } catch (error) {
      console.error('Error clearing database:', error);
    }

    let globalFileId = 1; // Глобальный счетчик для ID файлов

    for (const [listName, items] of Object.entries(jsonData)) {
      console.log(`Migrating list: ${listName} (${items.length} items)`);

      const result = await db.execute('INSERT INTO lists (name) VALUES ($1)', [
        listName,
      ]);
      const listId = result.lastInsertId;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const currentFileId = globalFileId++; // Назначаем следующий ID

        // Считаем количество хайлайтов и аннотаций для файла
        const highlightsCount = item.highlights ? item.highlights.length : 0;
        const annotationsCount = item.highlights ? 
          item.highlights.filter(h => h.annotation_text && h.annotation_text.trim() !== '').length : 0;

        await db.execute(
          `INSERT INTO files (
            id, pdf_id, created_date, date_added, extension, file_name, full_path,
            highlights_count, annotations_count, is_locked, modified_date,
            pdf_author, pdf_creator, pdf_title, size, title
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
          [
            currentFileId, // Новый автоинкрементный ID
            item.id, // Оригинальный string ID сохраняем в pdf_id
            item.created_date ?? null,
            item.dateAdded ?? null,
            item.extension ?? null,
            item.file_name ?? null,
            item.full_path ?? null,
            highlightsCount,
            annotationsCount,
            item.is_locked ? 1 : 0,
            item.modified_date ?? null,
            item.pdf_author ?? null,
            item.pdf_creator ?? null,
            item.pdf_title ?? null,
            item.size ?? null,
            item.title ?? null,
          ]
        );

        // Добавляем связь в file_lists
        await db.execute(
          'INSERT INTO file_lists (file_id, list_id, date_added, is_pinned, pinned_order) VALUES ($1, $2, $3, $4, $5)',
          [
            currentFileId, 
            listId, 
            item.dateAdded ?? new Date().toISOString(),
            item.is_pinned ?? false ? 1 : 0,
            item.pinned_order ?? 0
          ]
        );

        if (item.highlights && item.highlights.length > 0) {
          for (let j = 0; j < item.highlights.length; j++) {
            const h = item.highlights[j];
            await db.execute(
              `INSERT INTO highlights (
                file_id, annotation_text, color_r, color_g, color_b,
                date, highlight_type, highlighted_text, page
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
              [
                currentFileId, // Используем новый integer ID
                h.annotation_text ?? null,
                h.color?.[0] ?? null,
                h.color?.[1] ?? null,
                h.color?.[2] ?? null,
                h.date ?? null,
                h.highlight_type ?? null,
                h.highlighted_text ?? null,
                h.page ?? null,
              ]
            );
          }
        }
      }
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}
