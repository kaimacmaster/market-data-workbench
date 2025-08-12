import { z } from 'zod';
import { settingsCache } from '../cache/settings';

// Settings schema for validation
const UserSettingsSchema = z.object({
  // Theme settings
  theme: z.enum(['light', 'dark', 'auto']),
  chartTheme: z.enum(['default', 'dark', 'colorful']),
  
  // Data settings
  defaultInterval: z.string(),
  updateThrottle: z.number().min(50).max(1000),
  cacheSize: z.number().min(10).max(500),
  
  // Indicator defaults
  defaultIndicators: z.object({
    ema: z.boolean(),
    vwap: z.boolean(),
    rsi: z.boolean(),
    bollinger: z.boolean(),
  }),
  
  // Grid settings
  orderBookDepth: z.number().min(5).max(50),
  tradesLimit: z.number().min(10).max(1000),
  animateGridUpdates: z.boolean(),
  
  // Metadata
  version: z.number(),
  lastUpdated: z.number(),
});

export type UserSettings = z.infer<typeof UserSettingsSchema>;

const SETTINGS_KEY = 'market-data-workbench-settings';
const SETTINGS_VERSION = 1;

const defaultSettings: UserSettings = {
  // Theme settings
  theme: 'light',
  chartTheme: 'default',
  
  // Data settings
  defaultInterval: '5m',
  updateThrottle: 80,
  cacheSize: 100,
  
  // Indicator defaults
  defaultIndicators: {
    ema: true,
    vwap: true,
    rsi: false,
    bollinger: false,
  },
  
  // Grid settings
  orderBookDepth: 20,
  tradesLimit: 100,
  animateGridUpdates: true,
  
  // Metadata
  version: SETTINGS_VERSION,
  lastUpdated: Date.now(),
};

class SettingsService {
  private settings: UserSettings = defaultSettings;
  private isClient = typeof window !== 'undefined';

  getDefaults(): UserSettings {
    return { ...defaultSettings };
  }

  async load(): Promise<UserSettings> {
    if (!this.isClient) {
      return this.getDefaults();
    }

    try {
      // Try loading from IndexedDB first
      const cachedSettings = await settingsCache.getSettings();
      
      if (cachedSettings) {
        // Validate and migrate if needed
        const validated = UserSettingsSchema.parse(cachedSettings);
        
        // Check version and migrate if needed
        if (validated.version < SETTINGS_VERSION) {
          const migrated = this.migrateSettings(validated);
          await this.save(migrated);
          this.settings = migrated;
          return migrated;
        }

        this.settings = validated;
        return validated;
      }

      // Fallback to localStorage for migration
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const validated = UserSettingsSchema.parse(parsed);
        
        // Migrate to IndexedDB
        await this.save(validated);
        localStorage.removeItem(SETTINGS_KEY); // Clean up old storage
        
        this.settings = validated;
        return validated;
      }

      // No settings found, use defaults
      return this.getDefaults();
    } catch (error) {
      console.warn('Failed to load settings, using defaults:', error);
      return this.getDefaults();
    }
  }

  async save(settings: UserSettings): Promise<void> {
    if (!this.isClient) {
      return;
    }

    try {
      // Validate settings before saving
      const validated = UserSettingsSchema.parse({
        ...settings,
        version: SETTINGS_VERSION,
        lastUpdated: Date.now(),
      });

      // Save to IndexedDB
      await settingsCache.saveSettings(validated);
      
      // Keep localStorage as backup for now
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(validated));
      
      this.settings = validated;
      
      // Emit custom event for other parts of the app to listen to
      window.dispatchEvent(new CustomEvent('settings-changed', { 
        detail: validated 
      }));
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    }
  }

  getCurrent(): UserSettings {
    return { ...this.settings };
  }

  private migrateSettings(oldSettings: UserSettings): UserSettings {
    // Migration logic for future versions
    // For now, just merge with defaults for any missing fields
    return {
      ...defaultSettings,
      ...oldSettings,
      version: SETTINGS_VERSION,
      lastUpdated: Date.now(),
    };
  }

  // Clear all settings and reset to defaults
  async reset(): Promise<void> {
    if (!this.isClient) {
      return;
    }

    try {
      await settingsCache.clearSettings();
      localStorage.removeItem(SETTINGS_KEY);
      this.settings = this.getDefaults();
    } catch (error) {
      console.error('Failed to reset settings:', error);
      throw error;
    }
  }

  // Export settings for backup
  export(): string {
    return JSON.stringify(this.settings, null, 2);
  }

  // Import settings from backup
  async import(settingsJson: string): Promise<void> {
    try {
      const parsed = JSON.parse(settingsJson);
      const validated = UserSettingsSchema.parse(parsed);
      await this.save(validated);
    } catch (error) {
      console.error('Failed to import settings:', error);
      throw new Error('Invalid settings format');
    }
  }
}

export const settingsService = new SettingsService();