import { db, type CachedTrade } from './database';
import type { Trade } from '../../entities';

export class TradeCache {
  async getTrades(symbol: string, limit?: number): Promise<CachedTrade[]> {
    const query = db.trades
      .where('symbol')
      .equals(symbol);

    const results = await query.toArray();
    const sorted = results.sort((a, b) => b.ts - a.ts); // Most recent first
    
    return limit ? sorted.slice(0, limit) : sorted;
  }

  async getTradesInRange(
    symbol: string,
    startTime: number,
    endTime: number
  ): Promise<CachedTrade[]> {
    return db.trades
      .where('symbol')
      .equals(symbol)
      .and(trade => trade.ts >= startTime && trade.ts <= endTime)
      .toArray();
  }

  async addTrades(trades: Trade[]): Promise<void> {
    const cachedTrades: CachedTrade[] = trades.map(trade => ({ ...trade }));
    await db.trades.bulkPut(cachedTrades);
  }

  async addTrade(trade: Trade): Promise<void> {
    const cachedTrade: CachedTrade = { ...trade };
    await db.trades.put(cachedTrade);
  }

  async getLatestTrade(symbol: string): Promise<CachedTrade | undefined> {
    const results = await db.trades
      .where('symbol')
      .equals(symbol)
      .toArray();

    if (results.length === 0) return undefined;
    
    return results.sort((a, b) => b.ts - a.ts)[0];
  }

  async clearTrades(symbol: string): Promise<void> {
    await db.trades
      .where('symbol')
      .equals(symbol)
      .delete();
  }

  async getTradeStats(symbol: string): Promise<{
    count: number;
    oldestTime?: number;
    newestTime?: number;
    totalVolume?: number;
  }> {
    const trades = await this.getTrades(symbol);
    
    if (trades.length === 0) {
      return { count: 0 };
    }

    const totalVolume = trades.reduce((sum, trade) => sum + (trade.price * trade.qty), 0);

    return {
      count: trades.length,
      oldestTime: trades[trades.length - 1].ts,
      newestTime: trades[0].ts,
      totalVolume,
    };
  }

  // Cleanup old trades to manage storage
  async cleanupOldTrades(symbol: string, maxAge: number = 24 * 60 * 60 * 1000): Promise<void> {
    const cutoffTime = Date.now() - maxAge;
    
    await db.trades
      .where('symbol')
      .equals(symbol)
      .and(trade => trade.ts < cutoffTime)
      .delete();
  }
}

export const tradeCache = new TradeCache();