import { db, type CachedOrderBook } from './database';
import type { OrderBook } from '../../entities';

export class OrderBookCache {
  async getLatestOrderBook(symbol: string): Promise<CachedOrderBook | undefined> {
    const results = await db.orderbooks
      .where('symbol')
      .equals(symbol)
      .toArray();

    if (results.length === 0) return undefined;
    
    return results.sort((a, b) => b.ts - a.ts)[0];
  }

  async addOrderBook(orderBook: OrderBook): Promise<void> {
    const cachedOrderBook: CachedOrderBook = { ...orderBook };
    
    // Only keep the latest order book for each symbol to save space
    await this.clearOrderBooks(orderBook.symbol);
    await db.orderbooks.put(cachedOrderBook);
  }

  async getOrderBooks(symbol: string, limit: number = 10): Promise<CachedOrderBook[]> {
    const results = await db.orderbooks
      .where('symbol')
      .equals(symbol)
      .toArray();

    return results
      .sort((a, b) => b.ts - a.ts)
      .slice(0, limit);
  }

  async clearOrderBooks(symbol: string): Promise<void> {
    await db.orderbooks
      .where('symbol')
      .equals(symbol)
      .delete();
  }

  async getOrderBookStats(symbol: string): Promise<{
    count: number;
    latestUpdate?: number;
    avgSpread?: number;
  }> {
    const orderBooks = await this.getOrderBooks(symbol, 100);
    
    if (orderBooks.length === 0) {
      return { count: 0 };
    }

    // Calculate average spread
    let totalSpread = 0;
    let validSpreads = 0;

    orderBooks.forEach(book => {
      if (book.bids.length > 0 && book.asks.length > 0) {
        const spread = book.asks[0].price - book.bids[0].price;
        if (spread > 0) {
          totalSpread += spread;
          validSpreads++;
        }
      }
    });

    const avgSpread = validSpreads > 0 ? totalSpread / validSpreads : undefined;

    return {
      count: orderBooks.length,
      latestUpdate: orderBooks[0].ts,
      avgSpread,
    };
  }

  // Cleanup old order books (keep only latest few)
  async cleanupOldOrderBooks(symbol: string, keepCount: number = 5): Promise<void> {
    const orderBooks = await this.getOrderBooks(symbol, 1000);
    
    if (orderBooks.length > keepCount) {
      const toDelete = orderBooks.slice(keepCount);
      
      await db.transaction('rw', db.orderbooks, async () => {
        for (const book of toDelete) {
          await db.orderbooks.where('[symbol+ts]').equals([book.symbol, book.ts]).delete();
        }
      });
    }
  }
}

export const orderBookCache = new OrderBookCache();