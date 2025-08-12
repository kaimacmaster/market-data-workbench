import React, { useEffect, useRef, useState, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import type { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import type { Trade } from '../../entities';

interface TradesGridProps {
  trades: Trade[];
  className?: string;
  maxRows?: number;
}

export const TradesGrid: React.FC<TradesGridProps> = ({
  trades,
  className = '',
  maxRows = 100,
}) => {
  const gridRef = useRef<AgGridReact>(null);
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const [displayedTrades, setDisplayedTrades] = useState<Trade[]>([]);

  const columnDefs: ColDef[] = [
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
  ];

  const defaultColDef = {
    resizable: false,
    sortable: false,
    suppressMenu: true,
  };

  const gridOptions = {
    animateRows: true,
    enableCellTextSelection: false,
    suppressRowClickSelection: true,
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
  };

  const onGridReady = useCallback((params: GridReadyEvent) => {
    setGridApi(params.api);
  }, []);

  // Update displayed trades when trades prop changes
  useEffect(() => {
    if (!gridApi) return;

    // Keep only the most recent trades
    const recentTrades = trades
      .sort((a, b) => b.ts - a.ts) // Most recent first
      .slice(0, maxRows);

    setDisplayedTrades(recentTrades);

    try {
      // Use applyTransactionAsync for smooth updates
      if (recentTrades.length > 0) {
        // For trades, we typically want to show newest first
        // and add new trades to the top
        const newTrades = recentTrades.filter(trade => 
          !displayedTrades.some(existing => existing.id === trade.id)
        );

        if (newTrades.length > 0) {
          gridApi.applyTransactionAsync({
            add: newTrades,
            addIndex: 0, // Add to the top
          });

          // Remove excess trades from the bottom to maintain maxRows
          const currentRowCount = gridApi.getDisplayedRowCount();
          if (currentRowCount > maxRows) {
            const rowsToRemove: Trade[] = [];
            for (let i = maxRows; i < currentRowCount; i++) {
              const rowNode = gridApi.getDisplayedRowAtIndex(i);
              if (rowNode) {
                rowsToRemove.push(rowNode.data);
              }
            }
            
            if (rowsToRemove.length > 0) {
              gridApi.applyTransactionAsync({
                remove: rowsToRemove,
              });
            }
          }
        }
      } else {
        // If no trades, clear the grid
        gridApi.applyTransactionAsync({
          remove: displayedTrades,
        });
      }
    } catch (error) {
      console.error('Error updating trades grid:', error);
    }
  }, [trades, gridApi, maxRows, displayedTrades]);

  // Initial data load
  useEffect(() => {
    if (gridApi && displayedTrades.length === 0 && trades.length > 0) {
      const initialTrades = trades
        .sort((a, b) => b.ts - a.ts)
        .slice(0, maxRows);
      
      gridApi.applyTransactionAsync({
        add: initialTrades,
      });
    }
  }, [gridApi, displayedTrades.length, trades, maxRows]);

  return (
    <div className={`ag-theme-alpine ${className}`} style={{ height: 400, width: '100%' }} data-testid="trades-grid">
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
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          gridOptions={gridOptions}
          onGridReady={onGridReady}
          rowData={[]} // Data is managed via applyTransactionAsync
          getRowId={(params) => params.data.id}
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
};