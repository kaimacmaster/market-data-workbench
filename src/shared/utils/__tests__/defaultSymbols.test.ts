import { describe, it, expect } from 'vitest';
import { defaultSymbols } from '../defaultSymbols';

describe('Default Symbols', () => {
  it('should export an array of symbols', () => {
    expect(Array.isArray(defaultSymbols)).toBe(true);
    expect(defaultSymbols.length).toBeGreaterThan(0);
  });

  it('should have valid symbol structure', () => {
    defaultSymbols.forEach(symbol => {
      expect(symbol).toHaveProperty('id');
      expect(symbol).toHaveProperty('base');
      expect(symbol).toHaveProperty('quote');
      expect(symbol).toHaveProperty('displayName');
      expect(symbol).toHaveProperty('status');
      
      expect(typeof symbol.id).toBe('string');
      expect(typeof symbol.base).toBe('string');
      expect(typeof symbol.quote).toBe('string');
      expect(typeof symbol.displayName).toBe('string');
      expect(symbol.status).toBe('active');
      
      expect(symbol.id.length).toBeGreaterThan(0);
      expect(symbol.base.length).toBeGreaterThan(0);
      expect(symbol.quote.length).toBeGreaterThan(0);
    });
  });

  it('should include common symbols', () => {
    const symbolIds = defaultSymbols.map(s => s.id);
    
    expect(symbolIds).toContain('BTCUSDT');
    expect(symbolIds).toContain('ETHUSDT');
    expect(symbolIds).toContain('SOLUSDT');
  });
});