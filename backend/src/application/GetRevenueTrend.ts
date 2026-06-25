import { ITrendRepository, TrendFilters } from '../domain/ports/ITrendRepository';
import { TrendPoint } from '../domain/entities/TrendPoint';
import { ValidationError } from '../domain/errors/AppError';

function daysBetween(a: Date, b: Date): number {
  return Math.ceil((b.getTime() - a.getTime()) / 86_400_000);
}

const MAX_DAYS: Record<'day' | 'week', number> = {
  day: 800,
  week: 1100,
};

export class GetRevenueTrend {
  constructor(private readonly trendRepository: ITrendRepository) {}

  async execute(filters: TrendFilters): Promise<TrendPoint[]> {
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

    if (!['day', 'week'].includes(filters.grain)) {
      throw new ValidationError('grain must be "day" or "week"');
    }

    const days = daysBetween(from, to);
    const maxDays = MAX_DAYS[filters.grain];

    if (days > maxDays) {
      throw new ValidationError(
        `A ${filters.grain} grain over ${days} days would return ${days} data points. ` +
          `Max is ${maxDays}. Switch to grain=week for wider ranges.`,
      );
    }

    return this.trendRepository.getRevenueTrend(filters);
  }
}
