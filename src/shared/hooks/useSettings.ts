import { useState, useEffect, useCallback } from 'react';
import { settingsService, type UserSettings } from '../../services/settings/settingsService';

export const useSettings = () => {
  const [settings, setSettings] = useState<UserSettings>(settingsService.getDefaults());
  const [isLoading, setIsLoading] = useState(true);

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedSettings = await settingsService.load();
        setSettings(savedSettings);
      } catch (error) {
        console.error('Failed to load settings:', error);
        // Use defaults on error
        setSettings(settingsService.getDefaults());
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  const updateSettings = useCallback(async (newSettings: Partial<UserSettings>) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      await settingsService.save(updatedSettings);
      setSettings(updatedSettings);
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    }
  }, [settings]);

  const resetSettings = useCallback(async () => {
    try {
      const defaultSettings = settingsService.getDefaults();
      await settingsService.save(defaultSettings);
      setSettings(defaultSettings);
    } catch (error) {
      console.error('Failed to reset settings:', error);
      throw error;
    }
  }, []);

  const getSetting = useCallback(<K extends keyof UserSettings>(key: K): UserSettings[K] => {
    return settings[key];
  }, [settings]);

  return {
    settings,
    updateSettings,
    resetSettings,
    getSetting,
    isLoading,
  };
};