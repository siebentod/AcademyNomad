import { ListItem } from 'src/shared/types';
import { initDb, getDb } from './index';
import { files } from './schema';
import { convertValues } from './utils';

export class FilesDB {
  static async getFilesByPaths(paths: string[]) {
    try {
      await initDb();
      const db = getDb();

      if (paths.length === 0) {
        return [];
      }

      // Используем один запрос с IN оператором и LEFT JOIN для получения флага наличия в списках
      const placeholders = paths.map(() => '?').join(',');
      const query = `
        SELECT 
          f.*,
          CASE WHEN fl.file_id IS NOT NULL THEN 1 ELSE 0 END as in_list
        FROM files f
        LEFT JOIN file_lists fl ON f.id = fl.file_id
        WHERE f.full_path IN (${placeholders})
        ORDER BY f.full_path
      `;

      const result = await db.select<Array<ListItem>>(query, paths);
      return result;
    } catch (error) {
      console.error('Ошибка получения файлов по путям:', error);
      throw error;
    }
  }

  static async updateFileBy(
    searchCriteria: { id?: number; full_path?: string; file_name?: string },
    updateData: Record<string, unknown>
  ) {
    try {
      await initDb();
      const db = getDb();

      // Если ни одного критерия поиска нет, ничего не делаем
      if (!searchCriteria.id && !searchCriteria.full_path && !searchCriteria.file_name) {
        return null;
      }

      // Если нет данных для обновления, ничего не делаем
      if (Object.keys(updateData).length === 0) {
        return null;
      }

      // Получаем валидные поля из схемы Drizzle
      const validFields = Object.keys(files).filter(
        field => field !== 'id' // Исключаем primary key из обновления
      );

      // Фильтруем только валидные поля
      const filteredUpdateData = Object.fromEntries(
        Object.entries(updateData).filter(([key]) => validFields.includes(key))
      );

      // Если после фильтрации не осталось полей, ничего не делаем
      if (Object.keys(filteredUpdateData).length === 0) {
        return null;
      }

      // Формируем WHERE условие на основе критериев поиска
      const whereConditions: string[] = [];
      const whereValues: unknown[] = [];

      if (searchCriteria.id) {
        whereConditions.push('id = ?');
        whereValues.push(searchCriteria.id);
      }

      if (searchCriteria.full_path) {
        whereConditions.push('full_path = ?');
        whereValues.push(searchCriteria.full_path);
      }

      if (searchCriteria.file_name) {
        whereConditions.push('file_name = ?');
        whereValues.push(searchCriteria.file_name);
      }

      // Формируем SET часть запроса с отфильтрованными данными
      const setKeys = Object.keys(filteredUpdateData);
      const setPlaceholders = setKeys.map(key => `${key} = ?`);
      const setValues = Object.values(convertValues(filteredUpdateData));

      const query = `
        UPDATE files 
        SET ${setPlaceholders.join(', ')}
        WHERE ${whereConditions.join(' AND ')}
      `;

      const allValues = [...setValues, ...whereValues];
      const result = await db.execute(query, allValues);

      return result;
    } catch (error) {
      console.error('Ошибка обновления файла:', error);
      throw error;
    }
  }

  static async getFileBy(
    searchCriteria: { id?: number; full_path?: string; file_name?: string }
  ) {
    try {
      await initDb();
      const db = getDb();

      // Если ни одного критерия поиска нет, возвращаем null
      if (!searchCriteria.id && !searchCriteria.full_path && !searchCriteria.file_name) {
        return null;
      }

      // Формируем WHERE условие на основе критериев поиска
      const whereConditions: string[] = [];
      const whereValues: unknown[] = [];

      if (searchCriteria.id) {
        whereConditions.push('id = ?');
        whereValues.push(searchCriteria.id);
      }

      if (searchCriteria.full_path) {
        whereConditions.push('full_path = ?');
        whereValues.push(searchCriteria.full_path);
      }

      if (searchCriteria.file_name) {
        whereConditions.push('file_name = ?');
        whereValues.push(searchCriteria.file_name);
      }

      const query = `
        SELECT * FROM files 
        WHERE ${whereConditions.join(' AND ')}
        LIMIT 1
      `;

      const result = await db.select<Array<ListItem>>(query, whereValues);
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Ошибка получения файла:', error);
      throw error;
    }
  }

  static async getFilesByList(list_id: number) {
    try {
      await initDb();
      const db = getDb();

      const query = `
        SELECT 
          f.*,
          fl.date_added,
          fl.is_pinned,
          fl.pinned_order
        FROM files f
        INNER JOIN file_lists fl ON f.id = fl.file_id
        WHERE fl.list_id = ?
        ORDER BY fl.is_pinned DESC, fl.pinned_order ASC, fl.date_added DESC
      `;

      const result = await db.select<Array<ListItem>>(query, [list_id]);
      return result;
    } catch (error) {
      console.error('Ошибка получения файлов по списку:', error);
      throw error;
    }
  }

  static async upsertFileBy(
    updateData: Record<string, unknown>,
    searchCriteria: { id?: number; full_path?: string; file_name?: string },
  ) {
    try {
      await initDb();
      const db = getDb();

      // Если ни одного критерия поиска нет, ничего не делаем
      if (!searchCriteria.id && !searchCriteria.full_path && !searchCriteria.file_name) {
        return null;
      }

      // Если нет данных для обновления/создания, ничего не делаем
      if (Object.keys(updateData).length === 0) {
        return null;
      }

      // Получаем валидные поля из схемы Drizzle
      const validFields = Object.keys(files).filter(
        field => field !== 'id' // Исключаем primary key из обновления
      );

      // Фильтруем только валидные поля
      const filteredUpdateData = Object.fromEntries(
        Object.entries(updateData).filter(([key]) => validFields.includes(key))
      );

      // Если после фильтрации не осталось полей, ничего не делаем
      if (Object.keys(filteredUpdateData).length === 0) {
        return null;
      }

      // Формируем WHERE условие на основе критериев поиска
      const whereConditions: string[] = [];
      const whereValues: unknown[] = [];

      if (searchCriteria.id) {
        whereConditions.push('id = ?');
        whereValues.push(searchCriteria.id);
      }

      if (searchCriteria.full_path) {
        whereConditions.push('full_path = ?');
        whereValues.push(searchCriteria.full_path);
      }

      if (searchCriteria.file_name) {
        whereConditions.push('file_name = ?');
        whereValues.push(searchCriteria.file_name);
      }

      // Формируем SET часть запроса с отфильтрованными данными
      const setKeys = Object.keys(filteredUpdateData);
      const setPlaceholders = setKeys.map(key => `${key} = ?`);
      const setValues = Object.values(convertValues(filteredUpdateData));

      const query = `
        UPDATE files 
        SET ${setPlaceholders.join(', ')}
        WHERE ${whereConditions.join(' AND ')}
      `;

      const allValues = [...setValues, ...whereValues];
      const result = await db.execute(query, allValues);

      // Если ни одна строка не была обновлена, создаем новый файл
      if (result.rowsAffected === 0) {
        // Для создания файла используем все данные из updateData
        // Добавляем критерии поиска в данные для создания, если они отсутствуют
        const createData = { ...filteredUpdateData };
        
        if (searchCriteria.full_path && !createData.full_path) {
          createData.full_path = searchCriteria.full_path;
        }
        if (searchCriteria.file_name && !createData.file_name) {
          createData.file_name = searchCriteria.file_name;
        }

        const createdFile = await this.createNewFile(createData);
        return createdFile;
      }

      return result;
    } catch (error) {
      console.error('Ошибка upsert файла:', error);
      throw error;
    }
  }

  static async createNewFile(fileData: Record<string, unknown>) {
    try {
      await initDb();
      const db = getDb();

      // Проверяем, есть ли файл с таким же full_path
      if (fileData.full_path) {
        const existingFile = await this.getFileBy({ full_path: fileData.full_path as string });
        if (existingFile) {
          return existingFile; // Возвращаем существующий файл
        }
      }

      // Получаем валидные поля из схемы Drizzle
      const validFields = Object.keys(files).filter(
        field => field !== 'id' // Исключаем primary key, он сгенерируется автоматически
      );

      // Фильтруем только валидные поля
      const filteredFileData = Object.fromEntries(
        Object.entries(fileData).filter(([key]) => validFields.includes(key))
      );

      // Если после фильтрации не осталось полей, выбрасываем ошибку
      if (Object.keys(filteredFileData).length === 0) {
        throw new Error('Нет валидных полей для создания файла');
      }

      // Формируем INSERT запрос
      const columns = Object.keys(filteredFileData);
      const placeholders = columns.map(() => '?');
      const values = Object.values(convertValues(filteredFileData));

      const query = `
        INSERT INTO files (${columns.join(', ')})
        VALUES (${placeholders.join(', ')})
      `;

      const result = await db.execute(query, values);
      
      const fileId = Number(result.lastInsertId);

      if (!fileId) {
        throw new Error('Не удалось получить ID созданного файла');
      }

      // Получаем созданный файл для возврата
      const createdFile = await this.getFileBy({ id: fileId });
      
      if (!createdFile) {
        throw new Error('Не удалось получить созданный файл из БД');
      }
      
      return createdFile;
    } catch (error) {
      console.error('Ошибка создания файла:', error);
      throw error;
    }
  }

  static async removeFile(
    searchCriteria: { id?: number; full_path?: string; file_name?: string }
  ) {
    try {
      await initDb();
      const db = getDb();

      // Если ни одного критерия поиска нет, ничего не делаем
      if (!searchCriteria.id && !searchCriteria.full_path && !searchCriteria.file_name) {
        return null;
      }

      // Формируем WHERE условие на основе критериев поиска
      const whereConditions: string[] = [];
      const whereValues: unknown[] = [];

      if (searchCriteria.id) {
        whereConditions.push('id = ?');
        whereValues.push(searchCriteria.id);
      }

      if (searchCriteria.full_path) {
        whereConditions.push('full_path = ?');
        whereValues.push(searchCriteria.full_path);
      }

      if (searchCriteria.file_name) {
        whereConditions.push('file_name = ?');
        whereValues.push(searchCriteria.file_name);
      }

      const query = `
        DELETE FROM files 
        WHERE ${whereConditions.join(' AND ')}
      `;

      const result = await db.execute(query, whereValues);
      return result;
    } catch (error) {
      console.error('Ошибка удаления файла:', error);
      throw error;
    }
  }

  static async addFileToList(file: Record<string, unknown>, list_id: number) {
    try {
      await initDb();
      const db = getDb();

      // Проверяем, есть ли такой файл по full_path, если нет - создаем
      const existingFile = await this.getFileBy({ full_path: file.full_path as string });
      let fileId: number;

      if (existingFile) {
        fileId = existingFile.id!;
      } else {
        const createdFile = await this.createNewFile(file);
        fileId = createdFile.id!;
      }
      
      // Добавляем связь в file_lists
      await db.execute(`
        INSERT OR IGNORE INTO file_lists (file_id, list_id, date_added) 
        VALUES (?, ?, ?)
      `, [fileId, list_id, new Date().toISOString()]);
      
      return { lastInsertId: fileId };
    } catch (error) {
      console.error('Ошибка добавления файла в список:', error);
      throw error;
    }
  }
}