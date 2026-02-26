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
      activeMode: 'highlights',
      searchQuery: '',

      fetchCount: DEFAULT_FETCH_COUNT,
      hasMore: undefined,

      selectedBook: null,

      highlightsSearchText: '',
      visibleHighlightsCount: 50,
      showOnlyAnnotated: false,

      actions: {
        setSearchQuery: (query: string) => {
          set((state) => ({
            view: {
              ...state.view,
              searchQuery: query,
            },
          }));
        },
        selectBook: (fileName: string | null) => {
          set((state) => ({
            view: {
              ...state.view,
              selectedBook: fileName,
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

        resetCount: () => {
          set((state) => ({
            view: {
              ...state.view,
              visibleHighlightsCount: 50,
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
