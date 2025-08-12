import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Watchlist } from '../../features/watchlist';
import { symbolCache } from '../../services/cache';
import { defaultSymbols } from '../../shared/utils';

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
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Market Data Workbench</h1>
              <p className="text-gray-600 text-sm">Real-time market data visualization and analysis</p>
            </div>
            <Link
              to="/settings"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              Settings
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Watchlist onSymbolSelect={handleSymbolSelect} />
          </div>
          
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow border p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Welcome</h2>
              <div className="text-gray-600 space-y-3">
                <p>
                  Select a symbol from the watchlist to view detailed market data including:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Real-time candlestick charts</li>
                  <li>Historical OHLCV data</li>
                  <li>Technical indicators</li>
                  <li>Order book depth</li>
                  <li>Recent trades</li>
                </ul>
                <p className="mt-4">
                  Add symbols to your watchlist to get started.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};