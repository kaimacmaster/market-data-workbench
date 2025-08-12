import { useEffect, useRef, useState, useCallback } from 'react';
import * as Comlink from 'comlink';
import type { IndicatorAPI, Candle, EMAConfig, VWAPConfig, RSIConfig } from '../../services/workers/indicators.worker';

export interface IndicatorResults {
  ema?: Float64Array;
  vwap?: Float64Array;
  rsi?: Float64Array;
  bollinger?: {
    upper: Float64Array;
    middle: Float64Array;
    lower: Float64Array;
  };
}

export const useIndicators = () => {
  const workerRef = useRef<Worker | null>(null);
  const apiRef = useRef<Comlink.Remote<IndicatorAPI> | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Initialize worker
  useEffect(() => {
    const initWorker = async () => {
      try {
        const worker = new Worker(
          new URL('../../services/workers/indicators.worker.ts', import.meta.url),
          { type: 'module' }
        );
        
        workerRef.current = worker;
        apiRef.current = Comlink.wrap<IndicatorAPI>(worker);
        setIsReady(true);
        
        console.log('Indicators worker initialized');
      } catch (error) {
        console.error('Failed to initialize indicators worker:', error);
      }
    };

    initWorker();

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
        apiRef.current = null;
        setIsReady(false);
      }
    };
  }, []);

  const calculateEMA = useCallback(async (candles: Candle[], config: EMAConfig): Promise<Float64Array | null> => {
    if (!apiRef.current || !isReady) return null;
    
    try {
      return await apiRef.current.ema(candles, config);
    } catch (error) {
      console.error('EMA calculation failed:', error);
      return null;
    }
  }, [isReady]);

  const calculateVWAP = useCallback(async (candles: Candle[], config?: VWAPConfig): Promise<Float64Array | null> => {
    if (!apiRef.current || !isReady) return null;
    
    try {
      return await apiRef.current.vwap(candles, config || {});
    } catch (error) {
      console.error('VWAP calculation failed:', error);
      return null;
    }
  }, [isReady]);

  const calculateRSI = useCallback(async (candles: Candle[], config: RSIConfig): Promise<Float64Array | null> => {
    if (!apiRef.current || !isReady) return null;
    
    try {
      return await apiRef.current.rsi(candles, config);
    } catch (error) {
      console.error('RSI calculation failed:', error);
      return null;
    }
  }, [isReady]);

  const calculateBollingerBands = useCallback(async (
    candles: Candle[], 
    period: number = 20, 
    stdDev: number = 2
  ): Promise<{ upper: Float64Array; middle: Float64Array; lower: Float64Array } | null> => {
    if (!apiRef.current || !isReady) return null;
    
    try {
      return await apiRef.current.bollingerBands(candles, period, stdDev);
    } catch (error) {
      console.error('Bollinger Bands calculation failed:', error);
      return null;
    }
  }, [isReady]);

  const calculateAllIndicators = useCallback(async (candles: Candle[]): Promise<IndicatorResults> => {
    if (!apiRef.current || !isReady || candles.length === 0) {
      return {};
    }

    try {
      const [ema, vwap, rsi, bollinger] = await Promise.all([
        apiRef.current.ema(candles, { period: 14 }),
        apiRef.current.vwap(candles, {}),
        apiRef.current.rsi(candles, { period: 14 }),
        apiRef.current.bollingerBands(candles, 20, 2),
      ]);

      return {
        ema,
        vwap,
        rsi,
        bollinger,
      };
    } catch (error) {
      console.error('Batch indicator calculation failed:', error);
      return {};
    }
  }, [isReady]);

  return {
    isReady,
    calculateEMA,
    calculateVWAP,
    calculateRSI,
    calculateBollingerBands,
    calculateAllIndicators,
  };
};