import { Prisma } from '@prisma/client';
import prisma from '../db/prismaClient';
import { IKpiRepository, KpiFilters } from '../../domain/ports/IKpiRepository';
import { KpiResult } from '../../domain/entities/KpiResult';

interface KpiRow {
  gmv: string;
  total_shipping: string;
  revenue: string;
  orders: bigint;
  total_items: bigint;
  canceled_orders: bigint;
  delivered_orders: bigint;
  on_time_count: bigint;
}

export class PrismaKpiRepository implements IKpiRepository {
  async getKpis(filters: KpiFilters): Promise<KpiResult> {
    const conditions: Prisma.Sql[] = [
      Prisma.sql`dd.full_date >= ${filters.from}::date`,
      Prisma.sql`dd.full_date <= ${filters.to}::date`,
    ];

    if (filters.orderStatus) {
      conditions.push(Prisma.sql`dord.order_status = ${filters.orderStatus}`);
    }
    if (filters.categoryName) {
      conditions.push(Prisma.sql`dp.category_name_english = ${filters.categoryName}`);
    }
    if (filters.customerState) {
      conditions.push(Prisma.sql`dc.customer_state = ${filters.customerState}`);
    }

    const where = Prisma.join(conditions, ' AND ');

    const rows = await prisma.$queryRaw<KpiRow[]>(Prisma.sql`
      SELECT
        COALESCE(SUM(fs.item_price), 0)::text                                                         AS gmv,
        COALESCE(SUM(fs.freight_value), 0)::text                                                      AS total_shipping,
        COALESCE(SUM(fs.payment_value_allocated), 0)::text                                            AS revenue,
        COUNT(DISTINCT fs.order_id)                                                                   AS orders,
        COUNT(fs.order_item_id)                                                                       AS total_items,
        COUNT(DISTINCT CASE WHEN fs.is_canceled THEN fs.order_id END)                                AS canceled_orders,
        COUNT(DISTINCT CASE WHEN fs.is_delivered THEN fs.order_id END)                               AS delivered_orders,
        COUNT(CASE WHEN fs.is_on_time = true THEN 1 END)                                              AS on_time_count
      FROM gold.fact_sales fs
      JOIN gold.dim_date     dd   ON fs.date_id     = dd.date_id
      JOIN gold.dim_order    dord ON fs.order_id    = dord.order_id
      JOIN gold.dim_product  dp   ON fs.product_id  = dp.product_id
      JOIN gold.dim_customer dc   ON fs.customer_id = dc.customer_id
      WHERE ${where}
    `);

    const row = rows[0];
    const gmv = parseFloat(row.gmv ?? '0');
    const revenue = parseFloat(row.revenue ?? '0');
    const orders = Number(row.orders ?? 0);
    const totalItems = Number(row.total_items ?? 0);
    const canceledOrders = Number(row.canceled_orders ?? 0);
    const deliveredOrders = Number(row.delivered_orders ?? 0);
    const onTimeCount = Number(row.on_time_count ?? 0);

    return {
      gmv,
      totalShipping: parseFloat(row.total_shipping ?? '0'),
      revenue,
      orders,
      totalItems,
      canceledOrders,
      deliveredOrders,
      onTimeCount,
      aov: orders > 0 ? revenue / orders : 0,
      itemsPerOrder: orders > 0 ? totalItems / orders : 0,
      cancellationRate: orders > 0 ? canceledOrders / orders : 0,
      onTimeDeliveryRate: deliveredOrders > 0 ? onTimeCount / deliveredOrders : 0,
    };
  }
}
