import { create } from 'zustand';
import type { DownloadProgress } from '@shared/types';

interface DownloadStore {
  downloads: Map<string, DownloadProgress>;
  getDownloadList: () => DownloadProgress[];

  setDownload: (id: string, progress: DownloadProgress) => void;
  updateDownload: (id: string, partial: Partial<DownloadProgress>) => void;
  removeDownload: (id: string) => void;
  clearCompleted: () => void;
}

export const useDownloadStore = create<DownloadStore>((set, get) => ({
  downloads: new Map(),

  getDownloadList: () => {
    return Array.from(get().downloads.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  },

  setDownload: (id, progress) => {
    set((state) => {
      const next = new Map(state.downloads);
      next.set(id, progress);
      return { downloads: next };
    });
  },

  updateDownload: (id, partial) => {
    set((state) => {
      const next = new Map(state.downloads);
      const existing = next.get(id);
      if (existing) {
        next.set(id, { ...existing, ...partial });
      }
      return { downloads: next };
    });
  },

  removeDownload: (id) => {
    set((state) => {
      const next = new Map(state.downloads);
      next.delete(id);
      return { downloads: next };
    });
  },

  clearCompleted: () => {
    set((state) => {
      const next = new Map(state.downloads);
      for (const [id, dl] of next) {
        if (dl.status === 'complete' || dl.status === 'cancelled') {
          next.delete(id);
        }
      }
      return { downloads: next };
    });
  },
}));
