import type { Candle } from '../../entities';

export interface MarketFeed {
  getHistoricalCandles(symbol: string, interval: string, limit: number): Promise<Candle[]>;
  getSymbolInfo(symbol: string): Promise<any>;
}

class BinanceFeed implements MarketFeed {
  private readonly baseUrl = 'https://api.binance.com/api/v3';

  async getHistoricalCandles(symbol: string, interval: string, limit: number): Promise<Candle[]> {
    try {
      // Convert symbol format (BTCGBP -> BTCGBP, but ensure it's valid)
      const binanceSymbol = symbol.toUpperCase();
      
      // Convert interval format (1m -> 1m, 1h -> 1h, 1d -> 1d)
      const binanceInterval = this.convertInterval(interval);
      
      const url = `${this.baseUrl}/klines?symbol=${binanceSymbol}&interval=${binanceInterval}&limit=${limit}`;
      console.log(`Fetching real data from: ${url}`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        // If the symbol doesn't exist on Binance, fall back to BTCUSDT
        if (response.status === 400 && symbol.includes('GBP')) {
          console.warn(`${symbol} not found on Binance, falling back to BTCUSDT`);
          return this.getHistoricalCandles('BTCUSDT', interval, limit);
        }
        throw new Error(`Binance API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Convert Binance kline format to our Candle format
      return data.map((kline: any[]) => ({
        t: kline[0], // Open time
        o: parseFloat(kline[1]), // Open price
        h: parseFloat(kline[2]), // High price
        l: parseFloat(kline[3]), // Low price
        c: parseFloat(kline[4]), // Close price
        v: parseFloat(kline[5]), // Volume
      }));
    } catch (error) {
      console.error('Failed to fetch historical data from Binance:', error);
      throw error;
    }
  }

  async getSymbolInfo(symbol: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/exchangeInfo?symbol=${symbol.toUpperCase()}`);
      
      if (!response.ok) {
        throw new Error(`Binance API error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.symbols?.[0] || null;
    } catch (error) {
      console.error('Failed to fetch symbol info from Binance:', error);
      return null;
    }
  }

  private convertInterval(interval: string): string {
    // Convert our interval format to Binance format
    const intervalMap: Record<string, string> = {
      '1m': '1m',
      '5m': '5m',
      '15m': '15m',
      '1h': '1h',
      '1d': '1d',
    };
    
    return intervalMap[interval] || '5m';
  }
}

export const binanceFeed = new BinanceFeed();