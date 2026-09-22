import { create } from 'zustand';

interface UIStore {
  isCartDrawerOpen: boolean;
  openCartDrawer: () => void;
  closeCartDrawer: () => void;
  toggleCartDrawer: () => void;

  isMobileMenuOpen: boolean;
  openMobileMenu: () => void;
  closeMobileMenu: () => void;

  isSearchOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;

  isFilterDrawerOpen: boolean;
  openFilterDrawer: () => void;
  closeFilterDrawer: () => void;

  isAnnouncementVisible: boolean;
  dismissAnnouncement: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  isCartDrawerOpen: false,
  openCartDrawer: () => set({ isCartDrawerOpen: true }),
  closeCartDrawer: () => set({ isCartDrawerOpen: false }),
  toggleCartDrawer: () => set((state) => ({ isCartDrawerOpen: !state.isCartDrawerOpen })),

  isMobileMenuOpen: false,
  openMobileMenu: () => set({ isMobileMenuOpen: true }),
  closeMobileMenu: () => set({ isMobileMenuOpen: false }),

  isSearchOpen: false,
  openSearch: () => set({ isSearchOpen: true }),
  closeSearch: () => set({ isSearchOpen: false }),

  isFilterDrawerOpen: false,
  openFilterDrawer: () => set({ isFilterDrawerOpen: true }),
  closeFilterDrawer: () => set({ isFilterDrawerOpen: false }),

  isAnnouncementVisible: true,
  dismissAnnouncement: () => set({ isAnnouncementVisible: false }),
}));
