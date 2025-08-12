import React, { useState } from 'react';
import { Button, Card } from '../../shared/ui';
import { WatchlistItem } from './WatchlistItem';
import { AddSymbolForm } from './AddSymbolForm';
import { useWatchlist } from './useWatchlist';

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
        <div className="text-center py-4 text-gray-500">Loading...</div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card title="Watchlist">
        <div className="text-center py-4 text-red-600">Error: {error}</div>
      </Card>
    );
  }

  return (
    <Card title="Watchlist">
      <div className="space-y-4" data-testid="watchlist">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-medium text-gray-700">
            {symbols.length} symbols ({pinnedSymbols.length} pinned)
          </h3>
          <Button
            size="sm"
            onClick={() => setShowAddForm(!showAddForm)}
            variant={showAddForm ? "secondary" : "primary"}
          >
            {showAddForm ? "Cancel" : "+ Add Symbol"}
          </Button>
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
            <div>
              <h4 className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
                Pinned
              </h4>
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
            <div>
              {pinnedSymbols.length > 0 && (
                <h4 className="text-xs font-medium text-gray-500 mb-2 mt-4 uppercase tracking-wide">
                  All Symbols
                </h4>
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
            <div className="text-center py-8 text-gray-500">
              <p className="mb-2">No symbols in watchlist</p>
              <Button size="sm" onClick={() => setShowAddForm(true)}>
                Add your first symbol
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};