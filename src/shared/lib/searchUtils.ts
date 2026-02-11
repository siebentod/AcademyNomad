import { invoke } from '@tauri-apps/api/core';
import { File } from '../types';

export interface SearchParams {
  query: string;
  includeHighlights: boolean;
  count: number;
}

export interface InvokeSearchResult {
  items: File[];
  has_more: boolean;
}

export const searchFileByQuery = async (query: string) => {
  const result = await searchFiles({
    query,
    includeHighlights: true,
    count: 1,
  });

  return result;
};

export async function searchFiles(params: SearchParams) {
  const { query, includeHighlights, count } = params;

  const result = await invoke('get_everything', {
    params: {
      query,
      include_highlights: includeHighlights,
      count,
    },
  }) as InvokeSearchResult;

  console.log('searchFiles_result', result);

  return result;
}

export function buildSearchQuery({
  searchQuery,
  typesQuery,
  excludedQuery,
  includeQuery,
}: {
  searchQuery?: string;
  typesQuery?: string;
  excludedQuery?: string;
  includeQuery?: string;
}): string {
  return `${searchQuery || ''} ${typesQuery || ''} ${excludedQuery || ''} ${includeQuery || ''}`.trim();
}

export function buildIncludeQuery(filePaths: string[]): string {
  if (!filePaths.length) return '';
  return filePaths.map(filePath => `<${filePath}>`).join(' | ');
}