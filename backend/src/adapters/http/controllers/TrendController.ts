import { Request, Response } from 'express';
import { GetRevenueTrend } from '../../../application/GetRevenueTrend';
import { trendFiltersSchema } from '../dtos/FilterParams';
import { Grain } from '../../../domain/ports/ITrendRepository';
import { AppError } from '../../../domain/errors/AppError';

export class TrendController {
  constructor(private readonly getRevenueTrend: GetRevenueTrend) {}

  handle = async (req: Request, res: Response): Promise<void> => {
    const parsed = trendFiltersSchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid params', details: parsed.error.flatten() });
      return;
    }

    const { from, to, grain, order_status, customer_state, category } = parsed.data;

    try {
      const result = await this.getRevenueTrend.execute({
        from,
        to,
        grain: grain as Grain,
        orderStatus: order_status,
        customerState: customer_state,
        categoryName: category,
      });
      res.json(result);
    } catch (err: unknown) {
      if (err instanceof AppError) {
        res.status(err.statusCode).json({ error: err.message, code: err.code });
        return;
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}
