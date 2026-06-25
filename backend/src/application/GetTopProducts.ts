import { IProductRepository, ProductFilters } from '../domain/ports/IProductRepository';
import { TopProduct } from '../domain/entities/TopProduct';
import { ValidationError } from '../domain/errors/AppError';

const MAX_LIMIT = 100;

export class GetTopProducts {
  constructor(private readonly productRepository: IProductRepository) {}

  async execute(filters: ProductFilters): Promise<TopProduct[]> {
    if (!filters.from || !filters.to) {
      throw new ValidationError('from and to dates are required (YYYY-MM-DD)');
    }

    const from = new Date(filters.from);
    const to = new Date(filters.to);

    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      throw new ValidationError('Invalid date format — use YYYY-MM-DD');
    }

    if (from > to) {
      throw new ValidationError('"from" must be on or before "to"');
    }

    if (!['gmv', 'revenue'].includes(filters.metric)) {
      throw new ValidationError('metric must be "gmv" or "revenue"');
    }

    if (filters.limit < 1 || filters.limit > MAX_LIMIT) {
      throw new ValidationError(`limit must be between 1 and ${MAX_LIMIT}`);
    }

    return this.productRepository.getTopProducts(filters);
  }
}
