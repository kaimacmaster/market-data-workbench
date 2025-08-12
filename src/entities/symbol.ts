import { z } from 'zod';

export const SymbolSchema = z.object({
  id: z.string(),
  base: z.string(),
  quote: z.string(),
  displayName: z.string(),
  status: z.enum(['active', 'inactive', 'delisted']).default('active'),
  tickSize: z.number().positive().optional(),
  minQty: z.number().positive().optional(),
  maxQty: z.number().positive().optional(),
});

export type Symbol = z.infer<typeof SymbolSchema>;

export const createSymbol = (data: unknown): Symbol => {
  return SymbolSchema.parse(data);
};

export const isValidSymbol = (data: unknown): data is Symbol => {
  return SymbolSchema.safeParse(data).success;
};