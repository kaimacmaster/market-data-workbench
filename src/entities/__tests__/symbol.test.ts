import { describe, it, expect } from 'vitest';
import { createSymbol } from '../symbol';

describe('Symbol', () => {
  it('should create a valid symbol', () => {
    const symbolData = {
      id: 'BTCUSDT',
      base: 'BTC',
      quote: 'USDT',
      displayName: 'Bitcoin/Tether',
      status: 'active' as const
    };

    const symbol = createSymbol(symbolData);

    expect(symbol.id).toBe('BTCUSDT');
    expect(symbol.base).toBe('BTC');
    expect(symbol.quote).toBe('USDT');
    expect(symbol.displayName).toBe('Bitcoin/Tether');
    expect(symbol.status).toBe('active');
    // Note: Schema doesn't include createdAt
  });

  it('should create symbol with required fields', () => {
    const symbolData = {
      id: 'ETHBTC',
      base: 'ETH',
      quote: 'BTC',
      displayName: 'Ethereum/Bitcoin'
    };

    const symbol = createSymbol(symbolData);

    expect(symbol.id).toBe('ETHBTC');
    expect(symbol.base).toBe('ETH');
    expect(symbol.quote).toBe('BTC');
    expect(symbol.displayName).toBe('Ethereum/Bitcoin');
    expect(symbol.status).toBe('active');
  });

  it('should throw error for invalid symbol data', () => {
    expect(() => createSymbol({
      id: '',
      base: 'BTC',
      quote: 'USDT'
    })).toThrow();

    expect(() => createSymbol({
      id: 'BTCUSDT',
      base: '',
      quote: 'USDT'
    })).toThrow();

    expect(() => createSymbol({
      id: 'BTCUSDT',
      base: 'BTC',
      quote: ''
    })).toThrow();
  });
});