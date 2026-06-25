import { KpiResult } from '../entities/KpiResult';

export interface KpiFilters {
  from: string; // YYYY-MM-DD
  to: string;
  orderStatus?: string;
  customerState?: string;
  categoryName?: string;
}

export interface IKpiRepository {
  getKpis(filters: KpiFilters): Promise<KpiResult>;
}
