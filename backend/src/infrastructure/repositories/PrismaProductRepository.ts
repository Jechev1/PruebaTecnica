import { Prisma } from '@prisma/client';
import prisma from '../db/prismaClient';
import { IProductRepository, ProductFilters } from '../../domain/ports/IProductRepository';
import { TopProduct } from '../../domain/entities/TopProduct';

interface ProductRow {
  product_id: string;
  category_name: string | null;
  category_name_english: string | null;
  gmv: string;
  revenue: string;
}

export class PrismaProductRepository implements IProductRepository {
  async getTopProducts(filters: ProductFilters): Promise<TopProduct[]> {
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
    const orderCol =
      filters.metric === 'gmv'
        ? Prisma.sql`SUM(fs.item_price)`
        : Prisma.sql`SUM(fs.payment_value_allocated)`;

    const rows = await prisma.$queryRaw<ProductRow[]>(Prisma.sql`
      SELECT
        fs.product_id,
        dp.category_name,
        dp.category_name_english,
        COALESCE(SUM(fs.item_price), 0)::text                AS gmv,
        COALESCE(SUM(fs.payment_value_allocated), 0)::text   AS revenue
      FROM gold.fact_sales fs
      JOIN gold.dim_date     dd   ON fs.date_id     = dd.date_id
      JOIN gold.dim_order    dord ON fs.order_id    = dord.order_id
      JOIN gold.dim_product  dp   ON fs.product_id  = dp.product_id
      JOIN gold.dim_customer dc   ON fs.customer_id = dc.customer_id
      WHERE ${where}
      GROUP BY fs.product_id, dp.category_name, dp.category_name_english
      ORDER BY ${orderCol} DESC
      LIMIT ${filters.limit}
    `);

    return rows.map((r) => ({
      productId: r.product_id,
      categoryName: r.category_name,
      categoryNameEnglish: r.category_name_english,
      gmv: parseFloat(r.gmv ?? '0'),
      revenue: parseFloat(r.revenue ?? '0'),
    }));
  }
}
