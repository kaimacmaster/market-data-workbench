import React, { useState } from 'react';
import { createSymbol } from '../../entities';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Subheading } from '../../ui/heading';
import { Text } from '../../ui/text';
import { Fieldset } from '../../ui/fieldset';

interface AddSymbolFormProps {
  onAdd: (symbol: any) => void;
  onCancel: () => void;
}

export const AddSymbolForm: React.FC<AddSymbolFormProps> = ({ onAdd, onCancel }) => {
  const [formData, setFormData] = useState({
    id: '',
    base: '',
    quote: '',
    displayName: '',
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const symbol = createSymbol({
        ...formData,
        displayName: formData.displayName || `${formData.base}${formData.quote}`,
      });
      
      onAdd(symbol);
      setFormData({ id: '', base: '', quote: '', displayName: '' });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid symbol data');
    }
  };

  const handleChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    if (error) setError(null);
  };

  return (
    <div className="space-y-4 p-4 border border-zinc-950/10 dark:border-white/10 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
      <Subheading>Add New Symbol</Subheading>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <Fieldset>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Text className="text-sm font-medium mb-1">
                Symbol ID
              </Text>
              <Input
                value={formData.id}
                onChange={handleChange('id')}
                placeholder="e.g., BTCUSDT"
                required
              />
            </div>
            <div>
              <Text className="text-sm font-medium mb-1">
                Display Name
              </Text>
              <Input
                value={formData.displayName}
                onChange={handleChange('displayName')}
                placeholder="e.g., Bitcoin/USDT"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <Text className="text-sm font-medium mb-1">
                Base Asset
              </Text>
              <Input
                value={formData.base}
                onChange={handleChange('base')}
                placeholder="e.g., BTC"
                required
              />
            </div>
            <div>
              <Text className="text-sm font-medium mb-1">
                Quote Asset
              </Text>
              <Input
                value={formData.quote}
                onChange={handleChange('quote')}
                placeholder="e.g., USDT"
                required
              />
            </div>
          </div>
        </Fieldset>

        {error && (
          <Text className="text-red-600 dark:text-red-400 text-sm">{error}</Text>
        )}

        <div className="flex gap-2">
          <Button type="submit" color="blue">
            Add Symbol
          </Button>
          <Button type="button" outline onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};