import type { Candle } from '../../entities';

export class MockMarketFeed {
  private generateMockCandles(
    symbol: string,
    interval: string,
    count: number = 100,
    endTime: number = Date.now()
  ): Candle[] {
    const candles: Candle[] = [];
    const intervalMs = this.intervalToMs(interval);
    
    // Start price around $50,000 for crypto-like symbols
    let basePrice = symbol.includes('BTC') ? 50000 : 
                   symbol.includes('ETH') ? 3000 :
                   symbol.includes('SOL') ? 200 : 100;
    
    for (let i = count - 1; i >= 0; i--) {
      const timestamp = endTime - (i * intervalMs);
      
      // Generate random price movement
      const volatility = 0.02; // 2% volatility
      const change = (Math.random() - 0.5) * volatility;
      const open = basePrice * (1 + change);
      
      // Generate OHLC from open
      const highChange = Math.random() * 0.01; // Up to 1% high
      const lowChange = -Math.random() * 0.01; // Up to 1% low
      const closeChange = (Math.random() - 0.5) * 0.005; // Small close movement
      
      const high = open * (1 + highChange);
      const low = open * (1 + lowChange);
      const close = open * (1 + closeChange);
      
      // Ensure OHLC relationships are valid
      const validHigh = Math.max(open, close, high);
      const validLow = Math.min(open, close, low);
      
      // Random volume
      const volume = Math.random() * 1000 + 100;
      
      candles.push({
        t: timestamp,
        o: Number(open.toFixed(2)),
        h: Number(validHigh.toFixed(2)),
        l: Number(validLow.toFixed(2)),
        c: Number(close.toFixed(2)),
        v: Number(volume.toFixed(2)),
      });
      
      // Update base price for next candle
      basePrice = close;
    }
    
    return candles.sort((a, b) => a.t - b.t);
  }

  private intervalToMs(interval: string): number {
    const unit = interval.slice(-1);
    const value = parseInt(interval.slice(0, -1));
    
    switch (unit) {
      case 's': return value * 1000;
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      case 'w': return value * 7 * 24 * 60 * 60 * 1000;
      default: return 60 * 1000; // Default to 1 minute
    }
  }

  async getHistoricalCandles(
    symbol: string,
    interval: string = '1m',
    limit: number = 100,
    endTime?: number
  ): Promise<Candle[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 200));
    
    return this.generateMockCandles(symbol, interval, limit, endTime);
  }

  async getLatestCandle(symbol: string, interval: string = '1m'): Promise<Candle> {
    const candles = await this.getHistoricalCandles(symbol, interval, 1);
    return candles[0];
  }
}

export const mockMarketFeed = new MockMarketFeed();