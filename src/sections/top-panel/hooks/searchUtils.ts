import { invoke } from '@tauri-apps/api/core';

export interface SearchParams {
  query: string;
  includeHighlights: boolean;
  count: number;
}

export interface SearchResult {
  files: any[];
  has_more?: boolean;
  requestId?: number;
}

export async function searchFiles(params: SearchParams): Promise<SearchResult> {
  const { query, includeHighlights, count } = params;

  const result = await invoke('get_everything', {
    params: {
      query,
      include_highlights: includeHighlights,
      count,
    },
  });

  console.log('resultz', result);

  return { files: result as any[] };
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