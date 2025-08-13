import { useState, useEffect, useCallback } from 'react';
import { liveFeed } from '../../services/market-feed';
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
      liveFeed.subscribe(symbol);
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
    liveFeed.addEventListener('connectionStateChange', handleConnectionStateChange);
    liveFeed.addEventListener('candle', handleCandle);
    liveFeed.addEventListener('trade', handleTrade);
    liveFeed.addEventListener('orderbook', handleOrderBook);

    // Connect if not already connected
    if (liveFeed.connectionState === 'disconnected') {
      liveFeed.connect();
    }

    return () => {
      // Remove event listeners
      liveFeed.removeEventListener('connectionStateChange', handleConnectionStateChange);
      liveFeed.removeEventListener('candle', handleCandle);
      liveFeed.removeEventListener('trade', handleTrade);
      liveFeed.removeEventListener('orderbook', handleOrderBook);
    };
  }, [handleConnectionStateChange, handleCandle, handleTrade, handleOrderBook]);

  // Subscribe to symbol when it changes or connection becomes ready
  useEffect(() => {
    if (symbol) {
      // Subscribe immediately if connected, otherwise it will happen in connectionStateChange handler
      if (liveFeed.connectionState === 'connected') {
        liveFeed.subscribe(symbol);
      }
    }

    return () => {
      if (symbol) {
        liveFeed.unsubscribe(symbol);
      }
    };
  }, [symbol]);

  const reconnect = useCallback(() => {
    liveFeed.disconnect();
    setTimeout(() => liveFeed.connect(), 1000);
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

    liveFeed.addEventListener('connectionStateChange', handleConnectionStateChange);
    
    // Get initial state
    setConnectionState(liveFeed.connectionState);

    return () => {
      liveFeed.removeEventListener('connectionStateChange', handleConnectionStateChange);
    };
  }, []);

  return connectionState;
};