import { useQuery, useQueryClient } from '@tanstack/react-query';
import { candleCache } from '../../services/cache';
import { marketFeed } from '../../services/market-feed';
import type { Candle } from '../../entities';
import { useSettings } from './useSettings';

interface UseCandlesOptions {
  symbol: string;
  interval?: string;
  limit?: number;
  enabled?: boolean;
}

export const useCandles = ({ 
  symbol, 
  interval = '1m', 
  limit = 100, 
  enabled = true 
}: UseCandlesOptions) => {
  const queryClient = useQueryClient();
  const { settings } = useSettings();

  return useQuery({
    queryKey: ['candles', symbol, interval, limit],
    queryFn: async (): Promise<Candle[]> => {
      try {
        // First, try to get from cache
        const cachedCandles = await candleCache.getCandles(symbol, interval, limit);
        
        if (cachedCandles.length > 0) {
          console.log(`Loaded ${cachedCandles.length} candles from cache for ${symbol}`);
          
          // Background fetch for latest data
          marketFeed.getHistoricalCandles(symbol, interval, limit)
            .then(async (freshCandles) => {
              if (freshCandles.length > 0) {
                await candleCache.addCandles(symbol, interval, freshCandles);
                
                // Update query cache
                queryClient.setQueryData(['candles', symbol, interval, limit], freshCandles);
              }
            })
            .catch(console.error);
          
          return cachedCandles;
        }

        // If no cache, fetch fresh data
        console.log(`Fetching fresh candles for ${symbol}`);
        const freshCandles = await marketFeed.getHistoricalCandles(symbol, interval, limit);
        
        if (freshCandles.length > 0) {
          // Cache the fresh data
          await candleCache.addCandles(symbol, interval, freshCandles);
        }

        return freshCandles;
      } catch (error) {
        console.error('Error fetching candles:', error);
        
        // Fallback to cache even if it's old
        const cachedCandles = await candleCache.getCandles(symbol, interval, limit);
        if (cachedCandles.length > 0) {
          return cachedCandles;
        }
        
        throw error;
      }
    },
    enabled,
    staleTime: 1000 * 30, // 30 seconds
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
};

export const useCacheInfo = (symbol: string, interval: string = '1m') => {
  return useQuery({
    queryKey: ['cache-info', symbol, interval],
    queryFn: () => candleCache.getCacheInfo(symbol, interval),
    staleTime: 1000 * 60, // 1 minute
  });
};