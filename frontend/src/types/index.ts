export interface KpiResult {
  gmv: number;
  totalShipping: number;
  revenue: number;
  orders: number;
  totalItems: number;
  canceledOrders: number;
  deliveredOrders: number;
  onTimeCount: number;
  aov: number;
  itemsPerOrder: number;
  cancellationRate: number;
  onTimeDeliveryRate: number;
}

export interface TrendPoint {
  period: string;
  revenue: number;
  orders: number;
}

export interface TopProduct {
  productId: string;
  categoryName: string | null;
  categoryNameEnglish: string | null;
  gmv: number;
  revenue: number;
}

export interface Filters {
  from: string;
  to: string;
  orderStatus: string;
  customerState: string;
  grain: 'day' | 'week';
}

export type ProductMetric = 'gmv' | 'revenue';
