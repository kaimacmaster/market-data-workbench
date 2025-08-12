import React, { useState } from 'react';
import { Button, Input } from '../../shared/ui';
import { createSymbol } from '../../entities';

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
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-gray-50">
      <h3 className="text-lg font-medium text-gray-900">Add New Symbol</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Symbol ID"
          value={formData.id}
          onChange={handleChange('id')}
          placeholder="e.g., BTCUSDT"
          required
        />
        <Input
          label="Display Name"
          value={formData.displayName}
          onChange={handleChange('displayName')}
          placeholder="e.g., Bitcoin/USDT"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Base Asset"
          value={formData.base}
          onChange={handleChange('base')}
          placeholder="e.g., BTC"
          required
        />
        <Input
          label="Quote Asset"
          value={formData.quote}
          onChange={handleChange('quote')}
          placeholder="e.g., USDT"
          required
        />
      </div>

      {error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}

      <div className="flex gap-2">
        <Button type="submit" variant="primary">
          Add Symbol
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
};