import { z } from 'zod';

export const CandleSchema = z.object({
  t: z.number(), // timestamp
  o: z.number(), // open
  h: z.number(), // high
  l: z.number(), // low
  c: z.number(), // close
  v: z.number(), // volume
});

export type Candle = z.infer<typeof CandleSchema>;

export const createCandle = (data: unknown): Candle => {
  return CandleSchema.parse(data);
};

export const isValidCandle = (data: unknown): data is Candle => {
  return CandleSchema.safeParse(data).success;
};

export const candleToLightweightChartFormat = (candle: Candle) => ({
  time: Math.floor(candle.t / 1000), // Convert to seconds for Lightweight Charts
  open: candle.o,
  high: candle.h,
  low: candle.l,
  close: candle.c,
});

export const candleToVolumeFormat = (candle: Candle) => ({
  time: Math.floor(candle.t / 1000),
  value: candle.v,
});