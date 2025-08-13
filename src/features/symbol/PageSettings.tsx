import React, { useState, useEffect } from 'react';
import { useSettings } from '../../shared/hooks/useSettings';
import { Text } from '../../ui/text';
import { Select } from '../../ui/select';
import { Input } from '../../ui/input';
import { Checkbox, CheckboxField } from '../../ui/checkbox';
import { Fieldset, Legend } from '../../ui/fieldset';
import { Button } from '../../ui/button';

interface PageSettingsProps {
  className?: string;
}

export const PageSettings: React.FC<PageSettingsProps> = ({ className = '' }) => {
  const { settings, updateSettings } = useSettings();
  const [localSettings, setLocalSettings] = useState({
    defaultInterval: settings.defaultInterval,
    updateThrottle: settings.updateThrottle,
    orderBookDepth: settings.orderBookDepth,
    tradesLimit: settings.tradesLimit,
    animateGridUpdates: settings.animateGridUpdates,
    defaultIndicators: { ...settings.defaultIndicators },
  });

  // Update local settings when global settings change
  useEffect(() => {
    setLocalSettings({
      defaultInterval: settings.defaultInterval,
      updateThrottle: settings.updateThrottle,
      orderBookDepth: settings.orderBookDepth,
      tradesLimit: settings.tradesLimit,
      animateGridUpdates: settings.animateGridUpdates,
      defaultIndicators: { ...settings.defaultIndicators },
    });
  }, [settings]);

  const handleSave = () => {
    updateSettings(localSettings);
  };

  const handleReset = () => {
    setLocalSettings({
      defaultInterval: settings.defaultInterval,
      updateThrottle: settings.updateThrottle,
      orderBookDepth: settings.orderBookDepth,
      tradesLimit: settings.tradesLimit,
      animateGridUpdates: settings.animateGridUpdates,
      defaultIndicators: { ...settings.defaultIndicators },
    });
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <Fieldset>
        <Legend>Chart Settings</Legend>
        <div className="space-y-4 mt-4">
          <div>
            <Text className="text-sm font-medium mb-2">
              Chart Interval
            </Text>
            <Select
              value={localSettings.defaultInterval}
              onChange={(e) => setLocalSettings(prev => ({ 
                ...prev, 
                defaultInterval: e.target.value 
              }))}
              className="w-full"
            >
              <option value="1m">1 minute</option>
              <option value="5m">5 minutes</option>
              <option value="15m">15 minutes</option>
              <option value="1h">1 hour</option>
              <option value="1d">1 day</option>
            </Select>
          </div>

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

      <Fieldset>
        <Legend>Performance</Legend>
        <div className="space-y-4 mt-4">
          <div>
            <Text className="text-sm font-medium mb-2">
              Update Speed (ms)
            </Text>
            <Input
              type="number"
              min="50"
              max="1000"
              step="10"
              value={localSettings.updateThrottle}
              onChange={(e) => setLocalSettings(prev => ({ 
                ...prev, 
                updateThrottle: parseInt(e.target.value) || 50
              }))}
              className="w-full"
            />
            <Text className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              How often to update charts and grids with live data (lower = faster updates)
            </Text>
          </div>
        </div>
      </Fieldset>

      <Fieldset>
        <Legend>Grid Display</Legend>
        <div className="space-y-4 mt-4">
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
                orderBookDepth: parseInt(e.target.value) || 5
              }))}
              className="w-full"
            />
            <Text className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Number of price levels to display in order book
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
                tradesLimit: parseInt(e.target.value) || 10
              }))}
              className="w-full"
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

      <div className="flex gap-2 pt-4">
        <Button onClick={handleSave} color="blue">
          Apply Settings
        </Button>
        <Button onClick={handleReset} outline>
          Reset
        </Button>
      </div>
    </div>
  );
};