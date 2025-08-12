import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Watchlist } from '../../features/watchlist';
import { symbolCache } from '../../services/cache';
import { defaultSymbols } from '../../shared/utils';
import { Button } from '../../ui/button';
import { Heading, Subheading } from '../../ui/heading';
import { Navbar, NavbarSection, NavbarSpacer } from '../../ui/navbar';
import { Text } from '../../ui/text';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();

  // Initialize default symbols if none exist
  useEffect(() => {
    const initializeDefaultSymbols = async () => {
      try {
        const existingSymbols = await symbolCache.getSymbols();
        if (existingSymbols.length === 0) {
          console.log('Initializing default symbols...');
          for (const symbol of defaultSymbols) {
            await symbolCache.addSymbol(symbol);
          }
        }
      } catch (error) {
        console.error('Error initializing default symbols:', error);
      }
    };

    initializeDefaultSymbols();
  }, []);

  const handleSymbolSelect = (symbolId: string) => {
    navigate(`/symbol/${symbolId}`);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <header className="bg-white dark:bg-zinc-950 shadow-sm border-b border-zinc-950/10 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <Navbar>
            <NavbarSection>
              <div className="flex flex-col">
                <Heading level={1} className="text-xl font-bold">Market Data Workbench</Heading>
                <Text className="text-sm text-zinc-500 dark:text-zinc-400">
                  Real-time market data visualization and analysis
                </Text>
              </div>
            </NavbarSection>
            <NavbarSpacer />
            <NavbarSection>
              <Button href="/settings" outline>
                Settings
              </Button>
            </NavbarSection>
          </Navbar>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Watchlist onSymbolSelect={handleSymbolSelect} />
          </div>
          
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-zinc-950 rounded-lg shadow-sm border border-zinc-950/10 dark:border-white/10 p-6">
              <Subheading className="mb-4">Welcome</Subheading>
              <div className="space-y-3">
                <Text>
                  Select a symbol from the watchlist to view detailed market data including:
                </Text>
                <ul className="list-disc list-inside space-y-1 ml-4 text-zinc-700 dark:text-zinc-300">
                  <li>Real-time candlestick charts</li>
                  <li>Historical OHLCV data</li>
                  <li>Technical indicators</li>
                  <li>Order book depth</li>
                  <li>Recent trades</li>
                </ul>
                <Text className="mt-4">
                  Add symbols to your watchlist to get started.
                </Text>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};