export interface KpiResult {
  gmv: number;
  totalShipping: number;
  revenue: number;
  orders: number;
  totalItems: number;
  canceledOrders: number;
  deliveredOrders: number;
  onTimeCount: number;
  // derived
  aov: number;
  itemsPerOrder: number;
  cancellationRate: number;
  onTimeDeliveryRate: number;
}
