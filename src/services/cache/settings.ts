import { db } from './database';
import type { UserSettings } from '../settings/settingsService';

class SettingsCache {

  async saveSettings(settings: UserSettings): Promise<void> {
    try {
      await db.settings.put({
        id: 'user-settings',
        data: settings,
        timestamp: Date.now(),
      });
      console.log('Settings saved to IndexedDB');
    } catch (error) {
      console.error('Failed to save settings to cache:', error);
      throw error;
    }
  }

  async getSettings(): Promise<UserSettings | null> {
    try {
      const cached = await db.settings.get('user-settings');
      if (cached) {
        console.log('Settings loaded from IndexedDB');
        return cached.data;
      }
      return null;
    } catch (error) {
      console.error('Failed to load settings from cache:', error);
      return null;
    }
  }

  async clearSettings(): Promise<void> {
    try {
      await db.settings.delete('user-settings');
      console.log('Settings cleared from IndexedDB');
    } catch (error) {
      console.error('Failed to clear settings from cache:', error);
      throw error;
    }
  }

  async getLastUpdated(): Promise<number | null> {
    try {
      const cached = await db.settings.get('user-settings');
      return cached?.timestamp || null;
    } catch (error) {
      console.error('Failed to get settings timestamp:', error);
      return null;
    }
  }
}

export const settingsCache = new SettingsCache();