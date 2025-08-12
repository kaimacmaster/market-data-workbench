import React, { useEffect, useRef, useState } from 'react';
import { createChart, LineStyle, LineSeries, CandlestickSeries, type ISeriesApi } from 'lightweight-charts';
import type { Candle } from '../../entities';
import { useIndicators, type IndicatorResults } from '../../shared/hooks/useIndicators';
import { useTheme } from '../../shared/providers';
import { Checkbox, CheckboxField } from '../../ui/checkbox';
import { Text } from '../../ui/text';

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
  const { isDark } = useTheme();

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    try {
      const chart = createChart(chartContainerRef.current, {
        width: chartContainerRef.current.clientWidth,
        height,
        layout: {
          background: { color: isDark ? '#0a0a0b' : '#ffffff' },
          textColor: isDark ? '#fafafa' : '#333',
        },
        grid: {
          vertLines: { color: isDark ? '#27272a' : '#f0f0f0' },
          horzLines: { color: isDark ? '#27272a' : '#f0f0f0' },
        },
        timeScale: {
          rightOffset: 12,
          barSpacing: 3,
          visible: true,
          timeVisible: true,
          secondsVisible: false,
        },
        rightPriceScale: {
          borderColor: isDark ? '#27272a' : '#f0f0f0',
        },
      });

      // Try to add candlestick series with different approaches
      let candlestickSeries = null;
      
      try {
        // Use the proper API with imported CandlestickSeries
        candlestickSeries = chart.addSeries(CandlestickSeries, {
          upColor: '#4caf50',
          downColor: '#f44336',
          borderDownColor: '#f44336',
          borderUpColor: '#4caf50',
          wickDownColor: '#f44336',
          wickUpColor: '#4caf50',
        });
      } catch (e1) {
        console.error('Unable to create candlestick series:', e1);
      }

      chartRef.current = chart;
      candleSeriesRef.current = candlestickSeries;

      // Initialize indicator series
      if (indicators.ema) {
        try {
          indicatorSeriesRef.current.ema = chart.addSeries(LineSeries, {
            color: '#2196F3',
            lineWidth: 2,
          });
        } catch (e) {
          console.warn('Could not add EMA series:', e);
        }
      }
      
      if (indicators.vwap) {
        try {
          indicatorSeriesRef.current.vwap = chart.addSeries(LineSeries, {
            color: '#FF9800',
            lineWidth: 2,
          });
        } catch (e) {
          console.warn('Could not add VWAP series:', e);
        }
      }
      
      if (indicators.bollinger) {
        try {
          indicatorSeriesRef.current.bollingerUpper = chart.addSeries(LineSeries, {
            color: '#9C27B0',
            lineWidth: 1,
            lineStyle: LineStyle.Dashed,
          });
          indicatorSeriesRef.current.bollingerMiddle = chart.addSeries(LineSeries, {
            color: '#9C27B0',
            lineWidth: 1,
          });
          indicatorSeriesRef.current.bollingerLower = chart.addSeries(LineSeries, {
            color: '#9C27B0',
            lineWidth: 1,
            lineStyle: LineStyle.Dashed,
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
  }, [height, indicators, isDark]);

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
      <div className="absolute top-2 left-2 z-10 bg-white/90 dark:bg-zinc-900/90 backdrop-blur rounded-lg p-3 shadow-sm border border-zinc-950/10 dark:border-white/10">
        <div className="flex flex-wrap gap-3 text-sm">
          <CheckboxField>
            <Checkbox
              checked={indicators.ema}
              onChange={(checked) => setIndicators(prev => ({ ...prev, ema: checked }))}
            />
            <Text className="text-blue-600 dark:text-blue-400 font-medium">EMA</Text>
          </CheckboxField>
          
          <CheckboxField>
            <Checkbox
              checked={indicators.vwap}
              onChange={(checked) => setIndicators(prev => ({ ...prev, vwap: checked }))}
            />
            <Text className="text-orange-600 dark:text-orange-400 font-medium">VWAP</Text>
          </CheckboxField>
          
          <CheckboxField>
            <Checkbox
              checked={indicators.bollinger}
              onChange={(checked) => setIndicators(prev => ({ ...prev, bollinger: checked }))}
            />
            <Text className="text-purple-600 dark:text-purple-400 font-medium">BB</Text>
          </CheckboxField>
          
          <CheckboxField>
            <Checkbox
              checked={indicators.rsi}
              onChange={(checked) => setIndicators(prev => ({ ...prev, rsi: checked }))}
            />
            <Text className="text-red-600 dark:text-red-400 font-medium">RSI</Text>
          </CheckboxField>
        </div>
      </div>
      
      <div
        ref={chartContainerRef}
        className="w-full"
        style={{ height: `${height}px` }}
      />
      
      {candles.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-50 dark:bg-zinc-800 border-2 border-dashed border-zinc-300 dark:border-zinc-600 rounded-lg">
          <div className="text-center text-zinc-500 dark:text-zinc-400">
            <div className="text-4xl mb-2">📈</div>
            <Text>No chart data available</Text>
            <Text className="text-sm">Add some symbols to your watchlist</Text>
          </div>
        </div>
      )}
    </div>
  );
};