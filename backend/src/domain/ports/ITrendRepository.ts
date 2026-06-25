import { TrendPoint } from '../entities/TrendPoint';

export type Grain = 'day' | 'week';

export interface TrendFilters {
  from: string;
  to: string;
  grain: Grain;
  orderStatus?: string;
  customerState?: string;
  categoryName?: string;
}

export interface ITrendRepository {
  getRevenueTrend(filters: TrendFilters): Promise<TrendPoint[]>;
}
