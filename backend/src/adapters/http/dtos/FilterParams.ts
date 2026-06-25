import { z } from 'zod';

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD');

export const baseFiltersSchema = z.object({
  from: dateSchema,
  to: dateSchema,
  order_status: z.string().optional(),
  customer_state: z.string().optional(),
  category: z.string().optional(),
});

export const trendFiltersSchema = baseFiltersSchema.extend({
  grain: z.enum(['day', 'week']).default('day'),
});

export const productFiltersSchema = baseFiltersSchema.extend({
  metric: z.enum(['gmv', 'revenue']).default('revenue'),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type BaseFilters = z.infer<typeof baseFiltersSchema>;
export type TrendFiltersDto = z.infer<typeof trendFiltersSchema>;
export type ProductFiltersDto = z.infer<typeof productFiltersSchema>;
