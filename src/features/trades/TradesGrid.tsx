import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import type { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community';
import type { Trade } from '../../entities';
import { defaultGridTheme } from '../../shared/utils/agGridSetup';

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

  const columnDefs: ColDef[] = useMemo(() => [
    {
      field: 'ts',
      headerName: 'Time',
      width: 80,
      cellClass: 'text-gray-600 text-sm font-mono',
      valueFormatter: (params) => {
        const date = new Date(params.value);
        return date.toLocaleTimeString('en-US', { 
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
      cellClass: 'font-mono text-gray-700',
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
      enableClickSelection: false, // New API instead of suppressRowClickSelection
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
        <div className="h-full flex items-center justify-center bg-gray-50 border-2 border-dashed border-gray-300 rounded">
          <div className="text-center text-gray-500">
            <div className="text-2xl mb-2">💱</div>
            <p>No recent trades</p>
            <p className="text-sm">Waiting for live feed...</p>
          </div>
        </div>
      ) : (
        <AgGridReact
          ref={gridRef}
          theme={defaultGridTheme}
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
        <div className="text-xs text-gray-500 mt-2 px-2">
          {trades.length} recent trades
          {trades.length >= maxRows && (
            <span className="ml-2 text-orange-600">
              (showing latest {maxRows})
            </span>
          )}
        </div>
      )}
    </div>
  );
});