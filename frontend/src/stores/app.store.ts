import { create } from 'zustand';
import { View } from '../types';

interface AppState {
  currentView: View;
  sidebarOpen: boolean;

  // Actions
  setView: (view: View) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentView: 'chat',
  sidebarOpen: true,

  setView: (view) => set({ currentView: view }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
