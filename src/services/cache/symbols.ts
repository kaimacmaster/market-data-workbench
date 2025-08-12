import { db, type CachedSymbol } from './database';
import type { Symbol } from '../../entities';

export class SymbolCache {
  async getSymbols(): Promise<CachedSymbol[]> {
    return db.symbols.orderBy('lastUpdated').reverse().toArray();
  }

  async getPinnedSymbols(): Promise<CachedSymbol[]> {
    return db.symbols
      .where('pinnedAt')
      .above(0)
      .sortBy('pinnedAt');
  }

  async getSymbol(id: string): Promise<CachedSymbol | undefined> {
    return db.symbols.get(id);
  }

  async addSymbol(symbol: Symbol): Promise<void> {
    const cachedSymbol: CachedSymbol = {
      ...symbol,
      lastUpdated: Date.now(),
    };

    await db.symbols.put(cachedSymbol);
  }

  async removeSymbol(id: string): Promise<void> {
    await db.symbols.delete(id);
  }

  async pinSymbol(id: string): Promise<void> {
    await db.symbols.update(id, { pinnedAt: Date.now() });
  }

  async unpinSymbol(id: string): Promise<void> {
    await db.symbols.update(id, { pinnedAt: undefined });
  }

  async updateSymbol(id: string, updates: Partial<Symbol>): Promise<void> {
    await db.symbols.update(id, {
      ...updates,
      lastUpdated: Date.now(),
    });
  }

  async searchSymbols(query: string): Promise<CachedSymbol[]> {
    const lowerQuery = query.toLowerCase();
    
    return db.symbols
      .filter(symbol => 
        symbol.id.toLowerCase().includes(lowerQuery) ||
        symbol.displayName.toLowerCase().includes(lowerQuery) ||
        symbol.base.toLowerCase().includes(lowerQuery) ||
        symbol.quote.toLowerCase().includes(lowerQuery)
      )
      .toArray();
  }

  async clearSymbols(): Promise<void> {
    await db.symbols.clear();
  }
}

export const symbolCache = new SymbolCache();