import type { Symbol } from '../../entities';

export const defaultSymbols: Symbol[] = [
  {
    id: 'BTCUSDT',
    base: 'BTC',
    quote: 'USDT',
    displayName: 'Bitcoin / Tether',
    status: 'active',
  },
  {
    id: 'ETHUSDT',
    base: 'ETH',
    quote: 'USDT',
    displayName: 'Ethereum / Tether',
    status: 'active',
  },
  {
    id: 'SOLUSDT',
    base: 'SOL',
    quote: 'USDT',
    displayName: 'Solana / Tether',
    status: 'active',
  },
  {
    id: 'ADAUSDT',
    base: 'ADA',
    quote: 'USDT',
    displayName: 'Cardano / Tether',
    status: 'active',
  },
];