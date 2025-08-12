import { useState, useEffect, useCallback } from 'react';
import { mockLiveFeed } from '../../services/market-feed/mockLiveFeed';
import type { Trade, OrderBook, Candle } from '../../entities';

interface LiveDataState {
  connectionState: 'connecting' | 'connected' | 'disconnected' | 'error';
  latestCandle?: Candle;
  trades: Trade[];
  orderBook?: OrderBook;
}

export const useLiveData = (symbol?: string) => {
  const [state, setState] = useState<LiveDataState>({
    connectionState: 'disconnected',
    trades: [],
  });

  const handleConnectionStateChange = useCallback((event: any) => {
    const newState = event.detail.state;
    setState(prev => ({
      ...prev,
      connectionState: newState,
    }));
    
    // Subscribe to symbol when connection becomes ready
    if (newState === 'connected' && symbol) {
      mockLiveFeed.subscribe(symbol);
    }
  }, [symbol]);

  const handleCandle = useCallback((event: any) => {
    if (event.detail.symbol === symbol) {
      setState(prev => ({
        ...prev,
        latestCandle: event.detail.candle,
      }));
    }
  }, [symbol]);

  const handleTrade = useCallback((event: any) => {
    if (event.detail.symbol === symbol) {
      setState(prev => ({
        ...prev,
        trades: [event.detail.trade, ...prev.trades.slice(0, 99)], // Keep last 100 trades
      }));
    }
  }, [symbol]);

  const handleOrderBook = useCallback((event: any) => {
    if (event.detail.symbol === symbol) {
      setState(prev => ({
        ...prev,
        orderBook: event.detail.orderBook,
      }));
    }
  }, [symbol]);

  // Connect to live feed when hook is used
  useEffect(() => {
    // Add event listeners
    mockLiveFeed.addEventListener('connectionStateChange', handleConnectionStateChange);
    mockLiveFeed.addEventListener('candle', handleCandle);
    mockLiveFeed.addEventListener('trade', handleTrade);
    mockLiveFeed.addEventListener('orderbook', handleOrderBook);

    // Connect if not already connected
    if (mockLiveFeed.connectionState === 'disconnected') {
      mockLiveFeed.connect();
    }

    return () => {
      // Remove event listeners
      mockLiveFeed.removeEventListener('connectionStateChange', handleConnectionStateChange);
      mockLiveFeed.removeEventListener('candle', handleCandle);
      mockLiveFeed.removeEventListener('trade', handleTrade);
      mockLiveFeed.removeEventListener('orderbook', handleOrderBook);
    };
  }, [handleConnectionStateChange, handleCandle, handleTrade, handleOrderBook]);

  // Subscribe to symbol when it changes or connection becomes ready
  useEffect(() => {
    if (symbol) {
      // Subscribe immediately if connected, otherwise it will happen in connectionStateChange handler
      if (mockLiveFeed.connectionState === 'connected') {
        mockLiveFeed.subscribe(symbol);
      }
    }

    return () => {
      if (symbol) {
        mockLiveFeed.unsubscribe(symbol);
      }
    };
  }, [symbol]);

  const reconnect = useCallback(() => {
    mockLiveFeed.disconnect();
    setTimeout(() => mockLiveFeed.connect(), 1000);
  }, []);

  return {
    ...state,
    reconnect,
  };
};

export const useConnectionStatus = () => {
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');

  useEffect(() => {
    const handleConnectionStateChange = (event: any) => {
      setConnectionState(event.detail.state);
    };

    mockLiveFeed.addEventListener('connectionStateChange', handleConnectionStateChange);
    
    // Get initial state
    setConnectionState(mockLiveFeed.connectionState);

    return () => {
      mockLiveFeed.removeEventListener('connectionStateChange', handleConnectionStateChange);
    };
  }, []);

  return connectionState;
};