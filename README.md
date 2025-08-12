# Market Data Workbench (React + TypeScript)

A real‑time, data‑centric UI showcasing FE architecture, performance, and scalability. It pairs **AG Grid** for high‑throughput tabular data with **TradingView Lightweight Charts** for candlesticks, pushes heavy compute into **Web Workers** (via Comlink), and caches snapshots in **IndexedDB** for instant loads.

> **Why this exists**: A compact, production‑lean demo that mirrors a fintech workflow (grid + charts + streaming) and shows leadership across architecture, DX, and performance.

---

## TL;DR (for reviewers)

- **Stack**: React 18, TS 5, Vite, AG Grid, Lightweight Charts, TanStack Query, Zustand, Comlink, Dexie, Vitest/Playwright.
- **Perf**: Message batching (60–120 ms), `applyTransactionAsync` in AG Grid, workerised indicators, IndexedDB warm‑start, memoised selectors, transferables.
- **UX**: Keyboard‑friendly, accessible, responsive, themeable, persisted layout.
- **Scope**: Watchlist → Symbol page (Chart + Order Book + Trades) → Settings. Optional WASM.

---

## App structure

```
/src
  /app                 # App shell, routing, providers, theming
  /entities            # Domain models & types (Symbol, Candle, Trade, Book)
  /shared              # UI kit (buttons, cards), hooks, utils, config
  /services
    /market-feed       # WS client(s), reconnection, heartbeats, adapters
    /cache             # Dexie schemas and CRUD
    /workers           # indicators.worker.ts (Comlink), wasm/ (optional)
  /features
    /watchlist         # add/remove, pin, persistence
    /charts            # chart mount/update, indicators
    /orderbook         # L2 book grid
    /trades            # time & sales grid
    /settings          # theme, intervals, columns, latency mode
  /pages
    /home
    /symbol/[symbolId] # composition of features
```

### Architectural notes

- **Server state vs UI state**: TanStack Query for async/server data (snapshots, historical OHLCV); Zustand for ephemeral UI (panel toggles, selections).
- **Workers**: Comlink RPC; pure, stateless functions. Inputs/outputs are DTOs. Use `Transferable` buffers where possible.
- **Charts**: Keep series handles in refs; incremental `update` over `setData`; small diffs only.
- **Grids**: AG Grid Community with column autosize off by default, row animations off, async batched transactions, immutable store.
- **Caching**: Dexie per‑symbol stores for OHLCV; hydrate chart before live stream attaches.
- **Validation**: zod for inbound data and config validation.

---

## Features

### 1) Watchlist

- Symbol search/add/remove, pinning, re‑order
- Columns: last price, 24h %, volume, status badge (streaming/cached)

### 2) Symbol page

- **Candlestick chart** with volume sub‑series
- **Indicators**: EMA/VWAP/RSI computed in a worker
- **Order Book (L2)**: bids/asks AG Grid with delta colour banding and sticky mid
- **Trades (Time & Sales)**: AG Grid with throughput‑friendly updates

### 3) Settings & Layout

- Persisted to IndexedDB/localStorage
- Theme (dark/light), chart interval, update throttling profile

### 4) Offline/Resilience

- Historical cache → instant first paint
- WebSocket reconnect with backoff, missed‑bar backfill

---

## Key code snippets

**Typed worker (EMA example)**

```ts
// src/services/workers/indicators.worker.ts
import * as Comlink from "comlink";
export type Candle = Readonly<{
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}>;
export type EMAConfig = Readonly<{ period: number }>;

function ema(c: Candle[], { period }: EMAConfig): Float64Array {
  const k = 2 / (period + 1);
  const out = new Float64Array(c.length);
  let prev = c[0]?.c ?? 0;
  for (let i = 0; i < c.length; i++) {
    prev = i === 0 ? c[i].c : c[i].c * k + prev * (1 - k);
    out[i] = prev;
  }
  return out; // Transferable
}

Comlink.expose({ ema });
```

**Using the worker in React**

```ts
// src/features/charts/useIndicators.ts
import { useEffect, useRef } from "react";
import * as Comlink from "comlink";

export type WorkerAPI = {
  ema(candles: any[], cfg: { period: number }): Promise<Float64Array>;
};

export function useIndicators() {
  const ref = useRef<Comlink.Remote<WorkerAPI>>();
  useEffect(() => {
    const w = new Worker(
      new URL("../../services/workers/indicators.worker.ts", import.meta.url),
      { type: "module" },
    );
    ref.current = Comlink.wrap<WorkerAPI>(w);
    return () => w.terminate();
  }, []);
  return ref;
}
```

**AG Grid (trades) cols**

```ts
// src/features/trades/columns.ts
import type { ColDef } from "ag-grid-community";
export const tradeCols: ColDef[] = [
  {
    field: "ts",
    headerName: "Time",
    valueFormatter: (p) => new Date(p.value).toLocaleTimeString(),
    sortable: true,
  },
  {
    field: "price",
    headerName: "Price",
    type: "rightAligned",
    valueFormatter: (p) => Number(p.value).toFixed(2),
  },
  { field: "qty", headerName: "Qty", type: "rightAligned" },
  {
    field: "side",
    headerName: "Side",
    cellClass: (p) => (p.value === "buy" ? "text-green-600" : "text-red-600"),
  },
];
```

**Lightweight chart mount**

```ts
// src/features/charts/mountCandle.ts
import { createChart } from "lightweight-charts";
export const mountCandle = (el: HTMLElement) => {
  const chart = createChart(el, { height: 340, timeScale: { rightOffset: 4 } });
  const candle = chart.addCandlestickSeries();
  const volume = chart.addHistogramSeries({ priceFormat: { type: "volume" } });
  return {
    setData: (candles: any[], volumes: any[]) => {
      candle.setData(candles);
      volume.setData(volumes);
    },
    update: (bar: any, vol: any) => {
      candle.update(bar);
      volume.update(vol);
    },
    destroy: () => chart.remove(),
  } as const;
};
```

---

## Performance playbook

- **Batching**: Buffer WS messages; flush at 60–120 ms.
- **Transferables**: Use `Float64Array`/`ArrayBuffer` across worker boundaries.
- **Grid updates**: `applyTransactionAsync` with immutable data; avoid full re‑renders.
- **Memoisation**: Reselect‑style selectors for derived UI state.
- **Rendering**: Avoid expensive column autosize and row animations during bursts.
- **Startup**: Hydrate from IndexedDB, then patch live; defer non‑critical fetches with `requestIdleCallback`.

---

## Scripts

- `dev` – Vite dev server
- `build` – production build
- `test` – unit tests with Vitest + JSDOM
- `test:e2e` – Playwright smoke suite (chart mounts, stream resumes)
- `lint` – ESLint/Prettier

---

## Milestones

- **M1**: Project scaffold, watchlist, symbol route, historical OHLCV cache → instant chart paint
- **M2**: Live WebSocket feed; trades + order book updating smoothly (AG Grid transactions)
- **M3**: Indicators in worker; settings persistence; Playwright smoke tests
- **M4 (optional)**: Rust/WASM EMA vs TS EMA with numbers in README

---

## How to run locally (dev data)

- Default adapter uses a public crypto feed over WebSocket (configurable env var).
- Includes a **mock feed** for deterministic tests and demo.

```
VITE_FEED=mock            # mock | binance | custom
VITE_DEFAULT_SYMBOL=BTCUSDT
```

---

## What to look for in the code

- Domain‑first `entities/` with strict types and runtime guards.
- Clear **feature boundaries** in `/features`.
- **Service adapters** decoupled from UI (swap feeds without touching components).
- **Worker contracts** as explicit TS interfaces.
- Tests around batching and indicator maths.

---

## Next steps / polish

- Depth chart (area series) with aggregated order book bins
- Persisted layouts (drag‑to‑dock)
- "Low‑latency" toggle that trades CPU vs staleness
- CI (GitHub Actions) with Playwright headed runs and artefact uploads

---
