import * as Comlink from 'comlink';

// Types for indicator calculations
export type Candle = Readonly<{
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}>;

export type EMAConfig = Readonly<{ period: number }>;
export type VWAPConfig = Readonly<{ period?: number }>;
export type RSIConfig = Readonly<{ period: number }>;

// Exponential Moving Average
function ema(candles: Candle[], { period }: EMAConfig): Float64Array {
  const k = 2 / (period + 1);
  const out = new Float64Array(candles.length);
  
  if (candles.length === 0) return out;
  
  let prev = candles[0]?.c ?? 0;
  
  for (let i = 0; i < candles.length; i++) {
    prev = i === 0 ? candles[i].c : candles[i].c * k + prev * (1 - k);
    out[i] = prev;
  }
  
  return out; // Transferable
}

// Volume Weighted Average Price
function vwap(candles: Candle[], _config: VWAPConfig = {}): Float64Array {
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

// Relative Strength Index
function rsi(candles: Candle[], { period }: RSIConfig): Float64Array {
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

// Simple Moving Average (helper function)
function sma(candles: Candle[], period: number): Float64Array {
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

// Bollinger Bands
function bollingerBands(candles: Candle[], period: number = 20, stdDev: number = 2): {
  upper: Float64Array;
  middle: Float64Array;
  lower: Float64Array;
} {
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

// Export API for Comlink
const api = {
  ema,
  vwap,
  rsi,
  sma,
  bollingerBands,
};

export type IndicatorAPI = typeof api;

Comlink.expose(api);