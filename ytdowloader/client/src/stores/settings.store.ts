import { create } from 'zustand';
import type { SettingsConfig } from '@shared/types';
import { DEFAULT_SETTINGS } from '@shared/types';
import * as api from '../services/api';

interface SettingsStore {
  settings: SettingsConfig;
  loading: boolean;
  isOpen: boolean;

  fetchSettings: () => Promise<void>;
  updateSettings: (updates: Partial<SettingsConfig>) => Promise<void>;
  openSettings: () => void;
  closeSettings: () => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: DEFAULT_SETTINGS,
  loading: false,
  isOpen: false,

  fetchSettings: async () => {
    set({ loading: true });
    try {
      const settings = await api.fetchSettings();
      set({ settings, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  updateSettings: async (updates) => {
    try {
      const settings = await api.updateSettings(updates);
      set({ settings });
    } catch {
      // silently fail
    }
  },

  openSettings: () => set({ isOpen: true }),
  closeSettings: () => set({ isOpen: false }),
}));
