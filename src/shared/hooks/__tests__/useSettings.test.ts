import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSettings } from '../useSettings';
import { settingsService } from '../../../services/settings/settingsService';

vi.mock('../../../services/settings/settingsService', () => ({
  settingsService: {
    load: vi.fn(),
    save: vi.fn(),
    getDefaults: vi.fn()
  }
}));

describe('useSettings', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should initialize with default settings', async () => {
    const defaultSettings = {
      theme: 'light' as const,
      chartTheme: 'standard' as const,
      updateThrottle: 80,
      indicatorsVisible: true,
      defaultIndicators: {
        ema: true,
        vwap: true,
        bb: false,
        rsi: false
      },
      gridColumns: {
        price: true,
        change: true,
        volume: true,
        marketCap: false
      }
    };

    vi.mocked(settingsService.getDefaults).mockReturnValue(defaultSettings);
    vi.mocked(settingsService.load).mockResolvedValue(defaultSettings);

    const { result } = renderHook(() => useSettings());

    expect(result.current.settings.theme).toBe('light');
    expect(result.current.settings.updateThrottle).toBe(80);
    expect(result.current.isLoading).toBe(true);
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    expect(result.current.isLoading).toBe(false);
  });

  it('should update settings', async () => {
    const mockSettings = {
      theme: 'light' as const,
      chartTheme: 'standard' as const,
      updateThrottle: 80,
      indicatorsVisible: true,
      defaultIndicators: {
        ema: true,
        vwap: true,
        bb: false,
        rsi: false
      },
      gridColumns: {
        price: true,
        change: true,
        volume: true,
        marketCap: false
      }
    };

    vi.mocked(settingsService.getDefaults).mockReturnValue(mockSettings);
    vi.mocked(settingsService.load).mockResolvedValue(mockSettings);
    vi.mocked(settingsService.save).mockResolvedValue();

    const { result } = renderHook(() => useSettings());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const updatedTheme = { theme: 'dark' as const };

    await act(async () => {
      await result.current.updateSettings(updatedTheme);
    });

    expect(settingsService.save).toHaveBeenCalled();
  });

  it('should handle reset to defaults', async () => {
    const customSettings = {
      theme: 'dark' as const,
      chartTheme: 'colorful' as const,
      updateThrottle: 100,
      indicatorsVisible: false,
      defaultIndicators: {
        ema: false,
        vwap: false,
        bb: true,
        rsi: true
      },
      gridColumns: {
        price: false,
        change: false,
        volume: false,
        marketCap: true
      }
    };

    const defaultSettings = {
      theme: 'light' as const,
      chartTheme: 'standard' as const,
      updateThrottle: 80,
      indicatorsVisible: true,
      defaultIndicators: {
        ema: true,
        vwap: true,
        bb: false,
        rsi: false
      },
      gridColumns: {
        price: true,
        change: true,
        volume: true,
        marketCap: false
      }
    };

    vi.mocked(settingsService.getDefaults).mockReturnValue(defaultSettings);
    vi.mocked(settingsService.load).mockResolvedValue(customSettings);
    vi.mocked(settingsService.save).mockResolvedValue();

    const { result } = renderHook(() => useSettings());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    await act(async () => {
      await result.current.resetSettings();
    });

    expect(settingsService.save).toHaveBeenCalledWith(defaultSettings);
  });
});