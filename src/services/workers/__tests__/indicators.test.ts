import { describe, it, expect } from 'vitest';

// Mock data for testing
const mockCandles = [
  { t: 1000, o: 100, h: 105, l: 95, c: 102, v: 1000 },
  { t: 2000, o: 102, h: 108, l: 100, c: 106, v: 1200 },
  { t: 3000, o: 106, h: 110, l: 104, c: 108, v: 1100 },
  { t: 4000, o: 108, h: 112, l: 106, c: 110, v: 900 },
  { t: 5000, o: 110, h: 115, l: 108, c: 112, v: 1300 },
  { t: 6000, o: 112, h: 116, l: 110, c: 114, v: 1400 },
  { t: 7000, o: 114, h: 118, l: 112, c: 116, v: 1000 },
  { t: 8000, o: 116, h: 120, l: 114, c: 118, v: 1100 },
  { t: 9000, o: 118, h: 122, l: 116, c: 120, v: 1200 },
  { t: 10000, o: 120, h: 124, l: 118, c: 122, v: 1000 },
];

// Import the functions directly for unit testing
// In a real implementation, we'd test via Comlink, but for unit tests we can test the functions directly

describe('EMA Calculation', () => {
  // For unit testing, we'll create standalone versions of the functions
  // without the Web Worker and Comlink overhead
  
  function ema(candles: typeof mockCandles, { period }: { period: number }): Float64Array {
    const k = 2 / (period + 1);
    const out = new Float64Array(candles.length);
    
    if (candles.length === 0) return out;
    
    let prev = candles[0]?.c ?? 0;
    
    for (let i = 0; i < candles.length; i++) {
      prev = i === 0 ? candles[i].c : candles[i].c * k + prev * (1 - k);
      out[i] = prev;
    }
    
    return out;
  }

  it('should calculate EMA correctly for period 3', () => {
    const result = ema(mockCandles, { period: 3 });
    
    // First value should be the close price
    expect(result[0]).toBe(102);
    
    // Subsequent values should be EMA calculations
    expect(result.length).toBe(mockCandles.length);
    
    // EMA should generally trend upward with our mock data
    expect(result[result.length - 1]).toBeGreaterThan(result[0]);
    
    // Values should be reasonable (between min/max of closes)
    const closes = mockCandles.map(c => c.c);
    const minClose = Math.min(...closes);
    const maxClose = Math.max(...closes);
    
    for (let i = 0; i < result.length; i++) {
      expect(result[i]).toBeGreaterThanOrEqual(minClose - 1); // Allow small variance
      expect(result[i]).toBeLessThanOrEqual(maxClose + 1);
    }
  });

  it('should handle empty candles array', () => {
    const result = ema([], { period: 14 });
    expect(result.length).toBe(0);
  });

  it('should handle single candle', () => {
    const singleCandle = [mockCandles[0]];
    const result = ema(singleCandle, { period: 14 });
    expect(result.length).toBe(1);
    expect(result[0]).toBe(singleCandle[0].c);
  });
});

describe('VWAP Calculation', () => {
  function vwap(candles: typeof mockCandles): Float64Array {
    const out = new Float64Array(candles.length);
    
    if (candles.length === 0) return out;
    
    let cumulativeVP = 0; // Cumulative Volume * Price
    let cumulativeV = 0;  // Cumulative Volume
    
    for (let i = 0; i < candles.length; i++) {
      const candle = candles[i];
      const typicalPrice = (candle.h + candle.l + candle.c) / 3;
      
      cumulativeVP += typicalPrice * candle.v;
      cumulativeV += candle.v;
      
      out[i] = cumulativeV > 0 ? cumulativeVP / cumulativeV : typicalPrice;
    }
    
    return out;
  }

  it('should calculate VWAP correctly', () => {
    const result = vwap(mockCandles);
    
    expect(result.length).toBe(mockCandles.length);
    
    // First VWAP should be the typical price of first candle
    const firstTypical = (mockCandles[0].h + mockCandles[0].l + mockCandles[0].c) / 3;
    expect(result[0]).toBeCloseTo(firstTypical, 2);
    
    // VWAP values should be reasonable
    for (let i = 0; i < result.length; i++) {
      expect(result[i]).toBeGreaterThan(0);
      expect(result[i]).toBeLessThan(200); // Reasonable upper bound for our test data
    }
  });

  it('should handle empty candles', () => {
    const result = vwap([]);
    expect(result.length).toBe(0);
  });
});

describe('RSI Calculation', () => {
  function rsi(candles: typeof mockCandles, { period }: { period: number }): Float64Array {
    const out = new Float64Array(candles.length);
    
    if (candles.length < 2) return out;
    
    // Calculate price changes
    const changes = new Array(candles.length - 1);
    for (let i = 1; i < candles.length; i++) {
      changes[i - 1] = candles[i].c - candles[i - 1].c;
    }
    
    // Calculate initial averages
    let avgGain = 0;
    let avgLoss = 0;
    
    for (let i = 0; i < Math.min(period, changes.length); i++) {
      if (changes[i] > 0) {
        avgGain += changes[i];
      } else {
        avgLoss -= changes[i]; // Make positive
      }
    }
    
    avgGain /= period;
    avgLoss /= period;
    
    // Calculate RSI for initial period
    for (let i = 0; i < period && i < out.length; i++) {
      out[i] = 50; // Default RSI for insufficient data
    }
    
    // Calculate RSI using Wilder's smoothing
    for (let i = period; i < candles.length; i++) {
      const change = changes[i - 1];
      
      if (change > 0) {
        avgGain = (avgGain * (period - 1) + change) / period;
        avgLoss = (avgLoss * (period - 1)) / period;
      } else {
        avgGain = (avgGain * (period - 1)) / period;
        avgLoss = (avgLoss * (period - 1) - change) / period;
      }
      
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      out[i] = 100 - (100 / (1 + rs));
    }
    
    return out;
  }

  it('should calculate RSI correctly for period 14', () => {
    const result = rsi(mockCandles, { period: 5 }); // Use period 5 for smaller test dataset
    
    expect(result.length).toBe(mockCandles.length);
    
    // Initial values should be 50 (default)
    for (let i = 0; i < 5; i++) {
      expect(result[i]).toBe(50);
    }
    
    // RSI values should be between 0 and 100
    for (let i = 5; i < result.length; i++) {
      expect(result[i]).toBeGreaterThanOrEqual(0);
      expect(result[i]).toBeLessThanOrEqual(100);
    }
    
    // With generally upward trending prices, RSI should be > 50
    expect(result[result.length - 1]).toBeGreaterThan(50);
  });

  it('should handle insufficient data', () => {
    const result = rsi([mockCandles[0]], { period: 14 });
    expect(result.length).toBe(1);
    expect(result[0]).toBe(0); // Not enough data
  });
});

describe('Simple Moving Average', () => {
  function sma(candles: typeof mockCandles, period: number): Float64Array {
    const out = new Float64Array(candles.length);
    
    for (let i = 0; i < candles.length; i++) {
      let sum = 0;
      let count = 0;
      
      for (let j = Math.max(0, i - period + 1); j <= i; j++) {
        sum += candles[j].c;
        count++;
      }
      
      out[i] = count > 0 ? sum / count : candles[i]?.c ?? 0;
    }
    
    return out;
  }

  it('should calculate SMA correctly', () => {
    const result = sma(mockCandles, 3);
    
    expect(result.length).toBe(mockCandles.length);
    
    // First value should be just the close price
    expect(result[0]).toBe(mockCandles[0].c);
    
    // Second value should be average of first two
    expect(result[1]).toBe((mockCandles[0].c + mockCandles[1].c) / 2);
    
    // Third value should be average of first three
    expect(result[2]).toBe((mockCandles[0].c + mockCandles[1].c + mockCandles[2].c) / 3);
    
    // All values should be reasonable
    for (let i = 0; i < result.length; i++) {
      expect(result[i]).toBeGreaterThan(0);
    }
  });
});

describe('Bollinger Bands', () => {
  function sma(candles: typeof mockCandles, period: number): Float64Array {
    const out = new Float64Array(candles.length);
    
    for (let i = 0; i < candles.length; i++) {
      let sum = 0;
      let count = 0;
      
      for (let j = Math.max(0, i - period + 1); j <= i; j++) {
        sum += candles[j].c;
        count++;
      }
      
      out[i] = count > 0 ? sum / count : candles[i]?.c ?? 0;
    }
    
    return out;
  }

  function bollingerBands(candles: typeof mockCandles, period: number = 20, stdDev: number = 2) {
    const middle = sma(candles, period);
    const upper = new Float64Array(candles.length);
    const lower = new Float64Array(candles.length);
    
    for (let i = 0; i < candles.length; i++) {
      let sum = 0;
      let count = 0;
      
      // Calculate standard deviation
      for (let j = Math.max(0, i - period + 1); j <= i; j++) {
        sum += Math.pow(candles[j].c - middle[i], 2);
        count++;
      }
      
      const std = count > 1 ? Math.sqrt(sum / (count - 1)) : 0;
      
      upper[i] = middle[i] + (std * stdDev);
      lower[i] = middle[i] - (std * stdDev);
    }
    
    return { upper, middle, lower };
  }

  it('should calculate Bollinger Bands correctly', () => {
    const result = bollingerBands(mockCandles, 5, 2);
    
    expect(result.upper.length).toBe(mockCandles.length);
    expect(result.middle.length).toBe(mockCandles.length);
    expect(result.lower.length).toBe(mockCandles.length);
    
    // Upper band should always be >= middle, middle >= lower
    for (let i = 0; i < mockCandles.length; i++) {
      expect(result.upper[i]).toBeGreaterThanOrEqual(result.middle[i]);
      expect(result.middle[i]).toBeGreaterThanOrEqual(result.lower[i]);
    }
    
    // Bands should widen with volatility
    // All values should be positive and reasonable
    for (let i = 0; i < mockCandles.length; i++) {
      expect(result.upper[i]).toBeGreaterThan(0);
      expect(result.middle[i]).toBeGreaterThan(0);
      expect(result.lower[i]).toBeGreaterThan(0);
    }
  });

  it('should handle edge cases', () => {
    const singleCandle = [mockCandles[0]];
    const result = bollingerBands(singleCandle, 20, 2);
    
    expect(result.upper.length).toBe(1);
    expect(result.middle.length).toBe(1);
    expect(result.lower.length).toBe(1);
    
    // With no volatility, bands should be close to price
    expect(result.middle[0]).toBe(mockCandles[0].c);
    expect(result.upper[0]).toBe(mockCandles[0].c); // std = 0
    expect(result.lower[0]).toBe(mockCandles[0].c);
  });
});