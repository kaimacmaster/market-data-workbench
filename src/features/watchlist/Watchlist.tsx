import React, { useState } from 'react';
import { Card } from '../../shared/ui';
import { WatchlistItem } from './WatchlistItem';
import { AddSymbolForm } from './AddSymbolForm';
import { useWatchlist } from './useWatchlist';
import { Button } from '../../ui/button';
import { Text } from '../../ui/text';

interface WatchlistProps {
  onSymbolSelect: (symbolId: string) => void;
}

export const Watchlist: React.FC<WatchlistProps> = ({ onSymbolSelect }) => {
  const {
    symbols,
    pinnedSymbols,
    loading,
    error,
    addSymbol,
    removeSymbol,
    pinSymbol,
    unpinSymbol,
  } = useWatchlist();

  const [showAddForm, setShowAddForm] = useState(false);

  if (loading) {
    return (
      <Card title="Watchlist">
        <div className="text-center py-4">
          <Text className="text-zinc-500 dark:text-zinc-400">Loading...</Text>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card title="Watchlist">
        <div className="text-center py-4">
          <Text className="text-red-600 dark:text-red-400">Error: {error}</Text>
        </div>
      </Card>
    );
  }

  return (
    <Card title="Watchlist">
      <div className="space-y-4" data-testid="watchlist">
        <div className="flex justify-between items-center">
          <Text className="text-sm font-medium">
            {symbols.length} symbols ({pinnedSymbols.length} pinned)
          </Text>
          {showAddForm ? (
            <Button
              onClick={() => setShowAddForm(false)}
              outline
              className="text-sm"
            >
              Cancel
            </Button>
          ) : (
            <Button
              onClick={() => setShowAddForm(true)}
              color="blue"
              className="text-sm"
            >
              + Add Symbol
            </Button>
          )}
        </div>

        {showAddForm && (
          <AddSymbolForm
            onAdd={(symbol) => {
              addSymbol(symbol);
              setShowAddForm(false);
            }}
            onCancel={() => setShowAddForm(false)}
          />
        )}

        <div className="space-y-2">
          {pinnedSymbols.length > 0 && (
            <div className="space-y-2">
              <Text className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wide">
                Pinned
              </Text>
              {pinnedSymbols.map((symbol) => (
                <WatchlistItem
                  key={symbol.id}
                  symbol={symbol}
                  onRemove={removeSymbol}
                  onPin={pinSymbol}
                  onUnpin={unpinSymbol}
                  onSelect={onSymbolSelect}
                />
              ))}
            </div>
          )}

          {symbols.filter(s => !s.pinnedAt).length > 0 && (
            <div className="space-y-2">
              {pinnedSymbols.length > 0 && (
                <Text className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2 mt-4 uppercase tracking-wide">
                  All Symbols
                </Text>
              )}
              {symbols
                .filter(s => !s.pinnedAt)
                .map((symbol) => (
                  <WatchlistItem
                    key={symbol.id}
                    symbol={symbol}
                    onRemove={removeSymbol}
                    onPin={pinSymbol}
                    onUnpin={unpinSymbol}
                    onSelect={onSymbolSelect}
                  />
                ))}
            </div>
          )}

          {symbols.length === 0 && (
            <div className="text-center py-8">
              <Text className="mb-2 text-zinc-500 dark:text-zinc-400">No symbols in watchlist</Text>
              <Button onClick={() => setShowAddForm(true)} color="blue">
                Add your first symbol
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};