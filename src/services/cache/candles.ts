import { db, type CachedCandle } from './database';
import type { Candle } from '../../entities';

export class CandleCache {
  async getCandles(symbol: string, interval: string, limit?: number): Promise<CachedCandle[]> {
    const query = db.candles
      .where('[symbol+interval]')
      .equals([symbol, interval]);

    const results = await query.toArray();
    const sorted = results.sort((a, b) => a.t - b.t);
    
    return limit ? sorted.slice(-limit) : sorted;
  }

  async getCandlesInRange(
    symbol: string, 
    interval: string, 
    startTime: number, 
    endTime: number
  ): Promise<CachedCandle[]> {
    return db.candles
      .where('[symbol+interval+t]')
      .between([symbol, interval, startTime], [symbol, interval, endTime])
      .toArray();
  }

  async addCandles(symbol: string, interval: string, candles: Candle[]): Promise<void> {
    const cachedCandles: CachedCandle[] = candles.map(candle => ({
      ...candle,
      symbol,
      interval,
    }));

    await db.candles.bulkPut(cachedCandles);
  }

  async updateCandle(symbol: string, interval: string, candle: Candle): Promise<void> {
    const cachedCandle: CachedCandle = {
      ...candle,
      symbol,
      interval,
    };

    await db.candles.put(cachedCandle);
  }

  async getLatestCandle(symbol: string, interval: string = '1m'): Promise<CachedCandle | undefined> {
    const results = await db.candles
      .where('[symbol+interval]')
      .equals([symbol, interval])
      .toArray();
    
    if (results.length === 0) return undefined;
    
    return results.sort((a, b) => b.t - a.t)[0];
  }

  async clearCandles(symbol: string, interval?: string): Promise<void> {
    if (interval) {
      await db.candles
        .where('[symbol+interval]')
        .equals([symbol, interval])
        .delete();
    } else {
      await db.candles
        .where('symbol')
        .equals(symbol)
        .delete();
    }
  }

  async getCacheInfo(symbol: string, interval: string): Promise<{
    count: number;
    oldestTime?: number;
    newestTime?: number;
  }> {
    const candles = await this.getCandles(symbol, interval);
    
    if (candles.length === 0) {
      return { count: 0 };
    }

    return {
      count: candles.length,
      oldestTime: candles[0].t,
      newestTime: candles[candles.length - 1].t,
    };
  }
}

export const candleCache = new CandleCache();