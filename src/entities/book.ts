import { z } from 'zod';

export const BookEntrySchema = z.object({
  price: z.number().positive(),
  qty: z.number().nonnegative(),
});

export const OrderBookSchema = z.object({
  symbol: z.string(),
  bids: z.array(BookEntrySchema),
  asks: z.array(BookEntrySchema),
  lastUpdateId: z.number().optional(),
  ts: z.number(), // timestamp
});

export type BookEntry = z.infer<typeof BookEntrySchema>;
export type OrderBook = z.infer<typeof OrderBookSchema>;

export const createOrderBook = (data: unknown): OrderBook => {
  return OrderBookSchema.parse(data);
};

export const isValidOrderBook = (data: unknown): data is OrderBook => {
  return OrderBookSchema.safeParse(data).success;
};

export const getSpread = (book: OrderBook): number | null => {
  const bestBid = book.bids[0]?.price;
  const bestAsk = book.asks[0]?.price;
  
  if (!bestBid || !bestAsk) return null;
  
  return bestAsk - bestBid;
};

export const getMidPrice = (book: OrderBook): number | null => {
  const bestBid = book.bids[0]?.price;
  const bestAsk = book.asks[0]?.price;
  
  if (!bestBid || !bestAsk) return null;
  
  return (bestBid + bestAsk) / 2;
};