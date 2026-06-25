import { Prisma } from '@prisma/client';
import prisma from '../db/prismaClient';
import { ITrendRepository, TrendFilters } from '../../domain/ports/ITrendRepository';
import { TrendPoint } from '../../domain/entities/TrendPoint';

interface TrendRow {
  period: Date;
  revenue: string;
  orders: bigint;
}

export class PrismaTrendRepository implements ITrendRepository {
  async getRevenueTrend(filters: TrendFilters): Promise<TrendPoint[]> {
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

    // Truncate to day or start-of-week (Monday) for grouping
    const periodExpr =
      filters.grain === 'week'
        ? Prisma.sql`date_trunc('week', dd.full_date)::date`
        : Prisma.sql`dd.full_date`;

    const rows = await prisma.$queryRaw<TrendRow[]>(Prisma.sql`
      SELECT
        ${periodExpr}                                   AS period,
        COALESCE(SUM(fs.payment_value_allocated), 0)::text AS revenue,
        COUNT(DISTINCT fs.order_id)                     AS orders
      FROM gold.fact_sales fs
      JOIN gold.dim_date     dd   ON fs.date_id     = dd.date_id
      JOIN gold.dim_order    dord ON fs.order_id    = dord.order_id
      JOIN gold.dim_product  dp   ON fs.product_id  = dp.product_id
      JOIN gold.dim_customer dc   ON fs.customer_id = dc.customer_id
      WHERE ${where}
      GROUP BY 1
      ORDER BY 1
    `);

    return rows.map((r) => ({
      period: r.period instanceof Date ? r.period.toISOString().slice(0, 10) : String(r.period),
      revenue: parseFloat(r.revenue ?? '0'),
      orders: Number(r.orders ?? 0),
    }));
  }
}
