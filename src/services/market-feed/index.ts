import { mockMarketFeed } from './mockFeed';
import { mockLiveFeed } from './mockLiveFeed';
import { binanceFeed } from './binanceFeed';
import { binanceLiveFeed } from './binanceLiveFeed';

// For M1, we used historical mock data. For M2, we add live WebSocket feeds
const FEED_TYPE = import.meta.env.VITE_FEED || 'mock';

export const marketFeed = (() => {
  switch (FEED_TYPE) {
    case 'mock':
      return mockMarketFeed;
    case 'binance':
      return binanceFeed;
    default:
      console.warn(`Unknown feed type: ${FEED_TYPE}, using mock feed`);
      return mockMarketFeed;
  }
})();

// Export live feed for M2 functionality
export const liveFeed = (() => {
  switch (FEED_TYPE) {
    case 'binance':
      return binanceLiveFeed;
    default:
      return mockLiveFeed;
  }
})();

export * from './mockFeed';
export * from './mockLiveFeed';
export * from './binanceFeed';
export * from './binanceLiveFeed';
export * from './websocketClient';