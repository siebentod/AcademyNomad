import type {
  File,
  Lists,
  List,
  ListItem,
  Settings,
  Highlight,
} from 'src/shared/types';

export interface FilesState {
  files: File[];
  areFilesLoading: boolean;
  error: string | null;
  searchError: string | null;
  currentQuery: string;
  currentFilters: Record<string, any>;
  lastSearchTime: string | null;
  searchTrigger: number;
}

export interface FilesSlice extends FilesState {
  setFiles: (files: File[]) => Promise<void>;
  updateFileWithHighlights: (
    file: File,
    highlights: Highlight[]
  ) => Promise<void>;
  removeFile: (full_path: string) => void;
  setLoading: (loading: boolean) => void;
  triggerSearch: () => void;
}

export interface HighlightsState {
  highlightsTrigger: number;
  highlightsTotalCount: number;
}

export interface HighlightsSlice extends HighlightsState {
  deleteTemporaryHighlights: () => Promise<void>;
  getHighlights: (params: {
    limit?: number;
    offset?: number;
    list_id?: number;
    file_id?: number;
    selectedBook?: string | null;
    highlightsSearchText?: string;
    showOnlyAnnotated?: boolean;
  }) => Promise<{ items: Highlight[]; total: number }>;
  triggerHighlights: () => void;
  setHighlightsTotalCount: (highlightsTotalCount: number) => void;
}

export interface ListsState {
  lists: Lists;
  activeList: List | null;
  areListsLoaded: boolean;
}

export interface ListsHelpers {
  _loadLists: () => Promise<void>;
}

export interface ListsSlice extends ListsState, ListsHelpers {
  createList: (listName: string, value: ListItem[]) => Promise<void>;
  addToList: (payload: { listName: string; itemData: File }) => Promise<void>;
  removeFromList: (payload: { listName: string; fileId: number }) => Promise<void>;
  setActiveList: (listName: string) => Promise<void>;
  removeList: (listName: string) => Promise<void>;
  renameList: (oldName: string, newName: string) => Promise<void>;
  pinItem: (payload: { listName: string; fileId: number }) => Promise<void>;
  unpinItem: (payload: { listName: string; fileId: number }) => Promise<void>;
}

export interface SettingsState {
  settings: Settings;
  areListsLoaded: boolean;
}

export interface SettingsHelpers {
  _loadSettings: () => Promise<void>;
  _writeSetting: (key: string, value: unknown) => Promise<void>;
  _writeSettings: (settings: Settings) => Promise<void>;
  _setSetting: (key: string, value: unknown) => Promise<void>;
  _setSettings: (settings: Settings) => Promise<void>;
}

export interface SettingsSlice extends SettingsState, SettingsHelpers {
  saveSettings: (settings: Settings) => Promise<void>;
  addToExcluded: (file: File) => void;
  addToExcludedPath: (path: string) => void;
  removeFromExcluded: (identifier: string) => void;
}

export interface ViewFilterSlice {
  view: {
    searchQuery: string;
    selectedBook: string | null;
    visibleHighlightsCount: number;
    highlightsSearchText: string;
    showOnlyAnnotated: boolean;
    activeMode: 'highlights' | 'no-highlights';
    fetchCount: number;
    hasMore: boolean | undefined;
    actions: {
      setSearchQuery: (query: string) => void;
      selectBook: (fileName: string | null) => void;
      removeBookFilter: () => void;
      resetCount: () => void;
      setShowOnlyAnnotated: (showOnlyAnnotated: boolean) => void;
      setHighlightsSearchText: (newText: string) => void;
      toggleShowOnlyAnnotated: () => void;
      setActiveMode: (mode: 'highlights' | 'no-highlights') => void;
      setVisibleHighlightsCount: (count: number) => void;
      incrementVisibleHighlightsCount: (increment: number) => void;
      setFetchCount: (count: number) => void;
      setHasMore: (hasMore: boolean) => void;
    };
  };
}

export type Store = FilesSlice &
  ListsSlice &
  SettingsSlice &
  ViewFilterSlice &
  HighlightsSlice;
