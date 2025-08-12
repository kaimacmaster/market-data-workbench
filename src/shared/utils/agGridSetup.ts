import { ModuleRegistry, AllCommunityModule, themeQuartz } from 'ag-grid-community';

// Register all AG Grid Community modules
ModuleRegistry.registerModules([AllCommunityModule]);

// Configure the default theme using the new Theming API
export const defaultGridTheme = themeQuartz;