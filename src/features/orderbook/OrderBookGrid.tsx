import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import type { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community';
import type { OrderBook, BookEntry } from '../../entities';
import { defaultGridTheme } from '../../shared/utils/agGridSetup';

interface OrderBookRow extends BookEntry {
  id: string;
  side: 'bid' | 'ask';
  total?: number;
}

interface OrderBookGridProps {
  orderBook?: OrderBook;
  className?: string;
}

export const OrderBookGrid: React.FC<OrderBookGridProps> = React.memo(({
  orderBook,
  className = '',
}) => {
  const gridRef = useRef<AgGridReact>(null);
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const lastOrderBookRef = useRef<OrderBook | null>(null);

  const columnDefs: ColDef[] = useMemo(() => [
    {
      field: 'side',
      headerName: 'Side',
      width: 60,
      cellClass: (params) => {
        return params.value === 'bid' 
          ? 'text-green-600 font-medium' 
          : 'text-red-600 font-medium';
      },
      valueFormatter: (params) => params.value === 'bid' ? 'BID' : 'ASK',
    },
    {
      field: 'price',
      headerName: 'Price',
      width: 100,
      type: 'rightAligned',
      cellClass: (params) => {
        return params.data?.side === 'bid' 
          ? 'bg-green-50 text-green-900 font-mono' 
          : 'bg-red-50 text-red-900 font-mono';
      },
      valueFormatter: (params) => Number(params.value).toFixed(2),
    },
    {
      field: 'qty',
      headerName: 'Size',
      width: 100,
      type: 'rightAligned',
      cellClass: 'font-mono text-gray-700',
      valueFormatter: (params) => Number(params.value).toFixed(4),
    },
    {
      field: 'total',
      headerName: 'Total',
      width: 100,
      type: 'rightAligned',
      cellClass: 'font-mono text-gray-600 text-sm',
      valueFormatter: (params) => params.value ? Number(params.value).toFixed(2) : '',
    },
  ], []);

  const defaultColDef = useMemo(() => ({
    resizable: false,
    sortable: false,
    suppressHeaderMenuButton: true, // New API instead of suppressMenu
  }), []);

  const gridOptions = useMemo(() => ({
    animateRows: false,
    enableCellTextSelection: false,
    rowSelection: {
      mode: 'singleRow' as const,
      enableClickSelection: false, // New API instead of suppressRowClickSelection
    },
    suppressCellFocus: true,
    headerHeight: 32,
    rowHeight: 24,
    suppressHorizontalScroll: false,
    alwaysShowVerticalScroll: false,
  }), []);

  const onGridReady = useCallback((params: GridReadyEvent) => {
    setGridApi(params.api);
  }, []);

  const transformOrderBookToRows = useCallback((book: OrderBook): OrderBookRow[] => {
    const rows: OrderBookRow[] = [];
    
    // Add asks (highest to lowest price, reverse order for display)
    const sortedAsks = [...book.asks]
      .sort((a, b) => b.price - a.price) // Highest ask first
      .slice(0, 15); // Limit to 15 levels

    let askTotal = 0;
    sortedAsks.forEach((ask, index) => {
      askTotal += ask.price * ask.qty;
      rows.push({
        id: `ask-${index}`,
        price: ask.price,
        qty: ask.qty,
        side: 'ask',
        total: askTotal,
      });
    });

    // Add a separator row (mid price)
    if (book.bids.length > 0 && book.asks.length > 0) {
      const midPrice = (book.bids[0].price + book.asks[0].price) / 2;
      rows.push({
        id: 'spread',
        price: midPrice,
        qty: 0,
        side: 'ask' as any,
        total: 0,
      });
    }

    // Add bids (highest to lowest price)
    const sortedBids = [...book.bids]
      .sort((a, b) => b.price - a.price) // Highest bid first
      .slice(0, 15); // Limit to 15 levels

    let bidTotal = 0;
    sortedBids.forEach((bid, index) => {
      bidTotal += bid.price * bid.qty;
      rows.push({
        id: `bid-${index}`,
        price: bid.price,
        qty: bid.qty,
        side: 'bid',
        total: bidTotal,
      });
    });

    return rows;
  }, []);

  // Update grid when orderBook changes
  useEffect(() => {
    if (!gridApi || !orderBook) {
      lastOrderBookRef.current = null;
      return;
    }

    try {
      const currentRows = transformOrderBookToRows(orderBook);
      
      // Only update if this is the first update or timestamp changed
      if (!lastOrderBookRef.current || lastOrderBookRef.current.ts !== orderBook.ts) {
        // Clear existing data and set new data
        gridApi.setGridOption('rowData', currentRows);
        
        // Auto-size columns after update
        setTimeout(() => {
          if (gridApi) {
            gridApi.sizeColumnsToFit();
          }
        }, 0);
        
        lastOrderBookRef.current = orderBook;
      }
    } catch (error) {
      console.error('Error updating order book grid:', error);
    }
  }, [orderBook, gridApi, transformOrderBookToRows]);

  return (
    <div className={className} style={{ height: 400, width: '100%' }} data-testid="order-book-grid">
      {!orderBook ? (
        <div className="h-full flex items-center justify-center bg-gray-50 border-2 border-dashed border-gray-300 rounded">
          <div className="text-center text-gray-500">
            <div className="text-2xl mb-2">📊</div>
            <p>No order book data</p>
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
          rowData={[]} // Data is set via applyTransactionAsync
          getRowId={(params) => params.data.id}
          suppressRowTransform={true}
        />
      )}
      
      {orderBook && (
        <div className="text-xs text-gray-500 mt-2 px-2">
          Last update: {new Date(orderBook.ts).toLocaleTimeString()}
          {orderBook.bids.length > 0 && orderBook.asks.length > 0 && (
            <span className="ml-4">
              Spread: {(orderBook.asks[0].price - orderBook.bids[0].price).toFixed(2)}
            </span>
          )}
        </div>
      )}
    </div>
  );
});