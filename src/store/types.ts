import type { File, Lists, List, ListItem, Settings } from 'src/shared/types';

export interface FilesState {
  files: File[];
  areFilesLoading: boolean;
  error: string | null;
  searchError: string | null;
  currentQuery: string;
  currentFilters: Record<string, any>;
  lastSearchTime: string | null;
}

export interface FilesSlice extends FilesState {
  setFiles: (files: File[]) => void;
  replaceFileByField: (payload: { file: File; field?: string }) => void;
  removeFile: (fileName: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSearchError: (error: string | null) => void;
  setCurrentQuery: (query: string) => void;
  setCurrentFilters: (filters: Record<string, any>) => void;
  clearFiles: () => void;
}

export interface ListsState {
  lists: Lists;
  areListsLoaded: boolean;
}

export interface ListsHelpers {
  _setLists: (lists: Lists) => void;
  _setList: (payload: { listName: string; value: ListItem[] }) => void;
  _writeList: (payload: {
    listName: string;
    value: ListItem[];
  }) => Promise<void>;
  _writeLists: (lists: Lists) => Promise<void>;
  _loadLists: () => Promise<void>;
  _removeList: (listName: string) => Promise<void>;
  _renameList: (oldName: string, newName: string) => Promise<void>;
}

export interface ListsSlice extends ListsState, ListsHelpers {
  createList: (listName: string, value: ListItem[]) => void;
  addToList: (payload: { listName: string; itemData: File }) => void;
  removeFromList: (payload: { listName: string; fileName: string }) => void;
  removeList: (listName: string) => void;
  renameList: (oldName: string, newName: string) => void;
  updateFileInAllLists: (payload: { file: File; field?: string }) => void;
  updateFilesInAllLists: (files: File[]) => void;
  pinItem: (payload: { listName: string; fileName: string }) => void;
  unpinItem: (payload: { listName: string; fileName: string }) => void;
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
    selectedBook: string | null;
    hiddenBooks: string[];
    visibleHighlightsCount: number;
    activeProject: string;
    highlightsSearchText: string;
    showOnlyAnnotated: boolean;
    activeMode: 'highlights' | 'no-highlights';
    fetchCount: number;
    hasMore: boolean | undefined;
    actions: {
      selectBook: (fileName: string | null) => void;
      removeBookFilter: () => void;
      hideBook: (fileName: string) => void;
      resetCount: () => void;
      setActiveProject: (project: string) => void;
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


export type Store = FilesSlice & ListsSlice & SettingsSlice & ViewFilterSlice;
