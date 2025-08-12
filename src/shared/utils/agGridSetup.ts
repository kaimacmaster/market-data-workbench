import { ModuleRegistry, AllCommunityModule, themeQuartz } from 'ag-grid-community';

// Register all AG Grid Community modules
ModuleRegistry.registerModules([AllCommunityModule]);

// Configure themes for light and dark mode
export const lightGridTheme = themeQuartz;
export const darkGridTheme = themeQuartz.withParams({
  backgroundColor: '#0a0a0b',
  foregroundColor: '#fafafa',
  headerBackgroundColor: '#18181b',
  headerTextColor: '#e4e4e7',
  oddRowBackgroundColor: '#09090b',
  borderColor: '#27272a',
  rowHoverColor: '#1f1f23',
});

// Default theme for backward compatibility
export const defaultGridTheme = lightGridTheme;