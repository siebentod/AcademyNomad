import { invoke } from '@tauri-apps/api/core';
import toast from 'react-hot-toast';
import type { File } from '../types';
import { processDateToEverythingQuery } from './utils';
import { buildIncludeQuery, searchOneFileByQuery } from './searchUtils';
import { FilesDB } from 'src/db/FilesDB';

export async function tryToFindFile(file: File): Promise<any> {
  let result: any;

  // Первая попытка: frn
  result = (await invoke('get_everything_with_meta', {
    params: { query: `frn:"${file.id}"` },
  })) as any[];
  if (result?.length === 1) return result[0];
  if (result?.length > 1) {
    toast.error('Найдено более одного файла по frn');
    return;
  }

  // Вторая попытка: dc
  const formattedDate = processDateToEverythingQuery(file.created_date || '');
  result = (await invoke('get_everything_with_meta', {
    params: { query: `dc:"${formattedDate}"` },
  })) as any[];
  if (result?.length === 1) return result[0];
  if (result?.length > 1) {
    toast.error('Найдено более одного файла по дате создания');
    return;
  }

  // Третья попытка: поиск на фронте
  // result = await searchFileByField(file, 'pdf_creator');
  // if (result) return result;
  if (Array.isArray(result) && result.length > 1) {
    toast.error('Найдено более одного файла при альтернативном поиске');
    return;
  }

  // Четвертая попытка: поиск по названию
  const includeQuery = buildIncludeQuery([file.file_name]);
  const query = includeQuery.trim();
  result = await searchOneFileByQuery(query);
  console.log('result', result);
  if (result.items?.length) {
    await FilesDB.updateFileBy(
      { file_name: file.file_name },
      { ...file, ...result.items[0] }
    );
    return result.items[0];
  }

  toast.error('Файл не найден ни одним способом');
  return;
}
