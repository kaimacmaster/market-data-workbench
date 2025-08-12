import React, { useState, useEffect } from 'react';
import { useSettings } from '../../shared/hooks/useSettings';

const Settings: React.FC = () => {
  const {
    settings,
    updateSettings,
    resetSettings,
    isLoading,
  } = useSettings();

  const [localSettings, setLocalSettings] = useState(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = () => {
    updateSettings(localSettings);
  };

  const handleReset = () => {
    resetSettings();
    setLocalSettings(settings);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-500">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Configure your Market Data Workbench preferences</p>
        </div>

        <div className="p-6 space-y-8">
          {/* Theme Settings */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Appearance</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Theme
                </label>
                <select
                  value={localSettings.theme}
                  onChange={(e) => setLocalSettings(prev => ({ 
                    ...prev, 
                    theme: e.target.value as 'light' | 'dark' | 'auto' 
                  }))}
                  className="block w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="auto">Auto</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chart Colors
                </label>
                <select
                  value={localSettings.chartTheme}
                  onChange={(e) => setLocalSettings(prev => ({ 
                    ...prev, 
                    chartTheme: e.target.value as 'default' | 'dark' | 'colorful' 
                  }))}
                  className="block w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="default">Default</option>
                  <option value="dark">Dark</option>
                  <option value="colorful">Colorful</option>
                </select>
              </div>
            </div>
          </section>

          {/* Data Settings */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Data & Performance</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Chart Interval
                </label>
                <select
                  value={localSettings.defaultInterval}
                  onChange={(e) => setLocalSettings(prev => ({ 
                    ...prev, 
                    defaultInterval: e.target.value 
                  }))}
                  className="block w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="1m">1 minute</option>
                  <option value="5m">5 minutes</option>
                  <option value="15m">15 minutes</option>
                  <option value="1h">1 hour</option>
                  <option value="1d">1 day</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Update Throttle (ms)
                </label>
                <input
                  type="number"
                  min="50"
                  max="1000"
                  step="10"
                  value={localSettings.updateThrottle}
                  onChange={(e) => setLocalSettings(prev => ({ 
                    ...prev, 
                    updateThrottle: parseInt(e.target.value) 
                  }))}
                  className="block w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-sm text-gray-500 mt-1">
                  How often to update charts and grids with live data
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cache Size (MB)
                </label>
                <input
                  type="number"
                  min="10"
                  max="500"
                  step="10"
                  value={localSettings.cacheSize}
                  onChange={(e) => setLocalSettings(prev => ({ 
                    ...prev, 
                    cacheSize: parseInt(e.target.value) 
                  }))}
                  className="block w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Maximum size for historical data cache
                </p>
              </div>
            </div>
          </section>

          {/* Indicators Settings */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Default Indicators</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={localSettings.defaultIndicators.ema}
                    onChange={(e) => setLocalSettings(prev => ({
                      ...prev,
                      defaultIndicators: {
                        ...prev.defaultIndicators,
                        ema: e.target.checked,
                      }
                    }))}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">EMA (14)</span>
                </label>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={localSettings.defaultIndicators.vwap}
                    onChange={(e) => setLocalSettings(prev => ({
                      ...prev,
                      defaultIndicators: {
                        ...prev.defaultIndicators,
                        vwap: e.target.checked,
                      }
                    }))}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">VWAP</span>
                </label>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={localSettings.defaultIndicators.rsi}
                    onChange={(e) => setLocalSettings(prev => ({
                      ...prev,
                      defaultIndicators: {
                        ...prev.defaultIndicators,
                        rsi: e.target.checked,
                      }
                    }))}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">RSI (14)</span>
                </label>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={localSettings.defaultIndicators.bollinger}
                    onChange={(e) => setLocalSettings(prev => ({
                      ...prev,
                      defaultIndicators: {
                        ...prev.defaultIndicators,
                        bollinger: e.target.checked,
                      }
                    }))}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Bollinger Bands</span>
                </label>
              </div>
            </div>
          </section>

          {/* Grid Settings */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Grid Display</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Order Book Depth
                </label>
                <input
                  type="number"
                  min="5"
                  max="50"
                  value={localSettings.orderBookDepth}
                  onChange={(e) => setLocalSettings(prev => ({ 
                    ...prev, 
                    orderBookDepth: parseInt(e.target.value) 
                  }))}
                  className="block w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Number of price levels to display
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trades History Limit
                </label>
                <input
                  type="number"
                  min="10"
                  max="1000"
                  value={localSettings.tradesLimit}
                  onChange={(e) => setLocalSettings(prev => ({ 
                    ...prev, 
                    tradesLimit: parseInt(e.target.value) 
                  }))}
                  className="block w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Maximum number of trades to keep in memory
                </p>
              </div>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={localSettings.animateGridUpdates}
                  onChange={(e) => setLocalSettings(prev => ({ 
                    ...prev, 
                    animateGridUpdates: e.target.checked 
                  }))}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Animate grid updates with colors
                </span>
              </label>
            </div>
          </section>
        </div>

        {/* Action Buttons */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            Reset to Defaults
          </button>
          
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;