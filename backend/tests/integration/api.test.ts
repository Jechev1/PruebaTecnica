import request from 'supertest';
import express from 'express';

jest.mock('../../src/infrastructure/db/prismaClient', () => ({
  default: { $queryRaw: jest.fn() },
}));

import prisma from '../../src/infrastructure/db/prismaClient';
import { buildRouter } from '../../src/adapters/http/routes';

// Isolated test app — no helmet/rate-limit overhead, same business routing
const app = express();
app.use(express.json());
app.use('/', buildRouter());

// --- Mock data shaped exactly as PrismaRepository expects from $queryRaw ---

const kpiRow = {
  gmv: '10000.00',
  total_shipping: '500.00',
  revenue: '9500.00',
  orders: BigInt(100),
  total_items: BigInt(150),
  canceled_orders: BigInt(5),
  delivered_orders: BigInt(80),
  on_time_count: BigInt(70),
};

const trendRow = [
  { period: new Date('2017-01-01'), revenue: '1000.00', orders: BigInt(10) },
];

const productRow = [
  {
    product_id: 'sku-olist-001',
    category_name: 'esportes_lazer',
    category_name_english: 'sports_leisure',
    gmv: '5000.00',
    revenue: '4800.00',
  },
];

describe('API – integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.$queryRaw as jest.Mock).mockResolvedValue([kpiRow]);
  });

  // Health

  it('GET /health → 200 ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  // KPIs

  it('GET /kpis with valid range → returns all KPI fields', async () => {
    const res = await request(app).get('/kpis?from=2017-01-01&to=2017-12-31');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      gmv: expect.any(Number),
      revenue: expect.any(Number),
      orders: expect.any(Number),
      aov: expect.any(Number),
      cancellationRate: expect.any(Number),
      onTimeDeliveryRate: expect.any(Number),
    });
  });

  it('GET /kpis without dates → 400', async () => {
    const res = await request(app).get('/kpis');
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('GET /kpis with malformed date → 400', async () => {
    const res = await request(app).get('/kpis?from=01-2017-01&to=2017-12-31');
    expect(res.status).toBe(400);
  });

  // Trend

  it('GET /trend/revenue with day grain → 200 array', async () => {
    (prisma.$queryRaw as jest.Mock).mockResolvedValue(trendRow);
    const res = await request(app).get('/trend/revenue?from=2017-01-01&to=2017-12-31&grain=day');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty('period');
    expect(res.body[0]).toHaveProperty('revenue');
  });

  it('GET /trend/revenue with invalid grain → 400', async () => {
    const res = await request(app).get('/trend/revenue?from=2017-01-01&to=2017-12-31&grain=month');
    expect(res.status).toBe(400);
  });

  // Rankings

  it('GET /rankings/products with gmv metric → 200 array', async () => {
    (prisma.$queryRaw as jest.Mock).mockResolvedValue(productRow);
    const res = await request(app).get(
      '/rankings/products?from=2017-01-01&to=2017-12-31&metric=gmv&limit=5',
    );
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty('productId');
  });

  it('GET /rankings/products with invalid metric → 400', async () => {
    const res = await request(app).get(
      '/rankings/products?from=2017-01-01&to=2017-12-31&metric=profit',
    );
    expect(res.status).toBe(400);
  });

  it('GET /rankings/products with limit > 100 → 400', async () => {
    const res = await request(app).get(
      '/rankings/products?from=2017-01-01&to=2017-12-31&metric=revenue&limit=200',
    );
    expect(res.status).toBe(400);
  });

  it('unknown route → 404', async () => {
    const res = await request(app).get('/does-not-exist');
    expect(res.status).toBe(404);
  });
});
