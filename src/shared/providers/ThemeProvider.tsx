import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSettings } from '../hooks/useSettings';

type Theme = 'light' | 'dark';
type ThemeMode = 'light' | 'dark' | 'auto';

interface ThemeContextValue {
  theme: Theme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { settings, updateSettings } = useSettings();
  const [systemTheme, setSystemTheme] = useState<Theme>('light');

  // Detect system theme preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    // Set initial system theme
    setSystemTheme(mediaQuery.matches ? 'dark' : 'light');

    // Listen for changes
    mediaQuery.addEventListener('change', handleChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  // Calculate the actual theme to use
  const actualTheme: Theme = settings.theme === 'auto' ? systemTheme : settings.theme as Theme;
  const isDark = actualTheme === 'dark';

  // Apply theme to document immediately
  useEffect(() => {
    const root = document.documentElement;
    
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Also set a CSS custom property for additional theme-aware styling
    root.style.setProperty('--theme', actualTheme);
  }, [isDark, actualTheme, settings.theme]);

  // Set initial theme class as early as possible to prevent flash
  useEffect(() => {
    const root = document.documentElement;
    const storedSettings = localStorage.getItem('market-data-workbench-settings');
    let initialTheme: ThemeMode = 'light'; // Default changed to 'light' to match service defaults
    
    try {
      if (storedSettings) {
        const parsed = JSON.parse(storedSettings);
        initialTheme = parsed.theme || 'light';
      }
    } catch (e) {
      // Fallback to light if parsing fails
    }

    // Determine initial theme immediately
    let shouldBeDark = false;
    if (initialTheme === 'dark') {
      shouldBeDark = true;
    } else if (initialTheme === 'auto') {
      shouldBeDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    // Apply initial theme class immediately
    if (shouldBeDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, []); // Run only once on mount

  const setThemeMode = (mode: ThemeMode) => {
    updateSettings({ theme: mode });
  };

  const value: ThemeContextValue = {
    theme: actualTheme,
    themeMode: settings.theme,
    setThemeMode,
    isDark,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};