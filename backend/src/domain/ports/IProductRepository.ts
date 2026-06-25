import { TopProduct } from '../entities/TopProduct';

export type ProductMetric = 'gmv' | 'revenue';

export interface ProductFilters {
  from: string;
  to: string;
  metric: ProductMetric;
  limit: number;
  orderStatus?: string;
  customerState?: string;
  categoryName?: string;
}

export interface IProductRepository {
  getTopProducts(filters: ProductFilters): Promise<TopProduct[]>;
}
