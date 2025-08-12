import { WebSocketClient } from './websocketClient';
import type { Candle, Trade, OrderBook } from '../../entities';

export class MockLiveFeed extends WebSocketClient {
  private mockTimers: Map<string, number> = new Map();
  private mockPrices: Map<string, number> = new Map();
  private tradeCounter: number = 0;

  constructor() {
    // Override with mock WebSocket URL (we'll simulate the connection)
    super({
      url: 'mock://localhost',
      reconnectDelay: 1000,
      maxReconnectAttempts: 5,
      pingInterval: 30000,
      batchInterval: 80, // 80ms batching
    });
  }

  connect(): void {
    console.log('MockLiveFeed: Simulating WebSocket connection...');
    this.connectionState = 'connecting';
    this.dispatchEvent(new CustomEvent('connectionStateChange', { 
      detail: { state: this.connectionState } 
    }));

    // Simulate connection delay
    setTimeout(() => {
      this.connectionState = 'connected';
      console.log('MockLiveFeed: Connected to mock feed');
      
      this.dispatchEvent(new CustomEvent('connectionStateChange', { 
        detail: { state: this.connectionState } 
      }));
    }, 500);
  }

  disconnect(): void {
    console.log('MockLiveFeed: Disconnecting...');
    this.mockTimers.forEach((timer) => clearInterval(timer));
    this.mockTimers.clear();
    
    this.connectionState = 'disconnected';
    this.dispatchEvent(new CustomEvent('connectionStateChange', { 
      detail: { state: this.connectionState } 
    }));
  }

  subscribe(symbol: string): void {
    // Check if already subscribed to this symbol
    if (this.mockTimers.has(`${symbol}-candles`) || 
        this.mockTimers.has(`${symbol}-trades`) || 
        this.mockTimers.has(`${symbol}-orderbook`)) {
      console.log(`MockLiveFeed: Already subscribed to ${symbol}`);
      return;
    }

    console.log(`MockLiveFeed: Subscribing to ${symbol}`);
    
    // Initialize base price
    const basePrice = this.getBasePriceForSymbol(symbol);
    this.mockPrices.set(symbol, basePrice);

    // Start generating mock data
    this.startMockCandles(symbol);
    this.startMockTrades(symbol);
    this.startMockOrderBook(symbol);
  }

  unsubscribe(symbol: string): void {
    console.log(`MockLiveFeed: Unsubscribing from ${symbol}`);
    
    // Clear all timers for this symbol
    const timerKeys = [`${symbol}-candles`, `${symbol}-trades`, `${symbol}-orderbook`];
    timerKeys.forEach(key => {
      const timer = this.mockTimers.get(key);
      if (timer) {
        clearInterval(timer);
        this.mockTimers.delete(key);
      }
    });
    
    this.mockPrices.delete(symbol);
  }

  private getBasePriceForSymbol(symbol: string): number {
    if (symbol.includes('BTC')) return 50000;
    if (symbol.includes('ETH')) return 3000;
    if (symbol.includes('SOL')) return 200;
    return 100;
  }

  private updatePrice(symbol: string, volatility: number = 0.002): number {
    const currentPrice = this.mockPrices.get(symbol) || this.getBasePriceForSymbol(symbol);
    const change = (Math.random() - 0.5) * volatility;
    const newPrice = currentPrice * (1 + change);
    this.mockPrices.set(symbol, newPrice);
    return newPrice;
  }

  private startMockCandles(symbol: string): void {
    // Generate new candle every minute
    const candleTimer = setInterval(() => {
      if (this.connectionState !== 'connected') return;

      const basePrice = this.updatePrice(symbol, 0.01);
      const timestamp = Date.now();
      
      // Generate OHLC around current price
      const volatility = 0.005;
      const open = basePrice;
      const high = open * (1 + Math.random() * volatility);
      const low = open * (1 - Math.random() * volatility);
      const close = open * (1 + (Math.random() - 0.5) * volatility);
      const volume = Math.random() * 1000 + 100;

      const candle: Candle = {
        t: timestamp,
        o: Number(open.toFixed(2)),
        h: Number(Math.max(open, close, high).toFixed(2)),
        l: Number(Math.min(open, close, low).toFixed(2)),
        c: Number(close.toFixed(2)),
        v: Number(volume.toFixed(2)),
      };

      this.dispatchEvent(new CustomEvent('candle', {
        detail: { symbol, candle }
      }));
    }, 60000); // Every minute

    this.mockTimers.set(`${symbol}-candles`, candleTimer as any);
  }

  private startMockTrades(symbol: string): void {
    // Generate trades every 1-5 seconds
    const tradeTimer = setInterval(() => {
      if (this.connectionState !== 'connected') return;

      const currentPrice = this.mockPrices.get(symbol) || this.getBasePriceForSymbol(symbol);
      const priceVariation = currentPrice * 0.001; // 0.1% variation
      const price = currentPrice + (Math.random() - 0.5) * priceVariation;
      
      const trade: Trade = {
        id: `${symbol}-${Date.now()}-${++this.tradeCounter}`,
        symbol,
        price: Number(price.toFixed(2)),
        qty: Number((Math.random() * 10 + 0.1).toFixed(4)),
        side: Math.random() > 0.5 ? 'buy' : 'sell',
        ts: Date.now(),
      };

      this.dispatchEvent(new CustomEvent('trade', {
        detail: { symbol, trade }
      }));
    }, Math.random() * 4000 + 1000); // 1-5 seconds

    this.mockTimers.set(`${symbol}-trades`, tradeTimer as any);
  }

  private startMockOrderBook(symbol: string): void {
    // Generate order book updates every 2-8 seconds
    const bookTimer = setInterval(() => {
      if (this.connectionState !== 'connected') return;

      const currentPrice = this.mockPrices.get(symbol) || this.getBasePriceForSymbol(symbol);
      
      // Generate realistic order book
      const bids: Array<{ price: number; qty: number }> = [];
      const asks: Array<{ price: number; qty: number }> = [];

      // Generate 20 bid levels
      for (let i = 0; i < 20; i++) {
        const bidPrice = currentPrice * (1 - (i + 1) * 0.0001);
        bids.push({
          price: Number(bidPrice.toFixed(2)),
          qty: Number((Math.random() * 50 + 1).toFixed(4)),
        });
      }

      // Generate 20 ask levels
      for (let i = 0; i < 20; i++) {
        const askPrice = currentPrice * (1 + (i + 1) * 0.0001);
        asks.push({
          price: Number(askPrice.toFixed(2)),
          qty: Number((Math.random() * 50 + 1).toFixed(4)),
        });
      }

      const orderBook: OrderBook = {
        symbol,
        bids: bids.sort((a, b) => b.price - a.price), // Highest bid first
        asks: asks.sort((a, b) => a.price - b.price), // Lowest ask first
        lastUpdateId: Date.now(),
        ts: Date.now(),
      };

      this.dispatchEvent(new CustomEvent('orderbook', {
        detail: { symbol, orderBook }
      }));
    }, Math.random() * 6000 + 2000); // 2-8 seconds

    this.mockTimers.set(`${symbol}-orderbook`, bookTimer as any);
  }
}

export const mockLiveFeed = new MockLiveFeed();