import { invoke } from '@tauri-apps/api/core';
import { File, FileResult } from '../types';

export interface SearchParams {
  query: string;
  includeHighlights: boolean;
  count: number;
}

export interface InvokeSearchResult {
  items: File[];
  has_more: boolean;
}

export const searchOneFileByQuery = async (query: string) => {
  const result = await searchFiles({
    query,
    includeHighlights: true,
    count: 1,
  });

  return result;
};

export async function searchFiles(params: SearchParams) {
  const { query, includeHighlights, count } = params;
  console.log('query', query);

  const result = (await invoke('get_everything', {
    params: {
      query,
      include_highlights: includeHighlights || false,
      count,
    },
  })) as InvokeSearchResult;

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
  return `${searchQuery || ''} ${typesQuery || ''} ${excludedQuery || ''} ${
    includeQuery || ''
  }`.trim();
}

export function buildIncludeQuery(filePaths: string[]): string {
  if (!filePaths.length) return '';
  return filePaths.map((filePath) => `<"${filePath}">`).join(' | ');
}

export async function searchHighlightsForFiles(
  paths: string[]
): Promise<FileResult[]> {
  const result = await invoke<FileResult[]>('get_highlights_for_files', {
    paths,
  });
  console.log('resusltz', result);

  return result;
}
