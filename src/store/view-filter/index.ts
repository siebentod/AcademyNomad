import { StateCreator } from 'zustand';
import { DEFAULT_FETCH_COUNT } from '../files/config';
import type { Store, ViewFilterSlice } from '../types';

export const createViewFilterSlice: StateCreator<
  Store,
  [],
  [],
  ViewFilterSlice
> = (set, get) => {
  return {
    view: {
      activeProject: '',
      activeMode: 'highlights',

      fetchCount: DEFAULT_FETCH_COUNT,
      hasMore: undefined,

      selectedBook: null,
      hiddenBooks: [],

      highlightsSearchText: '',
      visibleHighlightsCount: 50,
      showOnlyAnnotated: false,

      actions: {
        selectBook: (fileName: string | null) => {
          set((state) => ({
            view: {
              ...state.view,
              selectedBook: fileName,
              hiddenBooks: [],
              visibleHighlightsCount: 50,
            },
          }));
        },

        removeBookFilter: () => {
          set((state) => ({
            view: {
              ...state.view,
              selectedBook: null,
              visibleHighlightsCount: 50,
            },
          }));
        },

        hideBook: (fileName: string) => {
          set((state) => {
            const isHidden = state.view.hiddenBooks.includes(fileName);
            const newHiddenBooks = isHidden
              ? state.view.hiddenBooks.filter((book) => book !== fileName)
              : [...state.view.hiddenBooks, fileName];

            return {
              view: {
                ...state.view,
                hiddenBooks: newHiddenBooks,
                selectedBook: null,
                visibleHighlightsCount: 50,
              },
            };
          });
        },

        resetCount: () => {
          set((state) => ({
            view: {
              ...state.view,
              visibleHighlightsCount: 50,
            },
          }));
        },

        setActiveProject: (project: string) => {
          set((state) => ({
            view: {
              ...state.view,
              activeProject: project,
              fetchCount: DEFAULT_FETCH_COUNT,
              selectedBook: null,
            },
          }));
        },

        setShowOnlyAnnotated: (showOnlyAnnotated: boolean) => {
          set((state) => ({
            view: {
              ...state.view,
              showOnlyAnnotated,
            },
          }));
        },

        setHighlightsSearchText: (newText: string) => {
          set((state) => ({
            view: {
              ...state.view,
              highlightsSearchText: newText,
            },
          }));
        },

        toggleShowOnlyAnnotated: () => {
          get().view.actions.resetCount();
          set((state) => ({
            view: {
              ...state.view,
              showOnlyAnnotated: !state.view.showOnlyAnnotated,
              visibleHighlightsCount: 50,
            },
          }));
        },

        setActiveMode: (mode: 'highlights' | 'no-highlights') => {
          set((state) => ({
            view: {
              ...state.view,
              activeMode: mode,
            },
          }));
        },

        setVisibleHighlightsCount: (count: number) => {
          set((state) => ({
            view: {
              ...state.view,
              visibleHighlightsCount: count,
            },
          }));
        },

        incrementVisibleHighlightsCount: (increment: number) => {
          set((state) => ({
            view: {
              ...state.view,
              visibleHighlightsCount:
                state.view.visibleHighlightsCount + increment,
            },
          }));
        },

        setFetchCount: (count: number) => {
          set((state) => ({
            view: {
              ...state.view,
              fetchCount: count,
            },
          }));
        },

        setHasMore: (hasMore: boolean) => {
          set((state) => ({
            view: {
              ...state.view,
              hasMore,
            },
          }));
        },
      },
    },
  };
};
