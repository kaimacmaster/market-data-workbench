import Dexie, { type Table } from 'dexie';
import type { Symbol, Candle, Trade, OrderBook } from '../../entities';
import type { UserSettings } from '../settings/settingsService';

export interface CachedSymbol extends Symbol {
  pinnedAt?: number;
  lastUpdated: number;
}

export interface CachedCandle extends Candle {
  symbol: string;
  interval: string; // '1m', '5m', '1h', etc.
}

export interface CachedTrade extends Trade {
  // Trade already has symbol field
}

export interface CachedOrderBook extends OrderBook {
  // OrderBook already has symbol field  
}

export interface CachedSettings {
  id: string; // Always 'user-settings'
  data: UserSettings;
  timestamp: number;
}

export class MarketDataDB extends Dexie {
  symbols!: Table<CachedSymbol, string>;
  candles!: Table<CachedCandle, number>;
  trades!: Table<CachedTrade, string>;
  orderbooks!: Table<CachedOrderBook, number>;
  settings!: Table<CachedSettings, string>;

  constructor() {
    super('MarketDataWorkbench');

    this.version(1).stores({
      symbols: 'id, lastUpdated, pinnedAt',
      candles: '[symbol+interval+t], symbol, interval, t',
      trades: 'id, symbol, ts',
      orderbooks: '[symbol+ts], symbol, ts',
      settings: 'id, timestamp'
    });
  }
}

export const db = new MarketDataDB();