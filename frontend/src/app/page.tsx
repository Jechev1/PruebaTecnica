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
  from: '2016-09-01',
  to: '2018-12-31',
  orderStatus: '',
  customerState: '',
  grain: 'day',
};

// Average BRL/USD exchange rate for the 2017-2018 dataset period
const BRL_TO_USD = 3.40;

type Currency = 'BRL' | 'USD';

function fmtMoney(n: number, currency: Currency) {
  if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n / BRL_TO_USD);
  }
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
  const [currency, setCurrency] = useState<Currency>('BRL');

  const { data: kpis, loading: kpiLoading, error: kpiError } = useKpis(filters);
  const { data: trend, loading: trendLoading } = useTrend(filters);
  const { data: products, loading: productsLoading } = useProducts(filters, productMetric, 10);

  const fmt = (n: number) => fmtMoney(n, currency);

  return (
    <div className="space-y-6">
      <FiltersPanel filters={filters} onChange={setFilters} />

      {kpiError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded px-4 py-3 text-sm">
          Error loading KPIs: {kpiError}
        </div>
      )}

      {/* KPI Cards */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Overview</h2>
          {/* Currency toggle */}
          <div className="flex items-center gap-2">
            {currency === 'USD' && (
              <span className="text-xs text-slate-400 dark:text-slate-500 hidden sm:block">
                ≈ 1 USD = R$3.40 (2017–18 avg)
              </span>
            )}
            <div className="flex gap-1 bg-slate-200 dark:bg-slate-700 rounded-lg p-1">
              {(['BRL', 'USD'] as Currency[]).map((c) => (
                <button
                  key={c}
                  onClick={() => setCurrency(c)}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all duration-150 ${
                    currency === c
                      ? 'bg-white dark:bg-slate-500 text-violet-700 dark:text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>

        {kpiLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-5 animate-pulse h-24" />
            ))}
          </div>
        ) : kpis ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard title="GMV" value={fmt(kpis.gmv)} subtitle={`Shipping: ${fmt(kpis.totalShipping)}`} color="blue" />
            <KpiCard title="Revenue (Paid)" value={fmt(kpis.revenue)} color="green" />
            <KpiCard title="Orders" value={kpis.orders.toLocaleString()} color="purple" />
            <KpiCard title="AOV" value={fmt(kpis.aov)} subtitle="Revenue / Orders" color="teal" />
            <KpiCard title="Items per Order" value={fmtNum(kpis.itemsPerOrder)} color="yellow" />
            <KpiCard title="Cancellation Rate" value={fmtPct(kpis.cancellationRate)} subtitle="canceled+unavailable / total" color="red" />
            <KpiCard title="On-Time Delivery" value={fmtPct(kpis.onTimeDeliveryRate)} subtitle="of delivered orders" color="green" />
            <KpiCard title="Delivered Orders" value={kpis.deliveredOrders.toLocaleString()} color="teal" />
          </div>
        ) : null}
      </section>

      {/* Revenue Trend */}
      <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">Revenue & Orders Trend</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Filtered by selected date range</p>
          </div>
        </div>
        <TrendChart data={trend} loading={trendLoading} currency={currency} conversionRate={BRL_TO_USD} />
      </section>

      <ProductsTable
        data={products}
        loading={productsLoading}
        metric={productMetric}
        onMetricChange={setProductMetric}
        currency={currency}
        conversionRate={BRL_TO_USD}
      />
    </div>
  );
}
