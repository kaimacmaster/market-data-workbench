import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, ConnectionStatus } from '../../shared/ui';
import { CandlestickChart } from '../../features/charts';
import { OrderBookGrid } from '../../features/orderbook';
import { TradesGrid } from '../../features/trades';
import { useCandles, useCacheInfo, useLiveData } from '../../shared/hooks';

export const SymbolPage: React.FC = () => {
  const { symbolId } = useParams<{ symbolId: string }>();
  
  const { data: candles, isLoading, error } = useCandles({
    symbol: symbolId || '',
    interval: '1m',
    limit: 100,
    enabled: Boolean(symbolId),
  });

  const { data: cacheInfo } = useCacheInfo(symbolId || '');
  
  const { 
    connectionState, 
    latestCandle, 
    trades, 
    orderBook,
    reconnect 
  } = useLiveData(symbolId);

  if (!symbolId) {
    return (
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="text-center">
          <p className="text-red-600">Invalid symbol ID</p>
          <Link to="/" className="text-blue-600 hover:underline">
            Return to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                to="/" 
                className="text-gray-600 hover:text-gray-900 transition-colors"
                title="Back to home"
              >
                ← Back
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{symbolId}</h1>
                <p className="text-gray-600 text-sm">Market Data & Analysis</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <ConnectionStatus />
              {connectionState === 'error' && (
                <button 
                  onClick={reconnect}
                  className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Reconnect
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Chart Area - Main content */}
          <div className="lg:col-span-3">
            <Card title={`${symbolId} Chart`}>
              {isLoading ? (
                <div className="h-96 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <div className="animate-spin text-4xl mb-2">⌛</div>
                    <p>Loading chart data...</p>
                    {cacheInfo?.count && (
                      <p className="text-sm">({cacheInfo.count} candles cached)</p>
                    )}
                  </div>
                </div>
              ) : error ? (
                <div className="h-96 flex items-center justify-center">
                  <div className="text-center text-red-500">
                    <div className="text-4xl mb-2">⚠️</div>
                    <p>Failed to load chart data</p>
                    <p className="text-sm">{error.message}</p>
                  </div>
                </div>
              ) : (
                <CandlestickChart 
                  candles={candles || []} 
                  latestCandle={latestCandle}
                  height={400}
                  className="bg-white"
                />
              )}
            </Card>

            {/* Order Book & Trades Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <Card title="Order Book">
                <OrderBookGrid orderBook={orderBook} />
              </Card>

              <Card title="Recent Trades">
                <TradesGrid trades={trades} maxRows={100} />
              </Card>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card title="Symbol Info">
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-600">Symbol</div>
                  <div className="font-mono text-lg">{symbolId}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Status</div>
                  <div className="text-green-600">
                    {isLoading ? 'Loading...' : candles?.length ? 'Active' : 'No Data'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Last Price</div>
                  <div className="font-mono text-lg">
                    {(candles?.length ?? 0) > 0 ? `$${candles![candles!.length - 1].c.toFixed(2)}` : '--'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">24h Change</div>
                  <div className="font-mono">
                    {(candles?.length ?? 0) >= 2 ? 
                      (() => {
                        const current = candles![candles!.length - 1].c;
                        const prev = candles![0].c;
                        const change = ((current - prev) / prev) * 100;
                        return (
                          <span className={change >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                          </span>
                        );
                      })()
                      : '--'
                    }
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Live Data</div>
                  <div className="font-mono text-sm">
                    {connectionState === 'connected' 
                      ? `${trades.length} trades, ${orderBook ? 'Book L2' : 'No book'}`
                      : 'Disconnected'
                    }
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Cached Data</div>
                  <div className="font-mono text-sm">
                    {cacheInfo?.count ? `${cacheInfo.count} candles` : '--'}
                  </div>
                </div>
              </div>
            </Card>

            <Card title="Settings" className="mt-6">
              <div className="text-center text-gray-500">
                <div className="text-2xl mb-2">⚙️</div>
                <p>Settings (M3)</p>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};