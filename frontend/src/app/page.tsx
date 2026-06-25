'use client';
import { useState } from 'react';
import { Filters, ProductMetric } from '../types';
import { FiltersPanel } from '../components/FiltersPanel';
import { KpiCard } from '../components/KpiCard';
import { TrendChart } from '../components/TrendChart';
import { ProductsTable } from '../components/ProductsTable';
import { useKpis } from '../hooks/useKpis';
import { useTrend } from '../hooks/useTrend';
import { useProducts } from '../hooks/useProducts';

const DEFAULT_FILTERS: Filters = {
  from: '2017-01-01',
  to: '2018-12-31',
  orderStatus: '',
  customerState: '',
  grain: 'day',
};

function fmtBRL(n: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(n);
}
function fmtPct(n: number) {
  return `${(n * 100).toFixed(1)}%`;
}
function fmtNum(n: number, dec = 2) {
  return n.toFixed(dec);
}

export default function DashboardPage() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [productMetric, setProductMetric] = useState<ProductMetric>('revenue');

  const { data: kpis, loading: kpiLoading, error: kpiError } = useKpis(filters);
  const { data: trend, loading: trendLoading } = useTrend(filters);
  const { data: products, loading: productsLoading } = useProducts(filters, productMetric, 10);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <FiltersPanel filters={filters} onChange={setFilters} />

      {/* Error */}
      {kpiError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded px-4 py-3 text-sm">
          Error loading KPIs: {kpiError}
        </div>
      )}

      {/* KPI Cards */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">Overview</h2>
        {kpiLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow p-5 animate-pulse h-20" />
            ))}
          </div>
        ) : kpis ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard
              title="GMV"
              value={fmtBRL(kpis.gmv)}
              subtitle={`Shipping: ${fmtBRL(kpis.totalShipping)}`}
              color="blue"
            />
            <KpiCard
              title="Revenue (Paid)"
              value={fmtBRL(kpis.revenue)}
              color="green"
            />
            <KpiCard
              title="Orders"
              value={kpis.orders.toLocaleString()}
              color="purple"
            />
            <KpiCard
              title="AOV"
              value={fmtBRL(kpis.aov)}
              subtitle="Revenue / Orders"
              color="teal"
            />
            <KpiCard
              title="Items per Order"
              value={fmtNum(kpis.itemsPerOrder)}
              color="yellow"
            />
            <KpiCard
              title="Cancellation Rate"
              value={fmtPct(kpis.cancellationRate)}
              subtitle="canceled+unavailable / total"
              color="red"
            />
            <KpiCard
              title="On-Time Delivery"
              value={fmtPct(kpis.onTimeDeliveryRate)}
              subtitle="of delivered orders"
              color="green"
            />
            <KpiCard
              title="Delivered Orders"
              value={kpis.deliveredOrders.toLocaleString()}
              color="teal"
            />
          </div>
        ) : null}
      </section>

      {/* Revenue Trend */}
      <section className="bg-white rounded-xl shadow p-5">
        <h2 className="text-lg font-bold text-gray-700 mb-4">Revenue & Orders Trend</h2>
        <TrendChart data={trend} loading={trendLoading} />
      </section>

      {/* Rankings */}
      <ProductsTable
        data={products}
        loading={productsLoading}
        metric={productMetric}
        onMetricChange={setProductMetric}
      />
    </div>
  );
}
