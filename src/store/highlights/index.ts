import { StateCreator } from 'zustand';
import type { Store, HighlightsSlice } from '../types';
import type { Highlight } from 'src/shared/types';
import { HighlightsDB } from 'src/db/HighlightsDB';

export const createHighlightsSlice: StateCreator<
  Store,
  [],
  [],
  HighlightsSlice
> = (set, get) => ({
  highlightsTrigger: 0,
  highlightsTotalCount: 0,

  deleteTemporaryHighlights: async () => {
    await HighlightsDB.deleteTemporaryHighlights();
  },

  getHighlights: async (params: {
    limit?: number;
    offset?: number;
    list_id?: number;
    file_id?: number;
    selectedBook?: string | null;
    highlightsSearchText?: string;
    showOnlyAnnotated?: boolean;
  }) => {
    return await HighlightsDB.getHighlights(params);
  },

  triggerHighlights: () => {
    set((state) => ({
      highlightsTrigger: state.highlightsTrigger + 1,
    }));
  },

  setHighlightsTotalCount: (highlightsTotalCount: number) => {
    set({ highlightsTotalCount });
  },
});
