import { create } from 'zustand';
import type { HistoryItem } from '@shared/types';
import * as api from '../services/api';

interface HistoryStore {
  items: HistoryItem[];
  total: number;
  page: number;
  searchQuery: string;
  loading: boolean;

  fetchHistory: (page?: number, search?: string) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  setSearch: (query: string) => void;
}

export const useHistoryStore = create<HistoryStore>((set, get) => ({
  items: [],
  total: 0,
  page: 1,
  searchQuery: '',
  loading: false,

  fetchHistory: async (page = 1, search?: string) => {
    set({ loading: true });
    try {
      const query = search ?? get().searchQuery;
      const result = await api.fetchHistory(page, 50, query || undefined);
      set({
        items: result.items,
        total: result.total,
        page: result.page,
        loading: false,
      });
    } catch {
      set({ loading: false });
    }
  },

  deleteItem: async (id) => {
    try {
      await api.deleteHistoryItem(id);
      set((state) => ({
        items: state.items.filter((item) => item.id !== id),
        total: state.total - 1,
      }));
    } catch {
      // silently fail
    }
  },

  clearAll: async () => {
    try {
      await api.clearAllHistory();
      set({ items: [], total: 0 });
    } catch {
      // silently fail
    }
  },

  setSearch: (query) => {
    set({ searchQuery: query });
    get().fetchHistory(1, query);
  },
}));
