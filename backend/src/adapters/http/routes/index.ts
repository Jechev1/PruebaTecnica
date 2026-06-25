import { Router } from 'express';
import { KpiController } from '../controllers/KpiController';
import { TrendController } from '../controllers/TrendController';
import { ProductController } from '../controllers/ProductController';
import { GetKpis } from '../../../application/GetKpis';
import { GetRevenueTrend } from '../../../application/GetRevenueTrend';
import { GetTopProducts } from '../../../application/GetTopProducts';
import { PrismaKpiRepository } from '../../../infrastructure/repositories/PrismaKpiRepository';
import { PrismaTrendRepository } from '../../../infrastructure/repositories/PrismaTrendRepository';
import { PrismaProductRepository } from '../../../infrastructure/repositories/PrismaProductRepository';

export function buildRouter(): Router {
  const router = Router();

  // Dependency injection wiring
  const kpiRepo = new PrismaKpiRepository();
  const trendRepo = new PrismaTrendRepository();
  const productRepo = new PrismaProductRepository();

  const kpiCtrl = new KpiController(new GetKpis(kpiRepo));
  const trendCtrl = new TrendController(new GetRevenueTrend(trendRepo));
  const productCtrl = new ProductController(new GetTopProducts(productRepo));

  router.get('/health', (_req, res) => res.json({ status: 'ok' }));
  router.get('/kpis', kpiCtrl.handle);
  router.get('/trend/revenue', trendCtrl.handle);
  router.get('/rankings/products', productCtrl.handle);

  return router;
}
