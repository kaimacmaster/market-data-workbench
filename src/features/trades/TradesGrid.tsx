import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import type { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community';
import type { Trade } from '../../entities';
import { lightGridTheme, darkGridTheme } from '../../shared/utils/agGridSetup';
import { useTheme } from '../../shared/providers';
import { Text } from '../../ui/text';

interface TradesGridProps {
  trades: Trade[];
  className?: string;
  maxRows?: number;
}

export const TradesGrid: React.FC<TradesGridProps> = React.memo(({
  trades,
  className = '',
  maxRows = 100,
}) => {
  const gridRef = useRef<AgGridReact>(null);
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const previousTradesRef = useRef<Trade[]>([]);
  const { isDark } = useTheme();

  const columnDefs: ColDef[] = useMemo(() => [
    {
      field: 'ts',
      headerName: 'Time',
      width: 80,
      cellClass: (params) => {
        const isDarkMode = document.documentElement.classList.contains('dark');
        return isDarkMode ? 'text-zinc-400 text-sm font-mono' : 'text-gray-600 text-sm font-mono';
      },
      valueFormatter: (params) => {
        const date = new Date(params.value);
        return date.toLocaleTimeString('en-GB', { 
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
      },
    },
    {
      field: 'price',
      headerName: 'Price',
      width: 100,
      type: 'rightAligned',
      cellClass: (params) => {
        const baseClass = 'font-mono font-medium';
        return params.data?.side === 'buy' 
          ? `${baseClass} text-green-700`
          : `${baseClass} text-red-700`;
      },
      valueFormatter: (params) => Number(params.value).toFixed(2),
    },
    {
      field: 'qty',
      headerName: 'Size',
      width: 80,
      type: 'rightAligned',
      cellClass: (params) => {
        const isDarkMode = document.documentElement.classList.contains('dark');
        return isDarkMode ? 'font-mono text-zinc-300' : 'font-mono text-gray-700';
      },
      valueFormatter: (params) => Number(params.value).toFixed(4),
    },
    {
      field: 'side',
      headerName: 'Side',
      width: 60,
      cellClass: (params) => {
        return params.value === 'buy' 
          ? 'text-green-600 font-semibold text-center' 
          : 'text-red-600 font-semibold text-center';
      },
      valueFormatter: (params) => params.value?.toUpperCase(),
    },
  ], []);

  const defaultColDef = useMemo(() => ({
    resizable: false,
    sortable: false,
    suppressHeaderMenuButton: true, // New API instead of suppressMenu
  }), []);

  const gridOptions = useMemo(() => ({
    animateRows: true,
    enableCellTextSelection: false,
    rowSelection: {
      mode: 'singleRow' as const,
      enableClickSelection: false,
    },
    suppressCellFocus: true,
    headerHeight: 32,
    rowHeight: 24,
    suppressHorizontalScroll: true,
    getRowStyle: (params: any) => {
      // Add subtle background for recent trades
      const now = Date.now();
      const tradeAge = now - params.data?.ts;
      
      if (tradeAge < 5000) { // Less than 5 seconds old
        return {
          backgroundColor: params.data?.side === 'buy' ? '#f0fdf4' : '#fef2f2',
          transition: 'background-color 0.3s ease',
        };
      }
      
      return undefined;
    },
  }), []);

  const onGridReady = useCallback((params: GridReadyEvent) => {
    setGridApi(params.api);
  }, []);

  // Update grid when trades change - simplified approach
  useEffect(() => {
    if (!gridApi) {
      previousTradesRef.current = [];
      return;
    }

    // Keep only the most recent trades
    const currentTrades = trades
      .sort((a, b) => b.ts - a.ts) // Most recent first
      .slice(0, maxRows);

    // Check if trades have actually changed
    const previousTradeIds = previousTradesRef.current.map(t => t.id).join(',');
    const currentTradeIds = currentTrades.map(t => t.id).join(',');
    
    if (previousTradeIds !== currentTradeIds) {
      try {
        // Use setGridOption for better performance and less interference
        gridApi.setGridOption('rowData', currentTrades);
        previousTradesRef.current = currentTrades;
      } catch (error) {
        console.error('Error updating trades grid:', error);
      }
    }
  }, [trades, gridApi, maxRows]);

  return (
    <div className={className} style={{ height: 400, width: '100%' }} data-testid="trades-grid">
      {trades.length === 0 ? (
        <div className="h-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-800 border-2 border-dashed border-zinc-300 dark:border-zinc-600 rounded">
          <div className="text-center text-zinc-500 dark:text-zinc-400">
            <div className="text-2xl mb-2">💱</div>
            <Text>No recent trades</Text>
            <Text className="text-sm">Waiting for live feed...</Text>
          </div>
        </div>
      ) : (
        <AgGridReact
          ref={gridRef}
          theme={isDark ? darkGridTheme : lightGridTheme}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          gridOptions={gridOptions}
          onGridReady={onGridReady}
          rowData={[]} // Data is managed via applyTransactionAsync
          getRowId={(params) => params.data?.id || `fallback-${Math.random()}`}
          suppressRowTransform={true}
        />
      )}
      
      {trades.length > 0 && (
        <div className="mt-2 px-2">
          <Text className="text-xs text-zinc-500 dark:text-zinc-400">
            {trades.length} recent trades
            {trades.length >= maxRows && (
              <span className="ml-2 text-orange-600 dark:text-orange-400">
                (showing latest {maxRows})
              </span>
            )}
          </Text>
        </div>
      )}
    </div>
  );
});