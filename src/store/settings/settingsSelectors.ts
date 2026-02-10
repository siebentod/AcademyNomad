import { Store } from '../types';

// Settings selectors

// Формирует строку для типов файлов
export const selectTypesQuery = (state: Store) => {
  const settings = state.settings;
  const typesQuery = settings.types.join('|');
  return typesQuery ? `ext:${typesQuery}` : '';
};

// Формирует строку для исключенных файлов
export const selectExcludedQuery = (state: Store) => {
  const excludedList = state.settings.excludedList;
  if (!excludedList) return '';

  return excludedList
    .map((item) =>
      item.path ? `!path:"${item.path}"` : `!wfn:"${item.file_name}"`
    )
    .join(' ');
};

export const selectPdfReaderPath = (state: Store) => {
  const settings = state.settings;
  return settings.pdfReaderPath;
};