import { IKpiRepository, KpiFilters } from '../domain/ports/IKpiRepository';
import { KpiResult } from '../domain/entities/KpiResult';
import { ValidationError } from '../domain/errors/AppError';

function daysBetween(a: Date, b: Date): number {
  return Math.ceil((b.getTime() - a.getTime()) / 86_400_000);
}

export class GetKpis {
  private static readonly MAX_RANGE_DAYS = 1100;

  constructor(private readonly kpiRepository: IKpiRepository) {}

  async execute(filters: KpiFilters): Promise<KpiResult> {
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

    if (daysBetween(from, to) > GetKpis.MAX_RANGE_DAYS) {
      throw new ValidationError(
        `Date range cannot exceed ${GetKpis.MAX_RANGE_DAYS} days. ` +
          'Split the query into smaller windows for multi-year analysis.',
      );
    }

    return this.kpiRepository.getKpis(filters);
  }
}
