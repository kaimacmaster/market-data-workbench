import React from 'react';
import { Button } from '../../ui/button';
import { Text } from '../../ui/text';
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
    <div className="flex items-center justify-between p-3 bg-white dark:bg-zinc-950 border border-zinc-950/10 dark:border-white/10 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
      <div 
        className="flex-1 cursor-pointer"
        onClick={() => onSelect(symbol.id)}
      >
        <div className="flex items-center gap-2">
          {isPinned && (
            <span className="text-yellow-500" title="Pinned">📌</span>
          )}
          <div>
            <Text className="font-medium">{symbol.displayName}</Text>
            <Text className="text-sm text-zinc-600 dark:text-zinc-400">{symbol.base}/{symbol.quote}</Text>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2 ml-4">
        <div className="text-right min-w-0">
          <Text className="font-mono text-sm">--</Text>
          <Text className="text-xs text-zinc-500 dark:text-zinc-400">Last: --</Text>
        </div>
        
        <div className="flex gap-1">
          <Button
            outline
            className="px-2 py-1 text-xs"
            onClick={() => isPinned ? onUnpin(symbol.id) : onPin(symbol.id)}
            title={isPinned ? "Unpin" : "Pin"}
          >
            {isPinned ? "📌" : "📍"}
          </Button>
          <Button
            color="red"
            className="px-2 py-1 text-xs"
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