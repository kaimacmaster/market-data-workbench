import React, { useState, useEffect } from 'react';
import { useSettings } from '../../shared/hooks/useSettings';
import { useTheme } from '../../shared/providers';
import { Heading } from '../../ui/heading';
import { Text } from '../../ui/text';
import { Button } from '../../ui/button';
import { Fieldset, Legend } from '../../ui/fieldset';
import { Select } from '../../ui/select';
import { Input } from '../../ui/input';
import { Checkbox, CheckboxField } from '../../ui/checkbox';

const Settings: React.FC = () => {
  const {
    settings,
    updateSettings,
    resetSettings,
    isLoading,
  } = useSettings();
  
  const { themeMode, setThemeMode, isDark } = useTheme();

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
        <Text className="text-lg text-zinc-500 dark:text-zinc-400">Loading settings...</Text>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900">
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white dark:bg-zinc-950 rounded-lg shadow-sm border border-zinc-950/10 dark:border-white/10">
          <div className="px-6 py-4 border-b border-zinc-950/10 dark:border-white/10">
            <Heading>Settings</Heading>
            <Text className="mt-1 text-zinc-600 dark:text-zinc-400">Configure your Market Data Workbench preferences</Text>
          </div>

          <div className="p-6 space-y-8">
            <Fieldset>
              <Legend>Appearance</Legend>
              <div className="space-y-6 mt-6">
                <div>
                  <Text className="text-sm font-medium mb-2">Theme</Text>
                  <div className="space-y-2">
                    <Select
                      value={themeMode}
                      onChange={(e) => {
                        const newTheme = e.target.value as 'light' | 'dark' | 'auto';
                        setThemeMode(newTheme);
                        setLocalSettings(prev => ({ ...prev, theme: newTheme }));
                      }}
                      className="w-48"
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="auto">Auto</option>
                    </Select>
                    <Text className="text-xs text-zinc-500 dark:text-zinc-400">
                      Currently using: {isDark ? 'Dark' : 'Light'} theme
                      {themeMode === 'auto' && ' (following system preference)'}
                    </Text>
                  </div>
                </div>
                
                <div>
                  <Text className="text-sm font-medium mb-2">Chart Colours</Text>
                  <Select
                    value={localSettings.chartTheme}
                    onChange={(e) => setLocalSettings(prev => ({ 
                      ...prev, 
                      chartTheme: e.target.value as 'default' | 'dark' | 'colorful' 
                    }))}
                    className="w-48"
                  >
                    <option value="default">Default</option>
                    <option value="dark">Dark</option>
                    <option value="colorful">Colourful</option>
                  </Select>
                </div>
              </div>
            </Fieldset>

            {/* Data Settings */}
            <Fieldset>
              <Legend>Data & Performance</Legend>
              <div className="space-y-6 mt-6">
                <div>
                  <Text className="text-sm font-medium mb-2">
                    Default Chart Interval
                  </Text>
                  <Select
                    value={localSettings.defaultInterval}
                    onChange={(e) => setLocalSettings(prev => ({ 
                      ...prev, 
                      defaultInterval: e.target.value 
                    }))}
                    className="w-48"
                  >
                    <option value="1m">1 minute</option>
                    <option value="5m">5 minutes</option>
                    <option value="15m">15 minutes</option>
                    <option value="1h">1 hour</option>
                    <option value="1d">1 day</option>
                  </Select>
                </div>
                
                <div>
                  <Text className="text-sm font-medium mb-2">
                    Update Throttle (ms)
                  </Text>
                  <Input
                    type="number"
                    min="50"
                    max="1000"
                    step="10"
                    value={localSettings.updateThrottle}
                    onChange={(e) => setLocalSettings(prev => ({ 
                      ...prev, 
                      updateThrottle: parseInt(e.target.value) 
                    }))}
                    className="w-48"
                  />
                  <Text className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    How often to update charts and grids with live data
                  </Text>
                </div>
                
                <div>
                  <Text className="text-sm font-medium mb-2">
                    Cache Size (MB)
                  </Text>
                  <Input
                    type="number"
                    min="10"
                    max="500"
                    step="10"
                    value={localSettings.cacheSize}
                    onChange={(e) => setLocalSettings(prev => ({ 
                      ...prev, 
                      cacheSize: parseInt(e.target.value) 
                    }))}
                    className="w-48"
                  />
                  <Text className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    Maximum size for historical data cache
                  </Text>
                </div>
              </div>
            </Fieldset>

            {/* Indicators Settings */}
            <Fieldset>
              <Legend>Default Indicators</Legend>
              <div className="space-y-6 mt-6">
                <div className="grid grid-cols-2 gap-4">
                  <CheckboxField>
                    <Checkbox
                      checked={localSettings.defaultIndicators.ema}
                      onChange={(checked) => setLocalSettings(prev => ({
                        ...prev,
                        defaultIndicators: {
                          ...prev.defaultIndicators,
                          ema: checked,
                        }
                      }))}
                    />
                    <Text className="text-sm font-medium">EMA (14)</Text>
                  </CheckboxField>
                  
                  <CheckboxField>
                    <Checkbox
                      checked={localSettings.defaultIndicators.vwap}
                      onChange={(checked) => setLocalSettings(prev => ({
                        ...prev,
                        defaultIndicators: {
                          ...prev.defaultIndicators,
                          vwap: checked,
                        }
                      }))}
                    />
                    <Text className="text-sm font-medium">VWAP</Text>
                  </CheckboxField>
                  
                  <CheckboxField>
                    <Checkbox
                      checked={localSettings.defaultIndicators.rsi}
                      onChange={(checked) => setLocalSettings(prev => ({
                        ...prev,
                        defaultIndicators: {
                          ...prev.defaultIndicators,
                          rsi: checked,
                        }
                      }))}
                    />
                    <Text className="text-sm font-medium">RSI (14)</Text>
                  </CheckboxField>
                  
                  <CheckboxField>
                    <Checkbox
                      checked={localSettings.defaultIndicators.bollinger}
                      onChange={(checked) => setLocalSettings(prev => ({
                        ...prev,
                        defaultIndicators: {
                          ...prev.defaultIndicators,
                          bollinger: checked,
                        }
                      }))}
                    />
                    <Text className="text-sm font-medium">Bollinger Bands</Text>
                  </CheckboxField>
                </div>
              </div>
            </Fieldset>

            {/* Grid Settings */}
            <Fieldset>
              <Legend>Grid Display</Legend>
              <div className="space-y-6 mt-6">
                <div>
                  <Text className="text-sm font-medium mb-2">
                    Order Book Depth
                  </Text>
                  <Input
                    type="number"
                    min="5"
                    max="50"
                    value={localSettings.orderBookDepth}
                    onChange={(e) => setLocalSettings(prev => ({ 
                      ...prev, 
                      orderBookDepth: parseInt(e.target.value) 
                    }))}
                    className="w-48"
                  />
                  <Text className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    Number of price levels to display
                  </Text>
                </div>
                
                <div>
                  <Text className="text-sm font-medium mb-2">
                    Trades History Limit
                  </Text>
                  <Input
                    type="number"
                    min="10"
                    max="1000"
                    value={localSettings.tradesLimit}
                    onChange={(e) => setLocalSettings(prev => ({ 
                      ...prev, 
                      tradesLimit: parseInt(e.target.value) 
                    }))}
                    className="w-48"
                  />
                  <Text className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    Maximum number of trades to keep in memory
                  </Text>
                </div>
                
                <CheckboxField>
                  <Checkbox
                    checked={localSettings.animateGridUpdates}
                    onChange={(checked) => setLocalSettings(prev => ({ 
                      ...prev, 
                      animateGridUpdates: checked 
                    }))}
                  />
                  <Text className="text-sm font-medium">
                    Animate grid updates with colours
                  </Text>
                </CheckboxField>
              </div>
            </Fieldset>
          </div>

          {/* Action Buttons */}
          <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-950/10 dark:border-white/10 flex justify-between">
            <Button
              onClick={handleReset}
              outline
            >
              Reset to Defaults
            </Button>
            
            <Button
              onClick={handleSave}
              color="blue"
            >
              Save Settings
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;