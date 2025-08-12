import React, { useEffect, useRef, useState } from 'react';
import { createChart, LineStyle, type ISeriesApi } from 'lightweight-charts';
import type { Candle } from '../../entities';
import { useIndicators, type IndicatorResults } from '../../shared/hooks/useIndicators';

interface CandlestickChartProps {
  candles: Candle[];
  latestCandle?: Candle;
  height?: number;
  className?: string;
}

interface IndicatorSettings {
  ema: boolean;
  vwap: boolean;
  rsi: boolean;
  bollinger: boolean;
}

export const CandlestickChart: React.FC<CandlestickChartProps> = ({
  candles,
  latestCandle,
  height = 400,
  className = '',
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const candleSeriesRef = useRef<any>(null);
  const indicatorSeriesRef = useRef<{
    ema?: ISeriesApi<'Line'>;
    vwap?: ISeriesApi<'Line'>;
    rsi?: ISeriesApi<'Line'>;
    bollingerUpper?: ISeriesApi<'Line'>;
    bollingerMiddle?: ISeriesApi<'Line'>;
    bollingerLower?: ISeriesApi<'Line'>;
  }>({});
  
  const [indicators, setIndicators] = useState<IndicatorSettings>({
    ema: true,
    vwap: true,
    rsi: false,
    bollinger: false,
  });
  const [indicatorData, setIndicatorData] = useState<IndicatorResults>({});
  
  const { calculateAllIndicators, isReady } = useIndicators();

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    try {
      const chart = createChart(chartContainerRef.current, {
        width: chartContainerRef.current.clientWidth,
        height,
        layout: {
          background: { color: '#ffffff' },
          textColor: '#333',
        },
        grid: {
          vertLines: { color: '#f0f0f0' },
          horzLines: { color: '#f0f0f0' },
        },
        timeScale: {
          rightOffset: 12,
          barSpacing: 3,
          visible: true,
          timeVisible: true,
          secondsVisible: false,
        },
        rightPriceScale: {
          borderColor: '#f0f0f0',
        },
      });

      // Try to add candlestick series with different approaches
      let candlestickSeries = null;
      
      try {
        // Approach 1: Direct method call
        if ((chart as any).addCandlestickSeries) {
          candlestickSeries = (chart as any).addCandlestickSeries({
            upColor: '#4caf50',
            downColor: '#f44336',
            borderDownColor: '#f44336',
            borderUpColor: '#4caf50',
            wickDownColor: '#f44336',
            wickUpColor: '#4caf50',
          });
        }
      } catch (e1) {
        try {
          // Approach 2: Generic addSeries method
          if ((chart as any).addSeries) {
            candlestickSeries = (chart as any).addSeries('candlestick' as any, {
              upColor: '#4caf50',
              downColor: '#f44336',
              borderDownColor: '#f44336',
              borderUpColor: '#4caf50',
              wickDownColor: '#f44336',
              wickUpColor: '#4caf50',
            });
          }
        } catch (e2) {
          console.error('Unable to create candlestick series');
        }
      }

      chartRef.current = chart;
      candleSeriesRef.current = candlestickSeries;

      // Initialize indicator series
      if (indicators.ema) {
        try {
          indicatorSeriesRef.current.ema = (chart as any).addLineSeries({
            color: '#2196F3',
            lineWidth: 2,
            title: 'EMA (14)',
          });
        } catch (e) {
          console.warn('Could not add EMA series:', e);
        }
      }
      
      if (indicators.vwap) {
        try {
          indicatorSeriesRef.current.vwap = (chart as any).addLineSeries({
            color: '#FF9800',
            lineWidth: 2,
            title: 'VWAP',
          });
        } catch (e) {
          console.warn('Could not add VWAP series:', e);
        }
      }
      
      if (indicators.bollinger) {
        try {
          indicatorSeriesRef.current.bollingerUpper = (chart as any).addLineSeries({
            color: '#9C27B0',
            lineWidth: 1,
            lineStyle: LineStyle.Dashed,
            title: 'BB Upper',
          });
          indicatorSeriesRef.current.bollingerMiddle = (chart as any).addLineSeries({
            color: '#9C27B0',
            lineWidth: 1,
            title: 'BB Middle',
          });
          indicatorSeriesRef.current.bollingerLower = (chart as any).addLineSeries({
            color: '#9C27B0',
            lineWidth: 1,
            lineStyle: LineStyle.Dashed,
            title: 'BB Lower',
          });
        } catch (e) {
          console.warn('Could not add Bollinger Bands series:', e);
        }
      }

      // Handle resize
      const handleResize = () => {
        if (chartContainerRef.current && chartRef.current) {
          chartRef.current.applyOptions({
            width: chartContainerRef.current.clientWidth,
          });
        }
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        if (chartRef.current) {
          chartRef.current.remove();
        }
        indicatorSeriesRef.current = {};
      };
    } catch (error) {
      console.error('Error creating chart:', error);
    }
  }, [height, indicators]);

  // Update chart data when candles change
  useEffect(() => {
    if (!candleSeriesRef.current || candles.length === 0) {
      return;
    }

    try {
      // Convert candles to lightweight charts format
      const chartData = candles.map(candle => ({
        time: Math.floor(candle.t / 1000), // Convert to seconds
        open: candle.o,
        high: candle.h,
        low: candle.l,
        close: candle.c,
      }));

      // Update series data
      if (candleSeriesRef.current.setData) {
        candleSeriesRef.current.setData(chartData);
      }

      // Fit content
      if (chartRef.current && chartRef.current.timeScale) {
        chartRef.current.timeScale().fitContent();
      }
    } catch (error) {
      console.error('Error updating chart data:', error);
    }
  }, [candles]);

  // Calculate indicators when candles change
  useEffect(() => {
    if (!isReady || candles.length === 0) return;
    
    const calculateIndicators = async () => {
      try {
        const results = await calculateAllIndicators(candles);
        setIndicatorData(results);
      } catch (error) {
        console.error('Error calculating indicators:', error);
      }
    };
    
    calculateIndicators();
  }, [candles, calculateAllIndicators, isReady]);

  // Update indicator series when data changes
  useEffect(() => {
    if (!chartRef.current || candles.length === 0) return;
    
    try {
      const timeData = candles.map((candle) => ({
        time: Math.floor(candle.t / 1000) as any,
        value: 0, // Will be overridden
      }));
      
      // Update EMA
      if (indicators.ema && indicatorData.ema && indicatorSeriesRef.current.ema) {
        const emaData = timeData.map((point, index) => ({
          ...point,
          value: indicatorData.ema![index],
        }));
        (indicatorSeriesRef.current.ema as any).setData(emaData);
      }
      
      // Update VWAP
      if (indicators.vwap && indicatorData.vwap && indicatorSeriesRef.current.vwap) {
        const vwapData = timeData.map((point, index) => ({
          ...point,
          value: indicatorData.vwap![index],
        }));
        (indicatorSeriesRef.current.vwap as any).setData(vwapData);
      }
      
      // Update Bollinger Bands
      if (indicators.bollinger && indicatorData.bollinger) {
        if (indicatorSeriesRef.current.bollingerUpper) {
          const upperData = timeData.map((point, index) => ({
            ...point,
            value: indicatorData.bollinger!.upper[index],
          }));
          (indicatorSeriesRef.current.bollingerUpper as any).setData(upperData);
        }
        
        if (indicatorSeriesRef.current.bollingerMiddle) {
          const middleData = timeData.map((point, index) => ({
            ...point,
            value: indicatorData.bollinger!.middle[index],
          }));
          (indicatorSeriesRef.current.bollingerMiddle as any).setData(middleData);
        }
        
        if (indicatorSeriesRef.current.bollingerLower) {
          const lowerData = timeData.map((point, index) => ({
            ...point,
            value: indicatorData.bollinger!.lower[index],
          }));
          (indicatorSeriesRef.current.bollingerLower as any).setData(lowerData);
        }
      }
    } catch (error) {
      console.error('Error updating indicator series:', error);
    }
  }, [indicatorData, indicators, candles]);

  // Update chart with latest live candle
  useEffect(() => {
    if (!candleSeriesRef.current || !latestCandle) {
      return;
    }

    try {
      // Convert latest candle to chart format
      const liveCandle = {
        time: Math.floor(latestCandle.t / 1000),
        open: latestCandle.o,
        high: latestCandle.h,
        low: latestCandle.l,
        close: latestCandle.c,
      };

      // Update the chart with live data
      if (candleSeriesRef.current.update) {
        candleSeriesRef.current.update(liveCandle);
        console.log('Updated chart with live candle:', liveCandle);
      }
    } catch (error) {
      console.error('Error updating chart with live candle:', error);
    }
  }, [latestCandle]);

  return (
    <div className={`relative ${className}`}>
      {/* Indicator Controls */}
      <div className="absolute top-2 left-2 z-10 bg-white/90 backdrop-blur rounded-lg p-2 shadow-sm border">
        <div className="flex gap-3 text-sm">
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="checkbox"
              checked={indicators.ema}
              onChange={(e) => setIndicators(prev => ({ ...prev, ema: e.target.checked }))}
              className="w-3 h-3"
            />
            <span className="text-blue-600">EMA</span>
          </label>
          
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="checkbox"
              checked={indicators.vwap}
              onChange={(e) => setIndicators(prev => ({ ...prev, vwap: e.target.checked }))}
              className="w-3 h-3"
            />
            <span className="text-orange-600">VWAP</span>
          </label>
          
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="checkbox"
              checked={indicators.bollinger}
              onChange={(e) => setIndicators(prev => ({ ...prev, bollinger: e.target.checked }))}
              className="w-3 h-3"
            />
            <span className="text-purple-600">BB</span>
          </label>
          
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="checkbox"
              checked={indicators.rsi}
              onChange={(e) => setIndicators(prev => ({ ...prev, rsi: e.target.checked }))}
              className="w-3 h-3"
            />
            <span className="text-red-600">RSI</span>
          </label>
        </div>
      </div>
      
      <div
        ref={chartContainerRef}
        className="w-full"
        style={{ height: `${height}px` }}
      />
      
      {candles.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
          <div className="text-center text-gray-500">
            <div className="text-4xl mb-2">📈</div>
            <p>No chart data available</p>
            <p className="text-sm">Add some symbols to your watchlist</p>
          </div>
        </div>
      )}
    </div>
  );
};