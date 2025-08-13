import { WebSocketClient } from './websocketClient';
import { createTrade, createOrderBook } from '../../entities';
import type { Trade, OrderBook } from '../../entities';

// Enhanced live feed that uses real prices from Binance as base
export class BinanceLiveFeed extends WebSocketClient {
  private intervalId?: number;
  private subscribedSymbols = new Set<string>();
  private currentPrices: Record<string, number> = {};

  constructor() {
    super({
      url: 'mock://binance-live',
      reconnectDelay: 1000,
      maxReconnectAttempts: 5,
      pingInterval: 30000,
      batchInterval: 80,
    });
  }

  connect(): void {
    console.log('BinanceLiveFeed: Connecting...');
    this.connectionState = 'connecting';
    this.dispatchEvent(new CustomEvent('connectionStateChange', { 
      detail: { state: this.connectionState } 
    }));

    // Simulate connection delay
    setTimeout(() => {
      this.connectionState = 'connected';
      console.log('BinanceLiveFeed: Connected to enhanced Binance feed');
      
      this.startMockData();
      
      this.dispatchEvent(new CustomEvent('connectionStateChange', { 
        detail: { state: this.connectionState } 
      }));
    }, 500);
  }

  disconnect(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    this.subscribedSymbols.clear();
    this.connectionState = 'disconnected';
    this.dispatchEvent(new CustomEvent('connectionStateChange', { 
      detail: { state: this.connectionState } 
    }));
  }

  subscribe(symbol: string): void {
    this.subscribedSymbols.add(symbol);
    console.log(`BinanceLiveFeed: Subscribed to live data for ${symbol}`);
    
    // Get current price from Binance API to base mock data on
    this.updateCurrentPrice(symbol);
  }

  unsubscribe(symbol: string): void {
    this.subscribedSymbols.delete(symbol);
    console.log(`BinanceLiveFeed: Unsubscribed from live data for ${symbol}`);
  }

  private async updateCurrentPrice(symbol: string) {
    try {
      const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol.toUpperCase()}`);
      if (response.ok) {
        const data = await response.json();
        this.currentPrices[symbol] = parseFloat(data.price);
      } else {
        // Fallback for non-existent pairs
        this.currentPrices[symbol] = 50000; // Default BTC price
      }
    } catch (error) {
      console.warn(`Failed to get current price for ${symbol}, using default`);
      this.currentPrices[symbol] = 50000;
    }
  }

  private startMockData(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    
    this.intervalId = window.setInterval(() => {
      if (this.connectionState !== 'connected') return;
      
      this.subscribedSymbols.forEach(symbol => {
        this.generateMockTrade(symbol);
        this.generateMockOrderBook(symbol);
      });
    }, 500);
  }

  private generateMockTrade(symbol: string): void {
    const basePrice = this.currentPrices[symbol] || 50000;
    const priceVariation = basePrice * 0.001; // 0.1% variation
    const price = basePrice + (Math.random() - 0.5) * 2 * priceVariation;
    
    const trade: Trade = createTrade({
      id: `trade-${Date.now()}-${Math.random()}`,
      symbol,
      price: Number(price.toFixed(2)),
      qty: Number((Math.random() * 2 + 0.1).toFixed(4)),
      side: Math.random() > 0.5 ? 'buy' : 'sell',
      ts: Date.now(),
    });

    this.dispatchEvent(new CustomEvent('trade', {
      detail: { symbol, trade }
    }));
  }

  private generateMockOrderBook(symbol: string): void {
    const basePrice = this.currentPrices[symbol] || 50000;
    const spread = basePrice * 0.0001; // 0.01% spread
    
    // Generate bids (buy orders) below current price
    const bids = Array.from({ length: 10 }, (_, i) => ({
      price: Number((basePrice - spread - (i * spread * 0.5)).toFixed(2)),
      qty: Number((Math.random() * 5 + 0.5).toFixed(4)),
    }));

    // Generate asks (sell orders) above current price  
    const asks = Array.from({ length: 10 }, (_, i) => ({
      price: Number((basePrice + spread + (i * spread * 0.5)).toFixed(2)),
      qty: Number((Math.random() * 5 + 0.5).toFixed(4)),
    }));

    const orderBook: OrderBook = createOrderBook({
      symbol,
      bids: bids.sort((a, b) => b.price - a.price), // Highest bid first
      asks: asks.sort((a, b) => a.price - b.price), // Lowest ask first
      lastUpdateId: Date.now(),
      ts: Date.now(),
    });

    this.dispatchEvent(new CustomEvent('orderbook', {
      detail: { symbol, orderBook }
    }));
  }

}

export const binanceLiveFeed = new BinanceLiveFeed();