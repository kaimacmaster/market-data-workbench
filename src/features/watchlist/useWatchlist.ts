import { useState, useEffect } from 'react';
import { symbolCache, type CachedSymbol } from '../../services/cache';
import type { Symbol } from '../../entities';

export const useWatchlist = () => {
  const [symbols, setSymbols] = useState<CachedSymbol[]>([]);
  const [pinnedSymbols, setPinnedSymbols] = useState<CachedSymbol[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSymbols = async () => {
    try {
      setLoading(true);
      const [allSymbols, pinned] = await Promise.all([
        symbolCache.getSymbols(),
        symbolCache.getPinnedSymbols(),
      ]);
      
      setSymbols(allSymbols);
      setPinnedSymbols(pinned);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load symbols');
    } finally {
      setLoading(false);
    }
  };

  const addSymbol = async (symbol: Symbol) => {
    try {
      await symbolCache.addSymbol(symbol);
      await loadSymbols();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add symbol');
    }
  };

  const removeSymbol = async (id: string) => {
    try {
      await symbolCache.removeSymbol(id);
      await loadSymbols();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove symbol');
    }
  };

  const pinSymbol = async (id: string) => {
    try {
      await symbolCache.pinSymbol(id);
      await loadSymbols();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to pin symbol');
    }
  };

  const unpinSymbol = async (id: string) => {
    try {
      await symbolCache.unpinSymbol(id);
      await loadSymbols();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unpin symbol');
    }
  };

  const searchSymbols = async (query: string): Promise<CachedSymbol[]> => {
    try {
      return await symbolCache.searchSymbols(query);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search symbols');
      return [];
    }
  };

  useEffect(() => {
    loadSymbols();
  }, []);

  return {
    symbols,
    pinnedSymbols,
    loading,
    error,
    addSymbol,
    removeSymbol,
    pinSymbol,
    unpinSymbol,
    searchSymbols,
    refresh: loadSymbols,
  };
};