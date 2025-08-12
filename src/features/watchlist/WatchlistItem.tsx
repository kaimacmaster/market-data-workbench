import React from 'react';
import { Button } from '../../shared/ui';
import type { CachedSymbol } from '../../services/cache';

interface WatchlistItemProps {
  symbol: CachedSymbol;
  onRemove: (id: string) => void;
  onPin: (id: string) => void;
  onUnpin: (id: string) => void;
  onSelect: (id: string) => void;
}

export const WatchlistItem: React.FC<WatchlistItemProps> = ({
  symbol,
  onRemove,
  onPin,
  onUnpin,
  onSelect,
}) => {
  const isPinned = Boolean(symbol.pinnedAt);

  return (
    <div className="flex items-center justify-between p-3 bg-white border rounded-lg hover:bg-gray-50 transition-colors">
      <div 
        className="flex-1 cursor-pointer"
        onClick={() => onSelect(symbol.id)}
      >
        <div className="flex items-center gap-2">
          {isPinned && (
            <span className="text-yellow-500" title="Pinned">📌</span>
          )}
          <div>
            <div className="font-medium text-gray-900">{symbol.displayName}</div>
            <div className="text-sm text-gray-600">{symbol.base}/{symbol.quote}</div>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2 ml-4">
        <div className="text-right min-w-0">
          <div className="font-mono text-sm text-gray-900">--</div>
          <div className="text-xs text-gray-500">Last: --</div>
        </div>
        
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => isPinned ? onUnpin(symbol.id) : onPin(symbol.id)}
            title={isPinned ? "Unpin" : "Pin"}
          >
            {isPinned ? "📌" : "📍"}
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => onRemove(symbol.id)}
            title="Remove"
          >
            ✕
          </Button>
        </div>
      </div>
    </div>
  );
};