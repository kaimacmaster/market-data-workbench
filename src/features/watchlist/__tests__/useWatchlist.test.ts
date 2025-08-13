import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWatchlist } from '../useWatchlist';
import { symbolCache } from '../../../services/cache';

vi.mock('../../../services/cache', () => ({
  symbolCache: {
    getSymbols: vi.fn(),
    getPinnedSymbols: vi.fn(),
    addSymbol: vi.fn(),
    removeSymbol: vi.fn(),
    pinSymbol: vi.fn(),
    unpinSymbol: vi.fn(),
    searchSymbols: vi.fn()
  }
}));

describe('useWatchlist', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should initialize with loading state', async () => {
    vi.mocked(symbolCache.getSymbols).mockResolvedValue([]);
    vi.mocked(symbolCache.getPinnedSymbols).mockResolvedValue([]);
    
    const { result } = renderHook(() => useWatchlist());

    expect(result.current.symbols).toEqual([]);
    expect(result.current.pinnedSymbols).toEqual([]);
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBe(null);
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    expect(result.current.loading).toBe(false);
  });

  it('should load symbols on mount', async () => {
    const mockSymbols = [
      {
        id: 'BTCUSDT',
        base: 'BTC',
        quote: 'USDT',
        displayName: 'Bitcoin/Tether',
        status: 'active' as const,
        createdAt: new Date(),
        pinnedAt: null
      }
    ];

    vi.mocked(symbolCache.getSymbols).mockResolvedValue(mockSymbols);
    vi.mocked(symbolCache.getPinnedSymbols).mockResolvedValue([]);

    const { result } = renderHook(() => useWatchlist());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.symbols).toEqual(mockSymbols);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should handle add symbol', async () => {
    vi.mocked(symbolCache.getSymbols).mockResolvedValue([]);
    vi.mocked(symbolCache.getPinnedSymbols).mockResolvedValue([]);
    vi.mocked(symbolCache.addSymbol).mockResolvedValue();

    const { result } = renderHook(() => useWatchlist());

    const newSymbol = {
      id: 'ETHUSDT',
      base: 'ETH',
      quote: 'USDT',
      displayName: 'Ethereum/Tether',
      status: 'active' as const
    };

    await act(async () => {
      await result.current.addSymbol(newSymbol);
    });

    expect(symbolCache.addSymbol).toHaveBeenCalledWith(newSymbol);
  });

  it('should handle remove symbol', async () => {
    const mockSymbol = {
      id: 'BTCUSDT',
      base: 'BTC',
      quote: 'USDT',
      displayName: 'Bitcoin/Tether',
      status: 'active' as const,
      createdAt: new Date(),
      pinnedAt: null
    };

    vi.mocked(symbolCache.getSymbols).mockResolvedValue([mockSymbol]);
    vi.mocked(symbolCache.getPinnedSymbols).mockResolvedValue([]);
    vi.mocked(symbolCache.removeSymbol).mockResolvedValue();

    const { result } = renderHook(() => useWatchlist());

    await act(async () => {
      await result.current.removeSymbol('BTCUSDT');
    });

    expect(symbolCache.removeSymbol).toHaveBeenCalledWith('BTCUSDT');
  });
});