import { describe, it, expect } from 'vitest';
import { createCandle } from '../candle';

describe('Candle', () => {
  it('should create a valid candle', () => {
    const candleData = {
      t: 1672531200000, // timestamp
      o: 100,           // open
      h: 110,           // high
      l: 95,            // low
      c: 105,           // close
      v: 1000           // volume
    };

    const candle = createCandle(candleData);

    expect(candle.t).toBe(1672531200000);
    expect(candle.o).toBe(100);
    expect(candle.h).toBe(110);
    expect(candle.l).toBe(95);
    expect(candle.c).toBe(105);
    expect(candle.v).toBe(1000);
  });

  it('should throw error for invalid candle data', () => {
    expect(() => createCandle({
      t: 'invalid',
      o: 100,
      h: 110,
      l: 95,
      c: 105,
      v: 1000
    })).toThrow();

    expect(() => createCandle({
      o: 100,
      h: 110,
      l: 95,
      c: 105,
      v: 1000
      // missing 't' field
    })).toThrow();

    expect(() => createCandle({
      t: 1672531200000,
      o: 100,
      h: 110,
      l: 95,
      c: 105
      // missing 'v' field
    })).toThrow();
  });
});