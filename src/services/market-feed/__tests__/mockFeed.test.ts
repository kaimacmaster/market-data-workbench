import { describe, it, expect, beforeEach } from 'vitest';
import { MockMarketFeed } from '../mockFeed';

describe('MockMarketFeed', () => {
  let feed: MockMarketFeed;

  beforeEach(() => {
    feed = new MockMarketFeed();
  });

  describe('candles', () => {
    it('should generate mock candles', async () => {
      const candles = await feed.getHistoricalCandles('BTCUSDT', '1h', 10);
      
      expect(candles).toHaveLength(10);
      candles.forEach(candle => {
        expect(candle).toHaveProperty('t');
        expect(candle).toHaveProperty('o');
        expect(candle).toHaveProperty('h');
        expect(candle).toHaveProperty('l');
        expect(candle).toHaveProperty('c');
        expect(candle).toHaveProperty('v');
        
        expect(candle.o).toBeGreaterThan(0);
        expect(candle.h).toBeGreaterThanOrEqual(candle.o);
        expect(candle.l).toBeLessThanOrEqual(candle.o);
        expect(candle.v).toBeGreaterThan(0);
      });
    });

    it('should generate candles in chronological order', async () => {
      const candles = await feed.getHistoricalCandles('BTCUSDT', '1h', 5);
      
      for (let i = 1; i < candles.length; i++) {
        expect(candles[i].t).toBeGreaterThan(candles[i - 1].t);
      }
    });
  });

  describe('latest candle', () => {
    it('should get latest candle', async () => {
      const candle = await feed.getLatestCandle('BTCUSDT', '1m');
      
      expect(candle).toHaveProperty('t');
      expect(candle).toHaveProperty('o');
      expect(candle).toHaveProperty('h');
      expect(candle).toHaveProperty('l');
      expect(candle).toHaveProperty('c');
      expect(candle).toHaveProperty('v');
      
      expect(candle.o).toBeGreaterThan(0);
      expect(candle.v).toBeGreaterThan(0);
    });
  });

  describe('interval conversion', () => {
    it('should handle different intervals', async () => {
      const candles1m = await feed.getHistoricalCandles('BTCUSDT', '1m', 2);
      const candles1h = await feed.getHistoricalCandles('BTCUSDT', '1h', 2);
      
      expect(candles1m).toHaveLength(2);
      expect(candles1h).toHaveLength(2);
      
      // 1 hour interval should have larger time gaps than 1 minute
      const gap1m = candles1m[1].t - candles1m[0].t;
      const gap1h = candles1h[1].t - candles1h[0].t;
      
      expect(gap1h).toBeGreaterThan(gap1m);
    });
  });

  describe('price generation', () => {
    it('should generate different base prices for different symbols', async () => {
      const btcCandle = await feed.getLatestCandle('BTCUSDT', '1m');
      const ethCandle = await feed.getLatestCandle('ETHUSDT', '1m');
      const solCandle = await feed.getLatestCandle('SOLUSDT', '1m');
      
      // BTC should have highest price, then ETH, then SOL
      expect(btcCandle.o).toBeGreaterThan(ethCandle.o);
      expect(ethCandle.o).toBeGreaterThan(solCandle.o);
    });
  });
});