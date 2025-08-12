import React from 'react';
import { useParams } from 'react-router-dom';
import { Card, ConnectionStatus } from '../../shared/ui';
import { CandlestickChart } from '../../features/charts';
import { OrderBookGrid } from '../../features/orderbook';
import { TradesGrid } from '../../features/trades';
import { PageSettings } from '../../features/symbol/PageSettings';
import { useCandles, useCacheInfo, useLiveData } from '../../shared/hooks';
import { useSettings } from '../../shared/hooks/useSettings';
import { Button } from '../../ui/button';
import { Heading } from '../../ui/heading';
import { Navbar, NavbarSection, NavbarSpacer } from '../../ui/navbar';
import { Text } from '../../ui/text';
import { Badge } from '../../ui/badge';

export const SymbolPage: React.FC = () => {
  const { symbolId } = useParams<{ symbolId: string }>();
  const { settings } = useSettings();
  
  const { data: candles, isLoading, error } = useCandles({
    symbol: symbolId || '',
    interval: settings.defaultInterval,
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
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 p-4">
        <div className="text-center">
          <Text className="text-red-600 dark:text-red-400">Invalid symbol ID</Text>
          <Button href="/" className="mt-4">
            Return to home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <header className="bg-white dark:bg-zinc-950 shadow-sm border-b border-zinc-950/10 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <Navbar>
            <NavbarSection>
              <Button href="/" outline className="mr-4">
                ← Back
              </Button>
              <div className="flex flex-col">
                <Heading level={1} className="text-xl font-bold">{symbolId}</Heading>
                <Text className="text-sm text-zinc-500 dark:text-zinc-400">
                  Market Data & Analysis
                </Text>
              </div>
            </NavbarSection>
            <NavbarSpacer />
            <NavbarSection className="gap-3">
              <ConnectionStatus />
              {connectionState === 'error' && (
                <Button onClick={reconnect} color="blue" className="text-sm">
                  Reconnect
                </Button>
              )}
            </NavbarSection>
          </Navbar>
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
                />
              )}
            </Card>

            {/* Order Book & Trades Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <Card title="Order Book">
                <OrderBookGrid orderBook={orderBook} />
              </Card>

              <Card title="Recent Trades">
                <TradesGrid trades={trades} maxRows={settings.tradesLimit} />
              </Card>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card title="Symbol Info">
              <div className="space-y-4">
                <div>
                  <Text className="text-sm text-zinc-500 dark:text-zinc-400">Symbol</Text>
                  <Text className="font-mono text-lg font-medium">{symbolId}</Text>
                </div>
                <div>
                  <Text className="text-sm text-zinc-500 dark:text-zinc-400">Status</Text>
                  <Badge color={isLoading ? 'amber' : candles?.length ? 'green' : 'zinc'}>
                    {isLoading ? 'Loading...' : candles?.length ? 'Active' : 'No Data'}
                  </Badge>
                </div>
                <div>
                  <Text className="text-sm text-zinc-500 dark:text-zinc-400">Last Price</Text>
                  <Text className="font-mono text-lg font-medium">
                    {(candles?.length ?? 0) > 0 ? `£${candles![candles!.length - 1].c.toFixed(2)}` : '--'}
                  </Text>
                </div>
                <div>
                  <Text className="text-sm text-zinc-500 dark:text-zinc-400">24hr Change</Text>
                  <Text className="font-mono">
                    {(candles?.length ?? 0) >= 2 ? 
                      (() => {
                        const current = candles![candles!.length - 1].c;
                        const prev = candles![0].c;
                        const change = ((current - prev) / prev) * 100;
                        return (
                          <Badge color={change >= 0 ? 'green' : 'red'}>
                            {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                          </Badge>
                        );
                      })()
                      : '--'
                    }
                  </Text>
                </div>
                <div>
                  <Text className="text-sm text-zinc-500 dark:text-zinc-400">Live Data</Text>
                  <Text className="font-mono text-sm">
                    {connectionState === 'connected' 
                      ? `${trades.length} trades, ${orderBook ? 'Book L2' : 'No book'}`
                      : 'Disconnected'
                    }
                  </Text>
                </div>
                <div>
                  <Text className="text-sm text-zinc-500 dark:text-zinc-400">Cached Data</Text>
                  <Text className="font-mono text-sm">
                    {cacheInfo?.count ? `${cacheInfo.count} candles` : '--'}
                  </Text>
                </div>
              </div>
            </Card>

            <Card title="Settings" className="mt-6">
              <PageSettings />
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};