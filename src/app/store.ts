import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppSettings {
  theme: 'light' | 'dark';
  defaultInterval: string;
  updateInterval: number;
}

interface UIState {
  sidebarCollapsed: boolean;
  selectedSymbol: string | null;
}

interface AppStore extends AppSettings, UIState {
  // Settings actions
  setTheme: (theme: 'light' | 'dark') => void;
  setDefaultInterval: (interval: string) => void;
  setUpdateInterval: (interval: number) => void;
  
  // UI actions
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSelectedSymbol: (symbol: string | null) => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      // Default settings
      theme: 'light',
      defaultInterval: '1m',
      updateInterval: 1000,
      
      // Default UI state
      sidebarCollapsed: false,
      selectedSymbol: null,
      
      // Settings actions
      setTheme: (theme) => set({ theme }),
      setDefaultInterval: (defaultInterval) => set({ defaultInterval }),
      setUpdateInterval: (updateInterval) => set({ updateInterval }),
      
      // UI actions
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      setSelectedSymbol: (selectedSymbol) => set({ selectedSymbol }),
    }),
    {
      name: 'market-data-workbench-settings',
      partialize: (state) => ({
        // Persist only settings, not UI state
        theme: state.theme,
        defaultInterval: state.defaultInterval,
        updateInterval: state.updateInterval,
      }),
    }
  )
);