import { useTheme } from '../providers';

/**
 * Hook to get theme-aware class names
 * Useful for conditional styling based on current theme
 */
export const useThemeClasses = () => {
  const { isDark } = useTheme();
  
  return {
    isDark,
    // Common background classes
    bg: {
      primary: isDark ? 'bg-zinc-950' : 'bg-white',
      secondary: isDark ? 'bg-zinc-900' : 'bg-gray-50',
      tertiary: isDark ? 'bg-zinc-800' : 'bg-gray-100',
    },
    // Common text classes  
    text: {
      primary: isDark ? 'text-white' : 'text-zinc-950',
      secondary: isDark ? 'text-zinc-400' : 'text-zinc-600',
      muted: isDark ? 'text-zinc-500' : 'text-zinc-500',
    },
    // Common border classes
    border: {
      primary: isDark ? 'border-white/10' : 'border-zinc-950/10',
      secondary: isDark ? 'border-white/5' : 'border-zinc-950/5',
    },
    // Common shadow classes
    shadow: {
      sm: isDark ? 'shadow-black/25' : 'shadow-sm',
      md: isDark ? 'shadow-black/25' : 'shadow-md',
    }
  };
};