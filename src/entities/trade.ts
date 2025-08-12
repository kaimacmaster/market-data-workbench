import { z } from 'zod';

export const TradeSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  price: z.number().positive(),
  qty: z.number().positive(),
  side: z.enum(['buy', 'sell']),
  ts: z.number(), // timestamp
});

export type Trade = z.infer<typeof TradeSchema>;

export const createTrade = (data: unknown): Trade => {
  return TradeSchema.parse(data);
};

export const isValidTrade = (data: unknown): data is Trade => {
  return TradeSchema.safeParse(data).success;
};