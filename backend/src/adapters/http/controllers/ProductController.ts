import { Request, Response } from 'express';
import { GetTopProducts } from '../../../application/GetTopProducts';
import { productFiltersSchema } from '../dtos/FilterParams';
import { ProductMetric } from '../../../domain/ports/IProductRepository';
import { AppError } from '../../../domain/errors/AppError';

export class ProductController {
  constructor(private readonly getTopProducts: GetTopProducts) {}

  handle = async (req: Request, res: Response): Promise<void> => {
    const parsed = productFiltersSchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid params', details: parsed.error.flatten() });
      return;
    }

    const { from, to, metric, limit, order_status, customer_state, category } = parsed.data;

    try {
      const result = await this.getTopProducts.execute({
        from,
        to,
        metric: metric as ProductMetric,
        limit,
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
