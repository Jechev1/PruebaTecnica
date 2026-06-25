import { Request, Response } from 'express';
import { GetKpis } from '../../../application/GetKpis';
import { baseFiltersSchema } from '../dtos/FilterParams';
import { AppError } from '../../../domain/errors/AppError';

export class KpiController {
  constructor(private readonly getKpis: GetKpis) {}

  handle = async (req: Request, res: Response): Promise<void> => {
    const parsed = baseFiltersSchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid params', details: parsed.error.flatten() });
      return;
    }

    const { from, to, order_status, customer_state, category } = parsed.data;

    try {
      const result = await this.getKpis.execute({
        from,
        to,
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
